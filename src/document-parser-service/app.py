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

def download_file(bucket, key, local_path):
    """Download a file from S3 to a local path"""
    logger.debug(f"Downloading file from bucket={bucket}, key={key} to {local_path}")
    s3.download_file(bucket, key, local_path)
    logger.debug(f"Download complete: {local_path}, size={os.path.getsize(local_path)} bytes")
    return local_path

def analyze_pdf_content(file_path):
    """
    Analyze PDF content to determine if it needs OCR or text processing
    Returns a dict with analysis results
    """
    logger.debug(f"Starting PDF content analysis for {file_path}")
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
        logger.debug(f"PDF has {results['page_count']} pages")
        
        # Try to extract document title
        if doc.metadata and doc.metadata.get('title'):
            results['title'] = doc.metadata.get('title')
            logger.debug(f"Found document title in metadata: {results['title']}")
        else:
            # Use filename if no metadata title exists
            results['title'] = os.path.basename(file_path)
            logger.debug(f"No metadata title found, using filename: {results['title']}")
        
        total_page_area = 0
        total_text_area = 0
        total_image_area = 0
        total_words = 0
        has_complex_tables = False
        table_complexity_score = 0
        handwriting_detected = False
        
        for page_num, page in enumerate(doc):
            logger.debug(f"Analyzing page {page_num+1}/{results['page_count']}")
            # Get page dimensions
            page_area = page.rect.width * page.rect.height
            total_page_area += page_area
            logger.debug(f"Page {page_num+1} area: {page_area:.2f} sq units")
            
            # Extract text
            text = page.get_text()
            words = len(text.split())
            total_words += words
            logger.debug(f"Page {page_num+1} contains {words} words")
            
            if words > 0:
                results['has_text'] = True
            
            # Check for tables by looking for regular patterns of lines or text blocks
            blocks = page.get_text("blocks")
            logger.debug(f"Page {page_num+1} has {len(blocks)} text blocks")
            table_indicators = detect_tables(blocks, page)
            if table_indicators['has_tables']:
                has_complex_tables = True
                table_complexity_score = max(table_complexity_score, table_indicators['complexity'])
                logger.debug(f"Page {page_num+1} contains tables with complexity score: {table_indicators['complexity']:.2f}")
            
            # Analyze images
            image_list = page.get_images(full=True)
            logger.debug(f"Page {page_num+1} contains {len(image_list)} images")
            page_image_area = 0
            for img_index, img_info in enumerate(image_list):
                xref = img_info[0]
                base_image = doc.extract_image(xref)
                image_area = estimate_image_area(base_image, page)
                page_image_area += image_area
                logger.debug(f"Page {page_num+1}, Image {img_index+1} area: {image_area:.2f} sq units")
                
                # Check for handwriting in images (simplified)
                if is_likely_handwriting(base_image):
                    handwriting_detected = True
                    results['handwriting_confidence'] = 0.8  # Simplified - would use ML model
                    logger.debug(f"Handwriting detected in image {img_index+1} on page {page_num+1}")
            
            total_image_area += page_image_area
            
            # Estimate text area (simplified)
            text_spans = page.get_text("spans")
            page_text_area = sum([(span[3] - span[1]) * (span[2] - span[0]) for span in text_spans])
            total_text_area += page_text_area
            logger.debug(f"Page {page_num+1} text area: {page_text_area:.2f}, image area: {page_image_area:.2f}")
        
        # Calculate ratios
        if total_page_area > 0:
            results['text_ratio'] = total_text_area / total_page_area
            results['image_ratio'] = total_image_area / total_page_area
            logger.debug(f"Document text ratio: {results['text_ratio']:.4f}, image ratio: {results['image_ratio']:.4f}")
        
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
        logger.debug(f"OCR needed: {needs_ocr}, factors: image_ratio={results['image_ratio']:.2f}>{IMAGE_RATIO_THRESHOLD}, complex_tables={results['has_tables'] and results['table_complexity'] > TABLE_COMPLEXITY_THRESHOLD}, handwriting={results['has_handwriting'] and results['handwriting_confidence'] > HANDWRITING_CONFIDENCE_THRESHOLD}, low_word_count={total_words < 50}")
        
    except Exception as e:
        logger.error(f"Error analyzing PDF: {str(e)}")
        logger.debug(f"PDF analysis failed with exception: {str(e)}, traceback: {import_traceback().format_exc()}")
        # Default to OCR if analysis fails
        results['needs_ocr'] = True
    
    logger.debug(f"PDF analysis complete. Results: {json.dumps(results)}")
    return results

