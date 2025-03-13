import os
import json
import boto3
import logging
from datetime import datetime
import mimetypes
import uuid
import tempfile
import fitz  # PyMuPDF for PDF analysis
import re
from PIL import Image
import io

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

# DynamoDB tables
documents_table = dynamodb.Table(os.environ['DOCUMENTS_TABLE'])
doc_processing_table = dynamodb.Table(os.environ['DOC_PROCESSING_TABLE'])

# SQS queues
text_processing_queue = os.environ['TEXT_PROCESSING_QUEUE']
ocr_queue = os.environ['OCR_PROCESSING_QUEUE']

# S3 buckets
raw_bucket = os.environ['RAW_DOCUMENTS_BUCKET']
processed_bucket = os.environ['PROCESSED_DOCUMENTS_BUCKET']

# Document complexity thresholds
IMAGE_RATIO_THRESHOLD = 0.4  # If images cover more than 40% of document
TABLE_COMPLEXITY_THRESHOLD = 0.7  # Complex tables score
HANDWRITING_CONFIDENCE_THRESHOLD = 0.6  # Handwriting detection confidence

def download_file(bucket, key, local_path):
    """Download a file from S3 to a local path"""
    s3.download_file(bucket, key, local_path)
    return local_path

def analyze_pdf_content(file_path):
    """
    Analyze PDF content to determine if it needs OCR or text processing
    Returns a dict with analysis results
    """
    results = {
        'page_count': 0,
        'has_text': False,
        'text_ratio': 0.0,
        'image_ratio': 0.0,
        'has_tables': False,
        'table_complexity': 0.0,
        'has_handwriting': False,
        'handwriting_confidence': 0.0,
        'total_words': 0,
        'title': '',
        'needs_ocr': True  # Default to OCR
    }
    
    try:
        doc = fitz.open(file_path)
        results['page_count'] = len(doc)
        
        # Try to extract document title
        if doc.metadata and doc.metadata.get('title'):
            results['title'] = doc.metadata.get('title')
        else:
            # Use filename if no metadata title exists
            results['title'] = os.path.basename(file_path)
        
        total_page_area = 0
        total_text_area = 0
        total_image_area = 0
        total_words = 0
        has_complex_tables = False
        table_complexity_score = 0
        handwriting_detected = False
        
        for page_num, page in enumerate(doc):
            # Get page dimensions
            page_area = page.rect.width * page.rect.height
            total_page_area += page_area
            
            # Extract text
            text = page.get_text()
            words = len(text.split())
            total_words += words
            
            if words > 0:
                results['has_text'] = True
            
            # Check for tables by looking for regular patterns of lines or text blocks
            blocks = page.get_text("blocks")
            table_indicators = detect_tables(blocks, page)
            if table_indicators['has_tables']:
                has_complex_tables = True
                table_complexity_score = max(table_complexity_score, table_indicators['complexity'])
            
            # Analyze images
            image_list = page.get_images(full=True)
            page_image_area = 0
            for img_index, img_info in enumerate(image_list):
                xref = img_info[0]
                base_image = doc.extract_image(xref)
                image_area = estimate_image_area(base_image, page)
                page_image_area += image_area
                
                # Check for handwriting in images (simplified)
                if is_likely_handwriting(base_image):
                    handwriting_detected = True
                    results['handwriting_confidence'] = 0.8  # Simplified - would use ML model
            
            total_image_area += page_image_area
            
            # Estimate text area (simplified)
            text_spans = page.get_text("spans")
            page_text_area = sum([(span[3] - span[1]) * (span[2] - span[0]) for span in text_spans])
            total_text_area += page_text_area
        
        # Calculate ratios
        if total_page_area > 0:
            results['text_ratio'] = total_text_area / total_page_area
            results['image_ratio'] = total_image_area / total_page_area
        
        results['total_words'] = total_words
        results['has_tables'] = has_complex_tables
        results['table_complexity'] = table_complexity_score
        results['has_handwriting'] = handwriting_detected
        
        # Determine if OCR is needed
        needs_ocr = (
            results['image_ratio'] > IMAGE_RATIO_THRESHOLD or
            (results['has_tables'] and results['table_complexity'] > TABLE_COMPLEXITY_THRESHOLD) or
            (results['has_handwriting'] and results['handwriting_confidence'] > HANDWRITING_CONFIDENCE_THRESHOLD) or
            total_words < 50  # Very little text suggests images or scanned document
        )
        
        results['needs_ocr'] = needs_ocr
        
    except Exception as e:
        logger.error(f"Error analyzing PDF: {str(e)}")
        # Default to OCR if analysis fails
        results['needs_ocr'] = True
    
    return results

