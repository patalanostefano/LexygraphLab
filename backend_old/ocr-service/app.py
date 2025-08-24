import os
import json
import boto3
import logging
from datetime import datetime
import tempfile
import time
import traceback

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
textract = boto3.client('textract')

# DynamoDB tables
documents_table = dynamodb.Table(os.environ['DOCUMENTS_TABLE'])
doc_processing_table = dynamodb.Table(os.environ['DOC_PROCESSING_TABLE'])

# SQS queue for text processing
text_processing_queue = os.environ['TEXT_PROCESSING_QUEUE']

# S3 bucket
raw_bucket = os.environ['RAW_BUCKET']

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
    
    try:
        documents_table.update_item(
            Key={'PK': f'doc#{document_id}', 'SK': 'metadata'},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_attr_names,
            ExpressionAttributeValues=expr_attr_values
        )
    except Exception as e:
        logger.error(f"Failed to update document status: {str(e)}")
        raise
    
    # Record processing step
    processing_item = {
        'PK': f'doc#{document_id}',
        'SK': f'process#{datetime.utcnow().isoformat()}',
        'status': status,
        'step': 'OCR_PROCESSING',
        'timestamp': datetime.utcnow().isoformat(),
        'service_type': 'ocr_service'
    }
    
    try:
        doc_processing_table.put_item(Item=processing_item)
    except Exception as e:
        logger.error(f"Failed to record processing step: {str(e)}")
        raise

def process_with_textract(bucket, document_key, document_type):
    """
    Process a document with AWS Textract
    """
    try:
        logger.info(f"Starting Textract analysis for document: {document_key}")
        
        # Determine which Textract API to use based on document type
        if document_type == 'FORMS':
            # Use form analysis
            response = textract.analyze_document(
                Document={
                    'S3Object': {
                        'Bucket': bucket,
                        'Name': document_key
                    }
                },
                FeatureTypes=['FORMS']
            )
        elif document_type == 'TABLES':
            # Use table analysis
            response = textract.analyze_document(
                Document={
                    'S3Object': {
                        'Bucket': bucket,
                        'Name': document_key
                    }
                },
                FeatureTypes=['TABLES']
            )
        else:
            # Use basic text detection
            response = textract.detect_document_text(
                Document={
                    'S3Object': {
                        'Bucket': bucket,
                        'Name': document_key
                    }
                }
            )
        
        logger.info(f"Textract analysis completed for {document_key}")
        
        # Process the results
        return process_textract_results(response, document_type)
        
    except Exception as e:
        logger.error(f"Error in Textract processing: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            'status': 'failed',
            'error': f'Document analysis error: {str(e)}'
        }

def process_textract_results(response, document_type):
    """
    Process and extract relevant information from Textract results
    """
    logger.info(f"Processing Textract results for document_type: {document_type}")
    
    # Initialize result dictionary
    processed_result = {
        'status': 'success',
        'text': '',
        'confidence': 0.0,
        'has_tables': False,
        'tables': [],
        'forms': [],
        'blocks': []
    }
    
    total_confidence = 0.0
    total_items = 0
    
    # Process based on document type
    if document_type in ['FORMS', 'TABLES']:
        # Process Blocks from analyze_document response
        if 'Blocks' in response:
            for block in response['Blocks']:
                # Extract text blocks for full text
                if block['BlockType'] == 'LINE':
                    processed_result['text'] += block.get('Text', '') + '\n'
                    total_confidence += block.get('Confidence', 0)
                    total_items += 1
                    
                # Detect tables
                elif block['BlockType'] == 'TABLE':
                    processed_result['has_tables'] = True
    else:
        # Process detect_document_text response
        if 'Blocks' in response:
            for block in response['Blocks']:
                if block['BlockType'] == 'LINE':
                    processed_result['text'] += block.get('Text', '') + '\n'
                    total_confidence += block.get('Confidence', 0)
                    total_items += 1
                    
                elif block['BlockType'] == 'TABLE':
                    processed_result['has_tables'] = True
    
    # Calculate average confidence
    if total_items > 0:
        processed_result['confidence'] = total_confidence / total_items
    
    return processed_result

def determine_document_type(file_extension, metadata):
    """
    Determine the appropriate Textract analysis type to use
    """
    has_tables = metadata.get('has_tables', False)
    has_forms = metadata.get('has_forms', False)
    
    if has_forms:
        return "FORMS"
    elif has_tables:
        return "TABLES"
    else:
        return "TEXT"