def detect_tables(blocks, page):
    """Detect tables in a page by analyzing text block patterns"""
    logger.debug(f"Detecting tables in page with {len(blocks)} blocks")
    result = {
        'has_tables': False,
        'complexity': 0.0
    }
    
    # Simple table detection heuristic
    if len(blocks) < 4:
        logger.debug("Too few blocks for table detection")
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
    logger.debug(f"X-alignment score: {x_alignment:.2f}, Y-alignment score: {y_alignment:.2f}")
    
    # If we have good alignment in both directions, likely a table
    grid_score = (x_alignment + y_alignment) / 2
    
    # Check for lines on the page (common in tables)
    paths = page.get_drawings()
    line_count = sum(1 for path in paths if len(path["items"]) == 1)
    logger.debug(f"Detected {line_count} lines on page")
    
    # Normalize line count to a score between 0 and 1
    line_score = min(1.0, line_count / 20)
    
    # Combine scores
    complexity = (grid_score * 0.7) + (line_score * 0.3)
    
    result['has_tables'] = grid_score > 0.5 or line_score > 0.7
    result['complexity'] = complexity
    
    logger.debug(f"Table detection result: has_tables={result['has_tables']}, complexity={complexity:.2f}")
    return result

def estimate_image_area(image_data, page):
    """Estimate the area of an image relative to the page"""
    try:
        img_bytes = image_data["image"]
        img = Image.open(io.BytesIO(img_bytes))
        width, height = img.size
        logger.debug(f"Image dimensions: {width}x{height}")
        
        # Get page dimensions
        page_width = page.rect.width
        page_height = page.rect.height
        
        # Simplified - would need to consider image position and scaling
        image_area = width * height
        logger.debug(f"Estimated image area: {image_area:.2f} sq units")
        return image_area
    except Exception as e:
        logger.debug(f"Failed to estimate image area: {str(e)}")
        return 0

def is_likely_handwriting(image_data):
    """
    Basic check for handwriting in an image
    In production, this would use an ML model
    """
    # This is a simplified placeholder
    # In reality, would use a pre-trained model to detect handwriting
    logger.debug("Handwriting detection called (placeholder implementation)")
    return False

def analyze_image_document(file_path):
    """
    Analyze an image document to determine if it contains text or handwriting
    """
    logger.debug(f"Analyzing image document: {file_path}")
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
            logger.debug(f"Image resolution: {width}x{height}")
            
            # Higher quality images have better OCR results
            if width > 1000 and height > 1000:
                result['image_quality'] = 0.8
                logger.debug("High quality image detected")
            elif width > 500 and height > 500:
                result['image_quality'] = 0.5
                logger.debug("Medium quality image detected")
            else:
                result['image_quality'] = 0.3
                logger.debug("Low quality image detected")
                
            # More sophisticated analysis would detect text vs. handwriting
            # For now, assume all images need OCR
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        logger.debug(f"Image analysis failed with exception: {str(e)}")
    
    logger.debug(f"Image analysis complete. Results: {json.dumps(result)}")
    return result