def detect_tables(blocks, page):
    """Detect tables in a page by analyzing text block patterns"""
    result = {
        'has_tables': False,
        'complexity': 0.0
    }
    
    # Simple table detection heuristic
    if len(blocks) < 4:
        return result
    
    # Check for grid-like arrangement of blocks
    x_positions = {}
    y_positions = {}
    
    for block in blocks:
        # Each block is (x0, y0, x1, y1, "text", block_no, block_type)
        x0, y0, x1, y1 = block[:4]
        
        # Round positions to account for slight misalignments
        rounded_x0 = round(x0 / 10) * 10
        rounded_y0 = round(y0 / 10) * 10
        
        if rounded_x0 not in x_positions:
            x_positions[rounded_x0] = 0
        x_positions[rounded_x0] += 1
        
        if rounded_y0 not in y_positions:
            y_positions[rounded_y0] = 0
        y_positions[rounded_y0] += 1
    
    # Calculate alignment scores
    x_alignment = max(x_positions.values()) / len(blocks) if blocks else 0
    y_alignment = max(y_positions.values()) / len(blocks) if blocks else 0
    
    # If we have good alignment in both directions, likely a table
    grid_score = (x_alignment + y_alignment) / 2
    
    # Check for lines on the page (common in tables)
    paths = page.get_drawings()
    line_count = sum(1 for path in paths if len(path["items"]) == 1)
    
    # Normalize line count to a score between 0 and 1
    line_score = min(1.0, line_count / 20)
    
    # Combine scores
    complexity = (grid_score * 0.7) + (line_score * 0.3)
    
    result['has_tables'] = grid_score > 0.5 or line_score > 0.7
    result['complexity'] = complexity
    
    return result

def estimate_image_area(image_data, page):
    """Estimate the area of an image relative to the page"""
    try:
        img_bytes = image_data["image"]
        img = Image.open(io.BytesIO(img_bytes))
        width, height = img.size
        
        # Get page dimensions
        page_width = page.rect.width
        page_height = page.rect.height
        
        # Simplified - would need to consider image position and scaling
        image_area = width * height
        return image_area
    except:
        return 0

def is_likely_handwriting(image_data):
    """
    Basic check for handwriting in an image
    In production, this would use an ML model
    """
    # This is a simplified placeholder
    # In reality, would use a pre-trained model to detect handwriting
    return False

def analyze_image_document(file_path):
    """
    Analyze an image document to determine if it contains text or handwriting
    """
    result = {
        'has_text': False,
        'has_handwriting': False,
        'needs_ocr': True,  # Images always need OCR
        'image_quality': 0.0,
        'resolution': (0, 0)
    }
    
    try:
        # Open image and analyze properties
        with Image.open(file_path) as img:
            result['resolution'] = img.size
            
            # Higher quality images have better OCR results
            width, height = img.size
            if width > 1000 and height > 1000:
                result['image_quality'] = 0.8
            elif width > 500 and height > 500:
                result['image_quality'] = 0.5
            else:
                result['image_quality'] = 0.3
                
            # More sophisticated analysis would detect text vs. handwriting
            # For now, assume all images need OCR
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
    
    return result

