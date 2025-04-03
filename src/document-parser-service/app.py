import os
import json
import boto3
import logging
from datetime import datetime
import tempfile
import fitz  # PyMuPDF for PDF analysis
import re
from PIL import Image
import io
import traceback

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

# DynamoDB tables from environment variables
documents_table = dynamodb.Table(os.environ['DOCUMENTS_TABLE'])
doc_processing_table = dynamodb.Table(os.environ['DOC_PROCESSING_TABLE'])

# SQS queues from environment variables
text_processing_queue = os.environ['TEXT_PROCESSING_QUEUE']
ocr_queue = os.environ['OCR_QUEUE']

# S3 bucket from environment variable
raw_bucket = os.environ['RAW_BUCKET']

# Document complexity thresholds
IMAGE_RATIO_THRESHOLD = 0.4  # If images cover more than 40% of document
TABLE_COMPLEXITY_THRESHOLD = 0.7  # Complex tables score
HANDWRITING_CONFIDENCE_THRESHOLD = 0.6  # Handwriting detection confidence

def download_file(bucket, key, local_path=None):
    """Download a file from S3 to a local path"""
    if local_path is None:
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            local_path = tmp_file.name
    
    logger.info(f"Downloading file from bucket={bucket}, key={key} to {local_path}")
    s3.download_file(bucket, key, local_path)
    logger.info(f"Download complete: {local_path}, size={os.path.getsize(local_path)} bytes")
    return local_path

def analyze_document(file_path, file_key, content_type):
    """
    Analyze document to determine if it needs OCR or text processing
    Returns document_type and analysis_results
    """
    # Get file extension
    _, ext = os.path.splitext(file_key)
    ext = ext.lower()
    logger.info(f"Analyzing document: {file_key} with extension {ext}")
    
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
        document_type = 'TEXT'
        analysis_results = {'needs_ocr': False, 'has_text': True}
    elif ext in ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']:
        analysis_results = analyze_image_document(file_path)
        document_type = 'OCR'
    elif ext in ['.xls', '.xlsx', '.csv']:
        document_type = 'TEXT'  # Changed from TABLE to TEXT for simplicity
        analysis_results = {'needs_ocr': False, 'has_tables': True}
    else:
        # Default to OCR for unknown types
        document_type = 'OCR'
        analysis_results = {'needs_ocr': True}
    
    logger.info(f"Document analysis complete. Type: {document_type}")
    return document_type, analysis_results

def analyze_pdf_content(file_path):
    """
    Analyze PDF content to determine if it needs OCR or text processing
    Returns a dict with analysis results
    """
    logger.info(f"Starting PDF content analysis for {file_path}")
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
        
        # Try to extract document title from metadata
        if doc.metadata and doc.metadata.get('title'):
            results['title'] = doc.metadata.get('title')
        else:
            # Use filename if no metadata title exists
            results['title'] = os.path.basename(file_path)
        
        total_page_area = 0
        total_text_area = 0
        total_image_area = 0
        total_words = 0
        
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
            
            # Check for tables
            blocks = page.get_text("blocks")
            table_indicators = detect_tables(blocks, page)
            if table_indicators['has_tables']:
                results['has_tables'] = True
                results['table_complexity'] = max(results['table_complexity'], table_indicators['complexity'])
            
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
                    results['has_handwriting'] = True
                    results['handwriting_confidence'] = 0.8  # Simplified
            
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
        
        # Simplified - would need to consider image position and scaling
        image_area = width * height
        return image_area
    except Exception as e:
        return 0

def is_likely_handwriting(image_data):
    """
    Basic check for handwriting in an image
    In production, this would use an ML model
    """
    # This is a simplified placeholder
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
            width, height = img.size
            
            # Higher quality images have better OCR results
            if width > 1000 and height > 1000:
                result['image_quality'] = 0.8
            elif width > 500 and height > 500:
                result['image_quality'] = 0.5
            else:
                result['image_quality'] = 0.3
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

def update_document_status(document_id, status, metadata=None):
    """
    Update the document status in DynamoDB
    """
    logger.info(f"Updating document {document_id} status to {status}")
    update_expr = "SET #status = :status, updated_at = :updated_at"
    expr_attr_names = {'#status': 'status'}
    expr_attr_values = {
        ':status': status,
        ':updated_at': datetime.utcnow().isoformat()
    }
    
    # Add any additional metadata
    if metadata:
        for idx, (key, value) in enumerate(metadata.items()):
            if key not in ['PK', 'SK']:  # Avoid updating keys
                update_expr += f", #{key} = :val{idx}"
                expr_attr_names[f'#{key}'] = key
                expr_attr_values[f':val{idx}'] = value
    
    documents_table.update_item(
        Key={'PK': f'doc#{document_id}', 'SK': 'metadata'},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_attr_names,
        ExpressionAttributeValues=expr_attr_values
    )
    
    # Record processing step
    processing_item = {
        'PK': f'doc#{document_id}',
        'SK': f'process#{datetime.utcnow().isoformat()}',
        'status': status,
        'step': 'DOCUMENT_PARSING',
        'timestamp': datetime.utcnow().isoformat(),
        'service_type': 'document_parser'
    }
    doc_processing_table.put_item(Item=processing_item)