def analyze_text_document(file_path, ext):
    """
    Analyze text-based documents (.txt, .md, .doc, etc.)
    """
    logger.debug(f"Analyzing text document: {file_path} with extension {ext}")
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
                logger.debug(f"Document word count: {result['word_count']}")
                
                # Check for potential tables using regex patterns
                table_patterns = [
                    r"\|[-|]+\|",  # Markdown tables
                    r"[+][-+]+[+]",  # ASCII tables
                    r"^\s*[A-Za-z0-9]+\s+[A-Za-z0-9]+\s+[A-Za-z0-9]+"  # Space-separated columns
                ]
                
                for pattern in table_patterns:
                    if re.search(pattern, content, re.MULTILINE):
                        result['has_tables'] = True
                        logger.debug(f"Table detected using pattern: {pattern}")
                        break
    except Exception as e:
        logger.error(f"Error analyzing text document: {str(e)}")
        logger.debug(f"Text document analysis failed with exception: {str(e)}")
    
    logger.debug(f"Text document analysis complete. Results: {json.dumps(result)}")
    return result

def detect_document_type(file_path, file_key, content_type):
    """
    Advanced document type detection with analysis to determine 
    if OCR is needed or text processing is sufficient
    """
    # Get file extension
    _, ext = os.path.splitext(file_key)
    ext = ext.lower()
    logger.debug(f"Detecting document type for {file_key} with extension {ext}, content-type: {content_type}")
    
    document_type = 'TEXT'  # Default
    analysis_results = {}
    
    # Determine document type and analyze content
    if ext in ['.pdf']:
        logger.debug(f"Processing as PDF document: {file_key}")
        analysis_results = analyze_pdf_content(file_path)
        document_type = 'OCR' if analysis_results['needs_ocr'] else 'TEXT'
        logger.debug(f"PDF analysis complete. Document type: {document_type}")
        
    elif ext in ['.txt', '.md', '.rtf']:
        logger.debug(f"Processing as text document: {file_key}")
        analysis_results = analyze_text_document(file_path, ext)
        document_type = 'TEXT'
        
    elif ext in ['.doc', '.docx']:
        logger.debug(f"Processing as Word document: {file_key}")
        # Would use a library like python-docx for deeper analysis
        # For now, assume text processing is sufficient
        document_type = 'TEXT'
        analysis_results = {'needs_ocr': False, 'has_text': True}
        
    elif ext in ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']:
        logger.debug(f"Processing as image document: {file_key}")
        analysis_results = analyze_image_document(file_path)
        document_type = 'OCR'
        
    elif ext in ['.xls', '.xlsx', '.csv']:
        logger.debug(f"Processing as spreadsheet: {file_key}")
        # Spreadsheets may need special table extraction
        document_type = 'TABLE'
        analysis_results = {'needs_ocr': False, 'has_tables': True}
        
    else:
        logger.debug(f"Unknown document type for extension {ext}, defaulting to OCR")
        # Default to OCR for unknown types
        document_type = 'OCR'
        analysis_results = {'needs_ocr': True}
    
    logger.debug(f"Document type detection complete: {document_type}")
    return document_type, analysis_results

def extract_metadata(document_id, file_path, file_key, document_type, analysis_results):
    """
    Extract comprehensive metadata from the document
    """
    logger.debug(f"Extracting metadata for document {document_id}, type: {document_type}")
    metadata = {
        'id': document_id,
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat(),
        'filename': os.path.basename(file_key),
        'file_extension': os.path.splitext(file_key)[1].lower(),
        'file_size': os.path.getsize(file_path) if os.path.exists(file_path) else 0,
        'extraction_type': document_type,
        'analysis_details': analysis_results,
        'content_s3_key': file_key  # Store the S3 key for content access
    }
    
    # Add document type specific metadata
    if document_type == 'TEXT':
        metadata['title'] = analysis_results.get('title', os.path.basename(file_key))
        metadata['page_count'] = analysis_results.get('page_count', 1)
        metadata['word_count'] = analysis_results.get('total_words', 0)
        metadata['has_tables'] = analysis_results.get('has_tables', False)
        logger.debug(f"TEXT document metadata: title={metadata['title']}, pages={metadata['page_count']}, words={metadata['word_count']}")
        
    elif document_type == 'OCR':
        metadata['title'] = os.path.basename(file_key)
        metadata['requires_ocr'] = True
        metadata['page_count'] = analysis_results.get('page_count', 1)
        metadata['image_quality'] = analysis_results.get('image_quality', 0.0)
        metadata['has_handwriting'] = analysis_results.get('has_handwriting', False)
        logger.debug(f"OCR document metadata: title={metadata['title']}, pages={metadata['page_count']}, image_quality={metadata['image_quality']}")
        
    elif document_type == 'TABLE':
        metadata['title'] = os.path.basename(file_key)
        metadata['requires_table_extraction'] = True
        logger.debug(f"TABLE document metadata: title={metadata['title']}")
        
    logger.debug(f"Metadata extraction complete for {document_id}")
    return metadata