def analyze_text_document(file_path, ext):
    """
    Analyze text-based documents (.txt, .md, .doc, etc.)
    """
    result = {
        'has_text': True,
        'has_tables': False,
        'word_count': 0,
        'needs_ocr': False
    }
    
    try:
        # For .txt and .md, we can read directly
        if ext in ['.txt', '.md']:
            with open(file_path, 'r', errors='ignore') as f:
                content = f.read()
                result['word_count'] = len(content.split())
                
                # Check for potential tables using regex patterns
                table_patterns = [
                    r"\|[-|]+\|",  # Markdown tables
                    r"[+][-+]+[+]",  # ASCII tables
                    r"^\s*[A-Za-z0-9]+\s+[A-Za-z0-9]+\s+[A-Za-z0-9]+"  # Space-separated columns
                ]
                
                for pattern in table_patterns:
                    if re.search(pattern, content, re.MULTILINE):
                        result['has_tables'] = True
                        break
    except Exception as e:
        logger.error(f"Error analyzing text document: {str(e)}")
    
    return result

def detect_document_type(file_path, file_key, content_type):
    """
    Advanced document type detection with analysis to determine 
    if OCR is needed or text processing is sufficient
    """
    # Get file extension
    _, ext = os.path.splitext(file_key)
    ext = ext.lower()
    
    document_type = 'TEXT'  # Default
    analysis_results = {}
    
    # Determine document type and analyze content
    if ext in ['.pdf']:
        analysis_results = analyze_pdf_content(file_path)
        document_type = 'OCR' if analysis_results['needs_ocr'] else 'TEXT'
        
    elif ext in ['.txt', '.md', '.rtf']:
        analysis_results = analyze_text_document(file_path, ext)
        document_type = 'TEXT'
        
    elif ext in ['.doc', '.docx']:
        # Would use a library like python-docx for deeper analysis
        # For now, assume text processing is sufficient
        document_type = 'TEXT'
        analysis_results = {'needs_ocr': False, 'has_text': True}
        
    elif ext in ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']:
        analysis_results = analyze_image_document(file_path)
        document_type = 'OCR'
        
    elif ext in ['.xls', '.xlsx', '.csv']:
        # Spreadsheets may need special table extraction
        document_type = 'TABLE'
        analysis_results = {'needs_ocr': False, 'has_tables': True}
        
    else:
        # Default to OCR for unknown types
        document_type = 'OCR'
        analysis_results = {'needs_ocr': True}
    
    return document_type, analysis_results

def extract_metadata(document_id, file_path, file_key, document_type, analysis_results):
    """
    Extract comprehensive metadata from the document
    """
    metadata = {
        'id': document_id,
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat(),
        'filename': os.path.basename(file_key),
        'file_extension': os.path.splitext(file_key)[1].lower(),
        'file_size': os.path.getsize(file_path) if os.path.exists(file_path) else 0,
        'extraction_type': document_type,
        'analysis_details': analysis_results
    }
    
    # Add document type specific metadata
    if document_type == 'TEXT':
        metadata['title'] = analysis_results.get('title', os.path.basename(file_key))
        metadata['page_count'] = analysis_results.get('page_count', 1)
        metadata['word_count'] = analysis_results.get('total_words', 0)
        metadata['has_tables'] = analysis_results.get('has_tables', False)
        
    elif document_type == 'OCR':
        metadata['title'] = os.path.basename(file_key)
        metadata['requires_ocr'] = True
        metadata['page_count'] = analysis_results.get('page_count', 1)
        metadata['image_quality'] = analysis_results.get('image_quality', 0.0)
        metadata['has_handwriting'] = analysis_results.get('has_handwriting', False)
        
    elif document_type == 'TABLE':
        metadata['title'] = os.path.basename(file_key)
        metadata['requires_table_extraction'] = True
        
    return metadata

def update_document_status(document_id, status, metadata=None):
    """
    Update the document status in DynamoDB
    """
    update_expr = "SET #status = :status, updated_at = :updated_at"
    expr_attr_names = {'#status': 'status'}
    expr_attr_values = {
        ':status': status,
        ':updated_at': datetime.utcnow().isoformat()
    }
    
    # Add any additional metadata
    if metadata:
        for idx, (key, value) in enumerate(metadata.items()):
            update_expr += f", #{key} = :val{idx}"
            expr_attr_names[f'#{key}'] = key
            expr_attr_values[f':val{idx}'] = value
    
    documents_table.update_item(
        Key={'PK': f'doc#{document_id}', 'SK': 'metadata'},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_attr_names,
        ExpressionAttributeValues=expr_attr_values
    )
    
    # Record processing step in processing table
    doc_processing_table.put_item(Item={
        'PK': f'doc#{document_id}',
        'SK': f'process#{datetime.utcnow().isoformat()}',
        'status': status,
        'step': 'DOCUMENT_PARSING',
        'timestamp': datetime.utcnow().isoformat(),
        'service_type': 'document_parser'
    })

