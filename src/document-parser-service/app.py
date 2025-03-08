# app.py - Lambda function for document parsing

import os
import json
import boto3
import logging
from datetime import datetime
import mimetypes
import uuid

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

def detect_document_type(file_key, content_type):
    """
    Analyze the document to determine its type and processing requirements
    """
    # Get file extension
    _, ext = os.path.splitext(file_key)
    ext = ext.lower()
    
    # Determine document type based on extension and content type
    if ext in ['.pdf']:
        # For PDF, need to check if it's text-based or image-based
        # This would involve downloading and analyzing the PDF
        is_text_pdf = check_if_text_pdf(file_key)
        return 'TEXT' if is_text_pdf else 'OCR'
        
    elif ext in ['.txt', '.md', '.rtf', '.doc', '.docx']:
        # Text documents can be processed directly
        return 'TEXT'
        
    elif ext in ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']:
        # Images need OCR
        return 'OCR'
        
    elif ext in ['.xls', '.xlsx', '.csv']:
        # Spreadsheets may need special table extraction
        return 'TABLE'
        
    else:
        # Default to OCR for unknown types
        return 'OCR'

def check_if_text_pdf(file_key):
    """
    Check if a PDF contains extractable text or is image-based
    """
    # This is a simplified version - in production you'd use a library like PyPDF2 or pdfplumber
    # to analyze the PDF content and determine if it contains extractable text
    
    # For now, we'll assume most PDFs contain extractable text
    return True

def extract_basic_metadata(document_id, file_key, document_type):
    """
    Extract basic metadata like title, page count, etc.
    """
    metadata = {
        'id': document_id,
        'updated_at': datetime.utcnow().isoformat(),
        'extraction_type': document_type
    }
    
    # Logic to extract specific metadata based on document type
    if document_type == 'TEXT':
        # For text documents, extract title, page count etc.
        # This would typically download the file and analyze it
        metadata['title'] = os.path.basename(file_key)
        metadata['page_count'] = 1  # Simplified - would actually count pages
        
    elif document_type == 'OCR':
        # For OCR documents, we might just record basic info until OCR is complete
        metadata['title'] = os.path.basename(file_key)
        metadata['requires_ocr'] = True
        
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

def queue_for_next_step(document_id, document_type, user_id, file_key):
    """
    Queue the document for its next processing step
    """
    message = {
        'document_id': document_id,
        'user_id': user_id,
        'file_key': file_key,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if document_type in ['TEXT']:
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
    Main Lambda handler
    """
    for record in event['Records']:
        # Parse message from SQS
        message = json.loads(record['body'])
        document_id = message['document_id']
        user_id = message['user_id']
        file_key = message['file_key']
        
        logger.info(f"Processing document {document_id} for user {user_id}")
        
        try:
            # Get document metadata from S3
            response = s3.head_object(Bucket=raw_bucket, Key=file_key)
            content_type = response.get('ContentType', '')
            
            # Determine document type and processing path
            document_type = detect_document_type(file_key, content_type)
            logger.info(f"Document type detected: {document_type}")
            
            # Extract basic metadata
            metadata = extract_basic_metadata(document_id, file_key, document_type)
            
            # Update document status
            update_document_status(document_id, 'PARSING', metadata)
            
            # Queue for next processing step
            queue_for_next_step(document_id, document_type, user_id, file_key)
            
            # Update final status for this step
            update_document_status(document_id, 'QUEUED_FOR_PROCESSING')
            
        except Exception as e:
            logger.error(f"Error processing document {document_id}: {str(e)}")
            update_document_status(document_id, 'PARSING_FAILED', {'error': str(e)})
            raise
    
    return {
        'statusCode': 200,
        'body': json.dumps('Processing complete')
    }
