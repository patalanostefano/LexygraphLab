# app.py - Enhanced Lambda function for OCR processing

import os
import json
import boto3
import logging
import requests
import base64
from datetime import datetime
import tempfile
import time
from typing import Dict, Any, List, Optional

# Azure Document Intelligence SDK
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import AnalyzeResult
from azure.ai.documentintelligence.models import AnalyzeDocumentRequest

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

# Azure Document Intelligence configuration
AZURE_DOC_ENDPOINT = os.environ['AZURE_DOC_ENDPOINT']
AZURE_DOC_KEY = os.environ['AZURE_DOC_KEY']

def update_document_status(document_id: str, status: str, metadata: Optional[Dict[str, Any]] = None) -> None:
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

def upload_to_azure_blob(file_path: str) -> str:
    """
    Upload a file to Azure Blob Storage and return a SAS URL for Azure Document Intelligence
    This is a placeholder - in a real implementation, you would use Azure Blob SDK
    """
    # For simplicity, we're assuming a direct file processing in this example
    # In production, you might want to upload to Azure Blob Storage first
    return file_path
    
def process_with_document_intelligence(file_path: str, document_type: str) -> Dict[str, Any]:
    """
    Process a document with Azure Document Intelligence
    
    Args:
        file_path: Path to the file to process
        document_type: Type of document analysis to perform (prebuilt-layout, prebuilt-document, etc.)
        
    Returns:
        Dict with analysis results
    """
    try:
        document_intelligence_client = DocumentIntelligenceClient(
            endpoint=AZURE_DOC_ENDPOINT, 
            credential=AzureKeyCredential(AZURE_DOC_KEY)
        )
        
        # Start analysis with local file
        with open(file_path, "rb") as f:
            poller = document_intelligence_client.begin_analyze_document(
                document_type, analyze_request=f.read(), content_type="application/octet-stream"
            )
        
        # Wait for completion with timeout
        max_wait_seconds = 120
        start_time = time.time()
        
        while not poller.done():
            time.sleep(2)  # Poll every 2 seconds
            if time.time() - start_time > max_wait_seconds:
                return {
                    'status': 'failed',
                    'error': 'Document analysis timed out after 120 seconds'
                }
        
        result: AnalyzeResult = poller.result()
        
        # Process the results
        return process_doc_intelligence_results(result)
        
    except Exception as e:
        logger.error(f"Error in document intelligence processing: {str(e)}")
        return {
            'status': 'failed',
            'error': f'Document analysis error: {str(e)}'
        }

def process_doc_intelligence_results(result: AnalyzeResult) -> Dict[str, Any]:
    """
    Process and extract relevant information from Document Intelligence results
    
    Args:
        result: The AnalyzeResult from Document Intelligence
        
    Returns:
        Dict with processed results
    """
    # Initialize result dictionary
    processed_result = {
        'status': 'success',
        'text': '',
        'confidence': 0.0,
        'page_count': len(result.pages) if result.pages else 0,
        'has_handwritten_content': False,
        'tables': [],
        'pages': []
    }
    
    # Check for handwritten content
    if result.styles and any([style.is_handwritten for style in result.styles]):
        processed_result['has_handwritten_content'] = True
    
    total_confidence = 0.0
    total_words = 0
    
    # Process pages
    for page in result.pages:
        page_info = {
            'page_number': page.page_number,
            'width': page.width,
            'height': page.height,
            'unit': page.unit,
            'text': '',
            'lines': []
        }
        
        # Process lines and words
        if page.lines:
            for line in page.lines:
                page_info['text'] += line.content + '\n'
                processed_result['text'] += line.content + '\n'
                
                line_info = {
                    'content': line.content,
                    'polygon': line.polygon if hasattr(line, 'polygon') else None,
                    'words': []
                }
                
                # Get words for this line
                words = []
                for word in page.words:
                    if in_span(word, line.spans):
                        words.append(word)
                        if hasattr(word, 'confidence'):
                            total_confidence += word.confidence
                            total_words += 1
                        
                        line_info['words'].append({
                            'content': word.content,
                            'confidence': word.confidence if hasattr(word, 'confidence') else None
                        })
                
                page_info['lines'].append(line_info)
        
        processed_result['pages'].append(page_info)
    
    # Process tables
    if result.tables:
        for table_idx, table in enumerate(result.tables):
            table_info = {
                'id': table_idx,
                'row_count': table.row_count,
                'column_count': table.column_count,
                'page_numbers': [],
                'cells': []
            }
            
            # Get page numbers where this table appears
            if table.bounding_regions:
                for region in table.bounding_regions:
                    if region.page_number not in table_info['page_numbers']:
                        table_info['page_numbers'].append(region.page_number)
            
            # Process cells
            for cell in table.cells:
                cell_info = {
                    'row_index': cell.row_index,
                    'column_index': cell.column_index,
                    'row_span': cell.row_span,
                    'column_span': cell.column_span,
                    'content': cell.content
                }
                table_info['cells'].append(cell_info)
            
            processed_result['tables'].append(table_info)
    
    # Calculate average confidence
    if total_words > 0:
        processed_result['confidence'] = total_confidence / total_words
    
    return processed_result

