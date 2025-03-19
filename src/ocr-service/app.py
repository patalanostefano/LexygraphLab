import os
import json
import boto3
import logging
from datetime import datetime
import tempfile
import time
from typing import Dict, Any, List, Optional

# Set up logging with more detailed format
logger = logging.getLogger()
logger.setLevel(logging.INFO)
# Add formatter for more detailed logs
for handler in logger.handlers:
    handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))

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

def update_document_status(document_id: str, status: str, metadata: Optional[Dict[str, Any]] = None) -> None:
    """
    Update the document status in DynamoDB
    """
    logger.debug(f"Updating document status: document_id={document_id}, status={status}, metadata={metadata}")
    
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
    
    logger.debug(f"DynamoDB update expression: {update_expr}")
    logger.debug(f"Expression attribute names: {expr_attr_names}")
    logger.debug(f"Expression attribute values: {expr_attr_values}")
    
    try:
        documents_table.update_item(
            Key={'PK': f'doc#{document_id}', 'SK': 'metadata'},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_attr_names,
            ExpressionAttributeValues=expr_attr_values
        )
        logger.debug(f"Document status updated successfully: {document_id}")
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
    logger.debug(f"Recording processing step: {processing_item}")
    
    try:
        doc_processing_table.put_item(Item=processing_item)
        logger.debug(f"Processing step recorded successfully: {document_id}")
    except Exception as e:
        logger.error(f"Failed to record processing step: {str(e)}")
        raise

def process_with_textract(bucket: str, document_key: str, document_type: str) -> Dict[str, Any]:
    """
    Process a document with AWS Textract
    
    Args:
        bucket: S3 bucket containing the document
        document_key: S3 key of the document
        document_type: Type of document analysis to perform
        
    Returns:
        Dict with analysis results
    """
    try:
        start_time = time.time()
        logger.info(f"Starting Textract analysis for document: {document_key}")
        logger.debug(f"Analysis parameters: bucket={bucket}, document_type={document_type}")
        
        # Determine which Textract API to use based on document type
        if document_type == 'FORMS':
            # Use form analysis
            logger.debug("Using Textract analyze_document API with FORMS feature")
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
            logger.debug("Using Textract analyze_document API with TABLES feature")
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
            # Use detection
            logger.debug("Using Textract detect_document_text API")
            response = textract.detect_document_text(
                Document={
                    'S3Object': {
                        'Bucket': bucket,
                        'Name': document_key
                    }
                }
            )
        
        execution_time = time.time() - start_time
        logger.info(f"Textract analysis completed in {execution_time:.2f} seconds")
        logger.debug(f"Textract response contains {len(response.get('Blocks', []))} blocks")
        
        # Process the results
        return process_textract_results(response, document_type)
        
    except Exception as e:
        logger.error(f"Error in Textract processing: {str(e)}")
        logger.debug(f"Textract processing failed for document: bucket={bucket}, key={document_key}", exc_info=True)
        return {
            'status': 'failed',
            'error': f'Document analysis error: {str(e)}'
        }

