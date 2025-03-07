# app.py - Lambda function for OCR processing

import os
import json
import boto3
import logging
import requests
import base64
from datetime import datetime
import tempfile

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

# SQS queue for text processing
text_processing_queue = os.environ['TEXT_PROCESSING_QUEUE']

# S3 buckets
raw_bucket = os.environ['RAW_DOCUMENTS_BUCKET']
processed_bucket = os.environ['PROCESSED_DOCUMENTS_BUCKET']

# Azure Computer Vision OCR configuration
AZURE_CV_ENDPOINT = os.environ['AZURE_CV_ENDPOINT']
AZURE_CV_KEY = os.environ['AZURE_CV_KEY']

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
    
    # Record processing step
    doc_processing_table.put_item(Item={
        'PK': f'doc#{document_id}',
        'SK': f'process#{datetime.utcnow().isoformat()}',
        'status': status,
        'step': 'OCR_PROCESSING',
        'timestamp': datetime.utcnow().isoformat(),
        'service_type': 'ocr_service'
    })

def process_with_azure_ocr(file_path):
    """
    Process an image or document with Azure Computer Vision OCR
    """
    # Azure Computer Vision Read API endpoint
    vision_url = f"{AZURE_CV_ENDPOINT}/vision/v3.2/read/analyze"
    
    # Set request headers
    headers = {
        'Ocp-Apim-Subscription-Key': AZURE_CV_KEY,
        'Content-Type': 'application/octet-stream'
    }
    
    # Read file as binary
    with open(file_path, 'rb') as f:
        image_data = f.read()
    
    # Submit image to Azure for analysis
    response = requests.post(vision_url, headers=headers, data=image_data)
    response.raise_for_status()
    
    # Get the operation location (URL with ID to check status)
    operation_location = response.headers["Operation-Location"]
    
    # Set up operation check headers
    headers = {'Ocp-Apim-Subscription-Key': AZURE_CV_KEY}
    
    # Poll for results (with a timeout)
    import time
    max_retries = 10
    retry_count = 0
    wait_time = 1  # seconds
    
    while retry_count < max_retries:
        time.sleep(wait_time)
        response = requests.get(operation_location, headers=headers)
        response_json = response.json()
        
        if response_json["status"] in ["succeeded", "failed"]:
            break
        
        retry_count += 1
        wait_time *= 2  # Exponential backoff
    
    # Process and return results
    if response_json["status"] == "succeeded":
        results = response_json["analyzeResult"]["readResults"]
        extracted_text = ""
        
        # Combine all text from all pages
        for page in results:
            for line in page["lines"]:
                extracted_text += line["text"] + "\n"
        
        return {
            'status': 'success',
            'text': extracted_text,
            'confidence': calculate_avg_confidence(results),
            'page_count': len(results)
        }
    else:
        return {
            'status': 'failed',
            'error': 'OCR processing failed'
        }

def calculate_avg_confidence(read_results):
    """
    Calculate the average confidence of OCR results
    """
    total_confidence = 0
    line_count = 0
    
    for page in read_results:
        for line in page["lines"]:
            if "confidence" in line:
                total_confidence += line["confidence"]
                line_count += 1
    
    return total_confidence / line_count if line_count > 0 else 0

def queue_for_text_processing(document_id, user_id, result):
    """
    Queue the document for text processing after OCR
    """
    message = {
        'document_id': document_id,
        'user_id': user_id,
        'ocr_result': True,
        'page_count': result.get('page_count', 1),
        'timestamp': datetime.utcnow().isoformat()
    }
    
    # Store OCR results in S3
    ocr_data = json.dumps(result)
    s3_key = f"users/{user_id}/documents/{document_id}/processed/ocr_results.json"
    s3.put_object(
        Bucket=processed_bucket,
        Key=s3_key,
        Body=ocr_data,
        ContentType='application/json'
    )
    
    # Store each page's text content individually
    text = result.get('text', '')
    s3_key = f"users/{user_id}/documents/{document_id}/processed/extracted_text.txt"
    s3.put_object(
        Bucket=processed_bucket,
        Key=s3_key,
        Body=text,
        ContentType='text/plain'
    )
    
    # Send to text processing
    sqs.send_message(
        QueueUrl=text_processing_queue,
        MessageBody=json.dumps(message)
    )
    
    logger.info(f"Document {document_id} queued for text processing after OCR")

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
        
        logger.info(f"OCR processing document {document_id} for user {user_id}")
        
        try:
            # Update status to processing
            update_document_status(document_id, 'OCR_PROCESSING')
            
            # Download file for processing
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                s3.download_file(raw_bucket, file_key, tmp.name)
                file_path = tmp.name
            
            # Process with Azure OCR
            ocr_result = process_with_azure_ocr(file_path)
            
            # Update document with OCR results
            if ocr_result['status'] == 'success':
                metadata = {
                    'ocr_confidence': ocr_result.get('confidence', 0),
                    'page_count': ocr_result.get('page_count', 1),
                    'extraction_method': 'OCR'
                }
                update_document_status(document_id, 'OCR_COMPLETED', metadata)
                
                # Queue for text processing
                queue_for_text_processing(document_id, user_id, ocr_result)
            else:
                update_document_status(document_id, 'OCR_FAILED', {'error': ocr_result.get('error', 'Unknown error')})
            
            # Clean up temp file
            os.unlink(file_path)
            
        except Exception as e:
            logger.error(f"Error processing OCR for document {document_id}: {str(e)}")
            update_document_status(document_id, 'OCR_FAILED', {'error': str(e)})
            raise
    
    return {
        'statusCode': 200,
        'body': json.dumps('OCR processing complete')
    }