def store_metadata_in_s3(document_id, metadata):
    """
    Store full metadata in S3 for later retrieval
    """
    metadata_key = f"metadata/{document_id}/document_analysis.json"
    s3.put_object(
        Bucket=processed_bucket,
        Key=metadata_key,
        Body=json.dumps(metadata),
        ContentType='application/json'
    )
    return metadata_key

def queue_for_next_step(document_id, document_type, user_id, file_key, metadata):
    """
    Queue the document for its next processing step with rich metadata
    """
    message = {
        'document_id': document_id,
        'user_id': user_id,
        'file_key': file_key,
        'document_type': document_type,
        'metadata': {
            'title': metadata.get('title', ''),
            'page_count': metadata.get('page_count', 1),
            'has_tables': metadata.get('has_tables', False),
            'has_handwriting': metadata.get('has_handwriting', False),
            'extraction_type': metadata.get('extraction_type', '')
        },
        'metadata_location': f"metadata/{document_id}/document_analysis.json",
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if document_type in ['TEXT', 'TABLE']:
        # Send to text processing
        sqs.send_message(
            QueueUrl=text_processing_queue,
            MessageBody=json.dumps(message)
        )
        logger.info(f"Document {document_id} queued for text processing")
        
    else:
        # Send to OCR processing
        sqs.send_message(
            QueueUrl=ocr_queue,
            MessageBody=json.dumps(message)
        )
        logger.info(f"Document {document_id} queued for OCR processing")

def lambda_handler(event, context):
    """
    Main Lambda handler with improved document analysis
    """
    for record in event['Records']:
        # Parse message from SQS
        message = json.loads(record['body'])
        document_id = message['document_id']
        user_id = message['user_id']
        file_key = message['file_key']
        
        logger.info(f"Processing document {document_id} for user {user_id}")
        
        try:
            # Update initial status
            update_document_status(document_id, 'PARSING_STARTED')
            
            # Download file from S3 for analysis
            with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                download_file(raw_bucket, file_key, tmp_file.name)
                local_path = tmp_file.name
            
            try:
                # Get document metadata from S3
                response = s3.head_object(Bucket=raw_bucket, Key=file_key)
                content_type = response.get('ContentType', '')
                
                # Perform deep document analysis
                document_type, analysis_results = detect_document_type(local_path, file_key, content_type)
                logger.info(f"Document type detected: {document_type}, Analysis: {json.dumps(analysis_results)}")
                
                # Extract comprehensive metadata
                metadata = extract_metadata(document_id, local_path, file_key, document_type, analysis_results)
                
                # Store full metadata in S3
                metadata_key = store_metadata_in_s3(document_id, metadata)
                
                # Update document status with basic metadata
                basic_metadata = {
                    'title': metadata.get('title', ''),
                    'page_count': metadata.get('page_count', 1),
                    'extraction_type': document_type,
                    'metadata_location': metadata_key
                }
                update_document_status(document_id, 'PARSING', basic_metadata)
                
                # Queue for next processing step
                queue_for_next_step(document_id, document_type, user_id, file_key, metadata)
                
                # Update final status for this step
                update_document_status(document_id, 'QUEUED_FOR_PROCESSING')
                
            finally:
                # Clean up temp file
                if os.path.exists(local_path):
                    os.unlink(local_path)
                
        except Exception as e:
            logger.error(f"Error processing document {document_id}: {str(e)}")
            update_document_status(document_id, 'PARSING_FAILED', {'error': str(e)})
            # Don't raise the exception so other documents in the batch can be processed
    
    return {
        'statusCode': 200,
        'body': json.dumps('Processing complete')
    }