def store_analysis_in_dynamo(document_id, analysis_results):
    """
    Store analysis results in DynamoDB
    """
    logger.info(f"Storing analysis for document {document_id}")
    
    analysis_item = {
        'PK': f'doc#{document_id}',
        'SK': 'analysis',
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat(),
        'analysis_details': analysis_results
    }
    
    documents_table.put_item(Item=analysis_item)
    logger.info("Analysis stored successfully")

def send_to_ocr_queue(document_id, user_id, file_key, analysis_results):
    """
    Send document to OCR queue
    """
    logger.info(f"Sending document {document_id} to OCR queue")
    
    message = {
        'document_id': document_id,
        'user_id': user_id,
        'file_key': file_key,
        'metadata': {
            'has_tables': analysis_results.get('has_tables', False),
            'has_handwriting': analysis_results.get('has_handwriting', False),
            'page_count': analysis_results.get('page_count', 1)
        },
        'timestamp': datetime.utcnow().isoformat()
    }
    
    response = sqs.send_message(
        QueueUrl=ocr_queue,
        MessageBody=json.dumps(message)
    )
    
    logger.info(f"Document {document_id} queued for OCR processing")

def send_to_text_processing_queue(document_id, user_id, file_key, analysis_results):
    """
    Send document to text processing queue
    """
    logger.info(f"Sending document {document_id} to text processing queue")
    
    message = {
        'document_id': document_id,
        'user_id': user_id,
        'file_key': file_key,
        'metadata': {
            'has_tables': analysis_results.get('has_tables', False),
            'word_count': analysis_results.get('total_words', 0),
            'page_count': analysis_results.get('page_count', 1)
        },
        'timestamp': datetime.utcnow().isoformat()
    }
    
    response = sqs.send_message(
        QueueUrl=text_processing_queue,
        MessageBody=json.dumps(message)
    )
    
    logger.info(f"Document {document_id} queued for text processing")

def lambda_handler(event, context):
    """
    Simplified Document Parser Lambda handler
    - Receives document metadata from Document Service
    - Analyzes document to determine if OCR is needed
    - Routes to either OCR or Text Processing queue
    - Updates document status in DynamoDB
    """
    logger.info(f"Starting document parser lambda with {len(event['Records'])} records")
    
    for record in event['Records']:
        # Parse message from SQS
        message = json.loads(record['body'])
        document_id = message['documentId']
        user_id = message['userId']
        file_key = message['s3Key']
        
        logger.info(f"Processing document {document_id} for user {user_id}, file: {file_key}")
        
        try:
            # 1. Update status to PARSING
            update_document_status(document_id, 'PARSING')
            
            # 2. Download document from S3
            with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                local_path = download_file(raw_bucket, file_key, tmp_file.name)
                
                try:
                    # Get document metadata from S3
                    response = s3.head_object(Bucket=raw_bucket, Key=file_key)
                    content_type = response.get('ContentType', '')
                    
                    # 3. Analyze document
                    document_type, analysis_results = analyze_document(local_path, file_key, content_type)
                    
                    # 4. Store analysis results
                    store_analysis_in_dynamo(document_id, analysis_results)
                    
                    # 5. Route to appropriate queue based on analysis
                    if document_type == 'OCR':
                        send_to_ocr_queue(document_id, user_id, file_key, analysis_results)
                        next_status = 'OCR_PROCESSING'
                    else:  # TEXT
                        send_to_text_processing_queue(document_id, user_id, file_key, analysis_results)
                        next_status = 'TEXT_EXTRACTION'
                    
                    # 6. Update document status for next step
                    basic_metadata = {
                        'title': analysis_results.get('title', ''),
                        'page_count': analysis_results.get('page_count', 1),
                        'extraction_type': document_type
                    }
                    update_document_status(document_id, next_status, basic_metadata)
                    
                finally:
                    # Clean up temp file
                    if os.path.exists(local_path):
                        os.unlink(local_path)
                        
        except Exception as e:
            logger.error(f"Error processing document {document_id}: {str(e)}")
            logger.error(traceback.format_exc())
            update_document_status(document_id, 'PARSING_FAILED', {'error': str(e)})
    
    logger.info("Document parser lambda completed")
    return {
        'statusCode': 200,
        'body': json.dumps('Processing complete')
    }