def store_extracted_text_in_dynamo(document_id, text_content, ocr_results):
    """
    Store the extracted text in DynamoDB
    """
    logger.info(f"Storing extracted text for document_id={document_id}")
    
    # Store the full text content (might need to be chunked if very large)
    if len(text_content) > 400000:  # DynamoDB item size limit is 400KB
        # Split into chunks if text is too large
        chunks = []
        current_chunk = ""
        for line in text_content.split('\n'):
            if len(current_chunk) + len(line) + 1 > 390000:  # Leave some margin
                chunks.append(current_chunk)
                current_chunk = line + '\n'
            else:
                current_chunk += line + '\n'
        
        if current_chunk:
            chunks.append(current_chunk)
            
        # Store chunks in DynamoDB
        for i, chunk in enumerate(chunks):
            chunk_item = {
                'PK': f'doc#{document_id}',
                'SK': f'content#chunk{i+1}',
                'text': chunk,
                'chunk_number': i+1,
                'total_chunks': len(chunks),
                'created_at': datetime.utcnow().isoformat()
            }
            
            documents_table.put_item(Item=chunk_item)
        
        return {'chunks_count': len(chunks), 'has_tables': ocr_results.get('has_tables', False)}
    else:
        # Store the full text directly
        content_item = {
            'PK': f'doc#{document_id}',
            'SK': 'content',
            'text': text_content,
            'created_at': datetime.utcnow().isoformat()
        }
        
        documents_table.put_item(Item=content_item)
        
        return {'chunks_count': 1, 'has_tables': ocr_results.get('has_tables', False)}

def send_to_text_processing(document_id, user_id, ocr_results):
    """
    Queue the document for text processing after OCR
    """
    logger.info(f"Queueing document {document_id} for text processing after OCR")
    
    message = {
        'document_id': document_id,
        'user_id': user_id,
        'ocr_result': True,
        'has_tables': ocr_results.get('has_tables', False),
        'timestamp': datetime.utcnow().isoformat()
    }
    
    # Send to text processing
    response = sqs.send_message(
        QueueUrl=text_processing_queue,
        MessageBody=json.dumps(message)
    )
    
    logger.info(f"Document {document_id} queued for text processing")

def lambda_handler(event, context):
    """
    OCR Lambda handler
    
    1. Receives documents that need OCR processing
    2. Processes documents with AWS Textract
    3. Extracts text from images/complex documents
    4. Stores extracted text in DynamoDB
    5. Sends document to Text Processing queue
    """
    logger.info(f"Starting OCR lambda with {len(event['Records'])} records")
    
    for record in event['Records']:
        # Parse message from SQS
        message = json.loads(record['body'])
        document_id = message['document_id']
        user_id = message['user_id']
        file_key = message['file_key']
        metadata = message.get('metadata', {})
        
        logger.info(f"OCR processing document {document_id} for user {user_id}, file: {file_key}")
        
        try:
            # 1. Update status to OCR processing
            update_document_status(document_id, 'OCR_PROCESSING')
            
            # 2. Determine document type for processing
            file_extension = os.path.splitext(file_key)[1].lower()
            doc_type = determine_document_type(file_extension, metadata)
            
            # 3. Process with Textract directly from S3
            ocr_result = process_with_textract(raw_bucket, file_key, doc_type)
            
            # 4. Handle OCR results
            if ocr_result['status'] == 'success':
                # Store the extracted text in DynamoDB
                text_result = store_extracted_text_in_dynamo(
                    document_id, 
                    ocr_result.get('text', ''), 
                    ocr_result
                )
                
                # Update document status
                metadata = {
                    'ocr_confidence': ocr_result.get('confidence', 0),
                    'extraction_method': 'OCR',
                    'has_tables': ocr_result.get('has_tables', False)
                }
                update_document_status(document_id, 'OCR_COMPLETED', metadata)
                
                # 5. Send to text processing
                send_to_text_processing(document_id, user_id, ocr_result)
            else:
                logger.error(f"OCR processing failed for document {document_id}: {ocr_result.get('error')}")
                update_document_status(document_id, 'OCR_FAILED', {'error': ocr_result.get('error')})
                
        except Exception as e:
            logger.error(f"Error in OCR processing for document {document_id}: {str(e)}")
            logger.error(traceback.format_exc())
            update_document_status(document_id, 'OCR_FAILED', {'error': str(e)})
    
    logger.info("OCR lambda completed")
    return {
        'statusCode': 200,
        'body': json.dumps('OCR processing complete')
    }