def update_document_status(document_id, status, metadata=None):
    """
    Update the document status in DynamoDB
    """
    logger.debug(f"Updating document {document_id} status to {status}")
    update_expr = "SET #status = :status, updated_at = :updated_at"
    expr_attr_names = {'#status': 'status'}
    expr_attr_values = {
        ':status': status,
        ':updated_at': datetime.utcnow().isoformat()
    }
    
    # Add any additional metadata
    if metadata:
        logger.debug(f"Adding {len(metadata)} metadata fields to update")
        for idx, (key, value) in enumerate(metadata.items()):
            if key not in ['PK', 'SK']:  # Avoid updating keys
                update_expr += f", #{key} = :val{idx}"
                expr_attr_names[f'#{key}'] = key
                expr_attr_values[f':val{idx}'] = value
    
    logger.debug(f"DynamoDB update expression: {update_expr}")
    documents_table.update_item(
        Key={'PK': f'doc#{document_id}', 'SK': 'metadata'},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_attr_names,
        ExpressionAttributeValues=expr_attr_values
    )
    logger.debug(f"Document metadata updated successfully")
    
    # Record processing step in processing table
    processing_item = {
        'PK': f'doc#{document_id}',
        'SK': f'process#{datetime.utcnow().isoformat()}',
        'status': status,
        'step': 'DOCUMENT_PARSING',
        'timestamp': datetime.utcnow().isoformat(),
        'service_type': 'document_parser'
    }
    logger.debug(f"Adding processing history entry: {json.dumps(processing_item)}")
    doc_processing_table.put_item(Item=processing_item)
    logger.debug(f"Processing history updated successfully")

def store_metadata_in_dynamo(document_id, metadata):
    """
    Store full metadata in DynamoDB
    """
    logger.debug(f"Storing metadata for document {document_id} in DynamoDB")
    # Store analysis details in a separate DynamoDB item to avoid size limits
    analysis_details = metadata.pop('analysis_details', {})
    
    # Store the main metadata
    main_item = {
        'PK': f'doc#{document_id}',
        'SK': 'metadata',
        **metadata
    }
    logger.debug(f"Storing main metadata item with {len(main_item)} fields")
    documents_table.put_item(Item=main_item)
    
    # Store analysis details
    analysis_item = {
        'PK': f'doc#{document_id}',
        'SK': 'analysis',
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat(),
        'analysis_details': analysis_details
    }
    logger.debug(f"Storing analysis details item with {len(analysis_details)} analysis fields")
    documents_table.put_item(Item=analysis_item)
    logger.debug(f"Metadata storage complete for document {document_id}")