def process_textract_results(response: Dict[str, Any], document_type: str) -> Dict[str, Any]:
    """
    Process and extract relevant information from Textract results
    
    Args:
        response: The response from Textract
        document_type: Type of document analysis performed
        
    Returns:
        Dict with processed results
    """
    logger.debug(f"Processing Textract results for document_type: {document_type}")
    
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
        logger.debug(f"Processing {document_type} response")
        # Process Blocks from analyze_document response
        if 'Blocks' in response:
            logger.debug(f"Found {len(response['Blocks'])} blocks in response")
            for block in response['Blocks']:
                logger.debug(f"Processing block: type={block['BlockType']}, id={block['Id']}")
                
                # Extract key-value pairs for forms
                if document_type == 'FORMS' and block['BlockType'] == 'KEY_VALUE_SET':
                    if 'KEY' in block.get('EntityTypes', []):
                        # Process KEY block
                        key_block = block
                        key_id = key_block['Id']
                        key_text = extract_text_from_relationships(key_block, response['Blocks'])
                        logger.debug(f"Found key: {key_text}")
                        
                        # Find corresponding VALUE block
                        value_text = ""
                        for rel in key_block.get('Relationships', []):
                            if rel['Type'] == 'VALUE':
                                for value_id in rel['Ids']:
                                    value_block = next((b for b in response['Blocks'] if b['Id'] == value_id), None)
                                    if value_block:
                                        value_text = extract_text_from_relationships(value_block, response['Blocks'])
                        
                        logger.debug(f"Found value: {value_text}")
                        
                        if key_text and value_text:
                            form_item = {
                                'key': key_text,
                                'value': value_text,
                                'confidence': key_block.get('Confidence', 0)
                            }
                            processed_result['forms'].append(form_item)
                            total_confidence += key_block.get('Confidence', 0)
                            total_items += 1
                            logger.debug(f"Added form item: {form_item}")
                
                # Extract tables
                elif document_type == 'TABLES' and block['BlockType'] == 'TABLE':
                    logger.debug(f"Processing table: id={block['Id']}, rows={block.get('RowCount', 0)}, columns={block.get('ColumnCount', 0)}")
                    table = {
                        'id': block['Id'],
                        'confidence': block.get('Confidence', 0),
                        'rows': block.get('RowCount', 0),
                        'columns': block.get('ColumnCount', 0),
                        'cells': []
                    }
                    
                    # Find all cells for this table
                    table_cells = [b for b in response['Blocks'] if b['BlockType'] == 'CELL' and 
                                  any(rel['Type'] == 'CHILD' for rel in block.get('Relationships', []) 
                                      if b['Id'] in rel['Ids'])]
                    
                    logger.debug(f"Found {len(table_cells)} cells in table {block['Id']}")
                    
                    for cell in table_cells:
                        cell_text = extract_text_from_relationships(cell, response['Blocks'])
                        cell_info = {
                            'text': cell_text,
                            'row': cell.get('RowIndex', 0),
                            'column': cell.get('ColumnIndex', 0),
                            'row_span': cell.get('RowSpan', 1),
                            'column_span': cell.get('ColumnSpan', 1)
                        }
                        table['cells'].append(cell_info)
                        logger.debug(f"Added cell: row={cell_info['row']}, col={cell_info['column']}, text={cell_text}")
                    
                    processed_result['tables'].append(table)
                    processed_result['has_tables'] = True
                    total_confidence += block.get('Confidence', 0)
                    total_items += 1
                    logger.debug(f"Added table with {len(table['cells'])} cells")
                
                # Extract all text blocks for full text
                if block['BlockType'] == 'LINE':
                    processed_result['text'] += block.get('Text', '') + '\n'
                    block_item = {
                        'id': block['Id'],
                        'text': block.get('Text', ''),
                        'confidence': block.get('Confidence', 0),
                        'type': 'LINE'
                    }
                    processed_result['blocks'].append(block_item)
                    total_confidence += block.get('Confidence', 0)
                    total_items += 1
                    logger.debug(f"Added text line: {block.get('Text', '')}")
    else:
        logger.debug("Processing plain text response")
        # Process detect_document_text response
        if 'Blocks' in response:
            logger.debug(f"Found {len(response['Blocks'])} blocks in response")
            for block in response['Blocks']:
                if block['BlockType'] == 'LINE':
                    processed_result['text'] += block.get('Text', '') + '\n'
                    block_item = {
                        'id': block['Id'],
                        'text': block.get('Text', ''),
                        'confidence': block.get('Confidence', 0),
                        'type': 'LINE'
                    }
                    processed_result['blocks'].append(block_item)
                    total_confidence += block.get('Confidence', 0)
                    total_items += 1
                    logger.debug(f"Added text line: {block.get('Text', '')}")
                elif block['BlockType'] == 'TABLE':
                    processed_result['has_tables'] = True
                    logger.debug("Document contains tables")
        else:
            # Process detect_document_text format (different structure)
            logger.debug(f"Processing alternative format with {len(response.get('Items', []))} items")
            for item in response.get('Items', []):
                if item['Type'] == 'LINE':
                    processed_result['text'] += item.get('Text', '') + '\n'
                    block_item = {
                        'id': item.get('Id', ''),
                        'text': item.get('Text', ''),
                        'confidence': item.get('Confidence', 0),
                        'type': 'LINE'
                    }
                    processed_result['blocks'].append(block_item)
                    total_confidence += item.get('Confidence', 0)
                    total_items += 1
                    logger.debug(f"Added text line: {item.get('Text', '')}")
    
    # Calculate average confidence
    if total_items > 0:
        processed_result['confidence'] = total_confidence / total_items
    
    logger.debug(f"Finished processing results: {len(processed_result['blocks'])} blocks, {len(processed_result['tables'])} tables, {len(processed_result['forms'])} forms")
    logger.debug(f"Text length: {len(processed_result['text'])} characters, confidence: {processed_result['confidence']}")
    
    return processed_result