def in_span(word, spans):
    """
    Check if a word is within any of the given spans
    """
    for span in spans:
        if word.span.offset >= span.offset and (
            word.span.offset + word.span.length
        ) <= (span.offset + span.length):
            return True
    return False

def queue_for_text_processing(document_id, user_id, result):
    """
    Queue the document for text processing after OCR
    """
    message = {
        'document_id': document_id,
        'user_id': user_id,
        'ocr_result': True,
        'page_count': result.get('page_count', 1),
        'has_tables': len(result.get('tables', [])) > 0,
        'has_handwritten_content': result.get('has_handwritten_content', False),
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
    
    # Store extracted text content
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

def determine_document_type(file_extension, message_flags):
    """
    Determine the appropriate Azure Document Intelligence model to use
    """
    # Check if document type hints were provided in the message
    has_complex_tables = message_flags.get('has_complex_tables', False)
    has_forms = message_flags.get('has_forms', False)
    has_receipts = message_flags.get('has_receipts', False)
    has_ids = message_flags.get('has_ids', False)
    has_invoices = message_flags.get('has_invoices', False)
    
    # Select appropriate model based on document characteristics and extension
    if has_receipts:
        return "prebuilt-receipt"
    elif has_invoices:
        return "prebuilt-invoice"
    elif has_ids:
        return "prebuilt-idDocument"
    elif has_forms:
        return "prebuilt-form"
    elif has_complex_tables:
        return "prebuilt-layout"  # Better for complex tables
    elif file_extension.lower() in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif']:
        # For images, general layout analysis works well
        return "prebuilt-layout"
    else:
        # For PDFs and other documents, use the general document model
        return "prebuilt-document"

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
        
        # Get document hints if available
        document_flags = message.get('document_flags', {})
        
        # Get file extension
        file_extension = os.path.splitext(file_key)[1]
        
        logger.info(f"OCR processing document {document_id} for user {user_id}")
        
        try:
            # Update status to processing
            update_document_status(document_id, 'OCR_PROCESSING')
            
            # Download file for processing
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
                s3.download_file(raw_bucket, file_key, tmp.name)
                file_path = tmp.name
            
            # Determine document type for processing
            doc_type = determine_document_type(file_extension, document_flags)
            logger.info(f"Using document intelligence model: {doc_type}")
            
            # Process with Azure Document Intelligence
            ocr_result = process_with_document_intelligence(file_path, doc_type)
            
            # Update document with OCR results
            if ocr_result['status'] == 'success':
                metadata = {
                    'ocr_confidence': ocr_result.get('confidence', 0),
                    'page_count': ocr_result.get('page_count', 1),
                    'extraction_method': 'OCR',
                    'has_tables': len(ocr_result.get('tables', [])) > 0,
                    'has_handwritten_content': ocr_result.get('has_handwritten_content', False)
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