def queue_for_next_step(document_id, document_type, user_id, file_key, metadata):
    """
    Queue the document for its next processing step with rich metadata
    """
    logger.debug(f"Queueing document {document_id} for next step. Type: {document_type}")
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
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if document_type in ['TEXT', 'TABLE']:
        # Send to text processing
        logger.debug(f"Sending document {document_id} to text processing queue")
        response = sqs.send_message(
            QueueUrl=text_processing_queue,
            MessageBody=json.dumps(message)
        )
        logger.debug(f"Message sent to text processing queue. MessageId: {response.get('MessageId')}")
        logger.info(f"Document {document_id} queued for text processing")
        
    else:
        # Send to OCR processing
        logger.debug(f"Sending document {document_id} to OCR queue")
        response = sqs.send_message(
            QueueUrl=ocr_queue,
            MessageBody=json.dumps(message)
        )
        logger.debug(f"Message sent to OCR queue. MessageId: {response.get('MessageId')}")
        logger.info(f"Document {document_id} queued for OCR processing")

def lambda_handler(event, context):
    """
    Main Lambda handler with improved document analysis
    """
    logger.info(f"Starting document parser lambda with {len(event['Records'])} records")
    
    for record_idx, record in enumerate(event['Records']):
        logger.debug(f"Processing record {record_idx+1}/{len(event['Records'])}")
        # Parse message from SQS
        message = json.loads(record['body'])
        document_id = message['document_id']
        user_id = message['user_id']
        file_key = message['file_key']
        
        logger.info(f"Processing document {document_id} for user {user_id}, file: {file_key}")
        
        try:
            # Update initial status
            logger.debug(f"Setting initial status to PARSING_STARTED for document {document_id}")
            update_document_status(document_id, 'PARSING_STARTED')
            
            # Download file from S3 for analysis
            logger.debug(f"Creating temporary file for document analysis")
            with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                logger.debug(f"Downloading file {file_key} from S3 bucket {raw_bucket}")
                download_file(raw_bucket, file_key, tmp_file.name)
                local_path = tmp_file.name
                logger.debug(f"File downloaded to {local_path}")
            
            try:
                # Get document metadata from S3
                logger.debug(f"Fetching object metadata from S3 for {file_key}")
                response = s3.head_object(Bucket=raw_bucket, Key=file_key)
                content_type = response.get('ContentType', '')
                logger.debug(f"S3 object content type: {content_type}")
                
                # Perform deep document analysis
                logger.debug(f"Starting document type detection and analysis")
                document_type, analysis_results = detect_document_type(local_path, file_key, content_type)
                logger.info(f"Document type detected: {document_type}, Analysis: {json.dumps(analysis_results)}")
                
                # Extract comprehensive metadata
                logger.debug(f"Extracting metadata from analysis results")
                metadata = extract_metadata(document_id, local_path, file_key, document_type, analysis_results)
                
                # Store full metadata in DynamoDB
                logger.debug(f"Storing full metadata in DynamoDB")
                store_metadata_in_dynamo(document_id, metadata)
                
                # Update document status with basic metadata
                logger.debug(f"Updating document status with basic metadata")
                basic_metadata = {
                    'title': metadata.get('title', ''),
                    'page_count': metadata.get('page_count', 1),
                    'extraction_type': document_type
                }
                update_document_status(document_id, 'PARSING', basic_metadata)
                
                # Queue for next processing step
                logger.debug(f"Queueing document for next processing step")
                queue_for_next_step(document_id, document_type, user_id, file_key, metadata)
                
                # Update final status for this step
                logger.debug(f"Setting final status to QUEUED_FOR_PROCESSING")
                update_document_status(document_id, 'QUEUED_FOR_PROCESSING')
                logger.info(f"Document {document_id} successfully processed and queued for next step")
                
            finally:
                # Clean up temp file
                if os.path.exists(local_path):
                    logger.debug(f"Cleaning up temporary file {local_path}")
                    os.unlink(local_path)
                
        except Exception as e:
            logger.error(f"Error processing document {document_id}: {str(e)}")
            logger.debug(f"Exception details for document {document_id}: {str(e)}")
            update_document_status(document_id, 'PARSING_FAILED', {'error': str(e)})
            # Don't raise the exception so other documents in the batch can be processed
    
    logger.info(f"Document parser lambda completed processing {len(event['Records'])} records")
    return {
        'statusCode': 200,
        'body': json.dumps('Processing complete')
    }