def extract_text_from_relationships(block, all_blocks):
    """
    Extract text from related word blocks
    """
    text = ""
    
    for relationship in block.get('Relationships', []):
        if relationship['Type'] == 'CHILD':
            logger.debug(f"Processing {len(relationship['Ids'])} child blocks")
            for child_id in relationship['Ids']:
                child_block = next((b for b in all_blocks if b['Id'] == child_id), None)
                if child_block and child_block['BlockType'] == 'WORD':
                    text += child_block.get('Text', '') + " "
                    logger.debug(f"Added word: {child_block.get('Text', '')}")
    
    return text.strip()

def determine_document_type(file_extension, message_flags):
    """
    Determine the appropriate Textract analysis type to use
    """
    logger.debug(f"Determining document type: file_extension={file_extension}, flags={message_flags}")
    
    # Check if document type hints were provided in the message
    has_tables = message_flags.get('has_tables', False)
    has_forms = message_flags.get('has_forms', False)
    
    # Select appropriate model based on document characteristics and extension
    if has_forms:
        logger.debug("Document type determined: FORMS (from flags)")
        return "FORMS"
    elif has_tables:
        logger.debug("Document type determined: TABLES (from flags)")
        return "TABLES"
    else:
        logger.debug("Document type determined: TEXT (default)")
        return "TEXT"

def store_extracted_text_in_dynamo(document_id, text_content, ocr_results):
    """
    Store the extracted text in DynamoDB
    """
    logger.debug(f"Storing extracted text for document_id={document_id}, text_length={len(text_content)}")
    
    # Store the full text content (might need to be chunked if very large)
    if len(text_content) > 400000:  # DynamoDB item size limit is 400KB
        logger.debug(f"Text content exceeds DynamoDB size limit, chunking required")
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
        
        logger.debug(f"Split text into {len(chunks)} chunks")
            
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
            
            logger.debug(f"Storing chunk {i+1}/{len(chunks)}, size={len(chunk)} bytes")
            
            try:
                documents_table.put_item(Item=chunk_item)
                logger.debug(f"Chunk {i+1} stored successfully")
            except Exception as e:
                logger.error(f"Failed to store chunk {i+1}: {str(e)}")
                raise
    else:
        # Store the full text directly
        logger.debug(f"Storing full text content, size={len(text_content)} bytes")
        content_item = {
            'PK': f'doc#{document_id}',
            'SK': 'content',
            'text': text_content,
            'created_at': datetime.utcnow().isoformat()
        }
        
        try:
            documents_table.put_item(Item=content_item)
            logger.debug("Full text content stored successfully")
        except Exception as e:
            logger.error(f"Failed to store text content: {str(e)}")
            raise
    
    # Store OCR metadata
    logger.debug("Preparing OCR metadata for storage")
    ocr_metadata = {
        'PK': f'doc#{document_id}',
        'SK': 'ocr_results',
        'confidence': ocr_results.get('confidence', 0),
        'has_tables': ocr_results.get('has_tables', False),
        'created_at': datetime.utcnow().isoformat()
    }
    
    # Add tables information if present
    if ocr_results.get('tables'):
        table_count = len(ocr_results['tables'])
        logger.debug(f"Adding {table_count} tables to metadata")
        ocr_metadata['tables_count'] = table_count
        # Store only summary info to stay within size limits
        table_summaries = []
        for i, table in enumerate(ocr_results['tables']):
            table_summary = {
                'rows': table.get('rows', 0),
                'columns': table.get('columns', 0),
                'confidence': table.get('confidence', 0)
            }
            table_summaries.append(table_summary)
            logger.debug(f"Added table summary {i+1}: {table_summary}")
        ocr_metadata['table_summaries'] = table_summaries
    
    # Add forms information if present
    if ocr_results.get('forms'):
        forms_count = len(ocr_results['forms'])
        logger.debug(f"Processing {forms_count} forms")
        ocr_metadata['forms_count'] = forms_count
        # Store forms as separate items to handle size limits
        for i, form in enumerate(ocr_results['forms']):
            form_item = {
                'PK': f'doc#{document_id}',
                'SK': f'form#{i+1}',
                'key': form.get('key', ''),
                'value': form.get('value', ''),
                'confidence': form.get('confidence', 0),
                'created_at': datetime.utcnow().isoformat()
            }
            
            logger.debug(f"Storing form {i+1}: key={form.get('key', '')}, value={form.get('value', '')}")
            
            try:
                documents_table.put_item(Item=form_item)
                logger.debug(f"Form {i+1} stored successfully")
            except Exception as e:
                logger.error(f"Failed to store form {i+1}: {str(e)}")
                raise
    
    # Store OCR metadata
    logger.debug(f"Storing OCR metadata: {ocr_metadata}")
    try:
        documents_table.put_item(Item=ocr_metadata)
        logger.debug("OCR metadata stored successfully")
    except Exception as e:
        logger.error(f"Failed to store OCR metadata: {str(e)}")
        raise
    
    storage_summary = {
        'chunks_count': ocr_metadata.get('total_chunks', 1) if len(text_content) > 400000 else 1,
        'has_tables': ocr_results.get('has_tables', False)
    }
    logger.debug(f"Storage summary: {storage_summary}")
    
    return storage_summary

def queue_for_text_processing(document_id, user_id, ocr_results):
    """
    Queue the document for text processing after OCR
    """
    logger.debug(f"Queueing document {document_id} for text processing")
    
    message = {
        'document_id': document_id,
        'user_id': user_id,
        'ocr_result': True,
        'has_tables': ocr_results.get('has_tables', False),
        'timestamp': datetime.utcnow().isoformat()
    }
    
    logger.debug(f"SQS message content: {message}")
    
    # Send to text processing
    try:
        response = sqs.send_message(
            QueueUrl=text_processing_queue,
            MessageBody=json.dumps(message)
        )
        logger.debug(f"SQS message sent successfully, message ID: {response.get('MessageId')}")
    except Exception as e:
        logger.error(f"Failed to send SQS message: {str(e)}")
        raise
    
    logger.info(f"Document {document_id} queued for text processing after OCR")

def lambda_handler(event, context):
    """
    Main Lambda handler
    """
    logger.debug(f"Lambda invoked with event: {json.dumps(event)}")
    logger.debug(f"Lambda context: requestId={context.aws_request_id}, function={context.function_name}, memory={context.memory_limit_in_mb}MB")
    
    record_count = len(event['Records'])
    logger.info(f"Processing {record_count} records")
    
    for i, record in enumerate(event['Records']):
        logger.debug(f"Processing record {i+1}/{record_count}")
        
        # Parse message from SQS
        message = json.loads(record['body'])
        document_id = message['document_id']
        user_id = message['user_id']
        file_key = message['file_key']
        
        logger.debug(f"Message details: document_id={document_id}, user_id={user_id}, file_key={file_key}")
        
        # Get document hints if available
        document_flags = message.get('metadata', {})
        logger.debug(f"Document flags: {document_flags}")
        
        # Get file extension
        file_extension = os.path.splitext(file_key)[1].lower()
        logger.debug(f"File extension: {file_extension}")
        
        logger.info(f"OCR processing document {document_id} for user {user_id}")
        
        try:
            # Update status to processing
            logger.debug("Updating document status to OCR_PROCESSING")
            update_document_status(document_id, 'OCR_PROCESSING')
            
            # Determine document type for processing
            doc_type = determine_document_type(file_extension, document_flags)
            logger.info(f"Using Textract analysis type: {doc_type}")
            
            # Process with Textract directly from S3
            logger.debug(f"Starting Textract processing: bucket={raw_bucket}, key={file_key}")
            ocr_result = process_with_textract(raw_bucket, file_key, doc_type)
            
            # Update document with OCR results
            if ocr_result['status'] == 'success':
                logger.info(f"Textract processing successful for document {document_id}")
                
                # Store the extracted text in DynamoDB
                logger.debug("Storing extracted text in DynamoDB")
                text_result = store_extracted_text_in_dynamo(document_id, ocr_result.get('text', ''), ocr_result)
                
                metadata = {
                    'ocr_confidence': ocr_result.get('confidence', 0),
                    'extraction_method': 'OCR',
                    'has_tables': ocr_result.get('has_tables', False)
                }
                logger.debug(f"Updating document status to OCR_COMPLETED with metadata: {metadata}")
                update_document_status(document_id, 'OCR_COMPLETED', metadata)
                
                # Queue for text processing
                logger.debug("Queueing document for text processing")
                queue_for_text_processing(document_id, user_id, ocr_result)
                logger.info(f"Document {document_id} OCR processing completed successfully")
            else:
                logger.error(f"Textract processing failed for document {document_id}: {ocr_result.get('error', 'Unknown error')}")
                update_document_status(document_id, 'OCR_FAILED', {'error': ocr_result.get('error', 'Unknown error')})
                
        except Exception as e:
            logger.error(f"Error processing OCR for document {document_id}: {str(e)}")
            logger.debug("Full exception details:", exc_info=True)
            update_document_status(document_id, 'OCR_FAILED', {'error': str(e)})
            raise
    
    logger.info("Lambda handler completed successfully")
    return {
        'statusCode': 200,
        'body': json.dumps('OCR processing complete')
    }