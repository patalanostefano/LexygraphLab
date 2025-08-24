# text-processing-service/app.py
import os
import json
import boto3
import logging
from datetime import datetime
import tempfile
import nltk
from nltk.tokenize import sent_tokenize
import spacy

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

# SQS queue for summarization
summarizer_queue = os.environ['SUMMARIZER_QUEUE']

# S3 buckets
raw_bucket = os.environ['RAW_BUCKET']

# Processing modes
MODE_EXTRACT_TEXT = "extract_text"
MODE_EXTRACT_ENTITIES = "extract_entities"

# Load minimal NLP resources to save time
nltk.download('punkt', download_dir='/tmp', quiet=True)
nltk.data.path.append('/tmp')
# Load smaller spaCy model for speed
nlp = spacy.load("en_core_web_sm")

def update_document_status(document_id, status, metadata=None):
    """Update the document status in DynamoDB"""
    logger.info(f"Updating document {document_id} status: {status}")
    update_expr = "SET #status = :status, updated_at = :updated_at"
    expr_attr_names = {'#status': 'status'}
    expr_attr_values = {
        ':status': status,
        ':updated_at': datetime.utcnow().isoformat()
    }
    
    if metadata:
        for idx, (key, value) in enumerate(metadata.items()):
            if key not in ['PK', 'SK']:
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
        'step': 'TEXT_PROCESSING',
        'timestamp': datetime.utcnow().isoformat(),
        'service_type': 'text_processing_service'
    })

def get_document_text(document_id, is_ocr_result):
    """Retrieve document text from DynamoDB or S3"""
    logger.info(f"Getting text for document {document_id}")
    
    if is_ocr_result:
        # Try to get content chunks from OCR process
        chunks_query = documents_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('PK').eq(f'doc#{document_id}') &
                                  boto3.dynamodb.conditions.Key('SK').begins_with('content#chunk')
        )
        
        if chunks_query['Items']:
            chunks = sorted(chunks_query['Items'], key=lambda x: x.get('chunk_number', 0))
            return ''.join(chunk.get('text', '') for chunk in chunks)
        
        # Try to get single content item
        response = documents_table.get_item(
            Key={'PK': f'doc#{document_id}', 'SK': 'content'}
        )
        if 'Item' in response:
            return response['Item'].get('text', '')
    else:
        # For non-OCR documents, extract from S3
        metadata_response = documents_table.get_item(
            Key={'PK': f'doc#{document_id}', 'SK': 'metadata'}
        )
        
        if 'Item' in metadata_response:
            file_key = metadata_response['Item'].get('content_s3_key')
            if file_key:
                with tempfile.NamedTemporaryFile() as tmp:
                    s3.download_file(raw_bucket, file_key, tmp.name)
                    with open(tmp.name, 'r', errors='ignore') as f:
                        text = f.read()
                    return text
    
    logger.warning(f"No text content found for document {document_id}")
    return None

def get_document_chunks(document_id):
    """Retrieve text chunks for a document from DynamoDB"""
    logger.info(f"Retrieving text chunks for document {document_id}")
    
    chunks_query = documents_table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('PK').eq(f'doc#{document_id}') &
                              boto3.dynamodb.conditions.Key('SK').begins_with('chunk#')
    )
    
    if chunks_query['Items']:
        chunks = sorted(chunks_query['Items'], key=lambda x: x.get('chunk_number', 0))
        return [chunk.get('text', '') for chunk in chunks]
    
    logger.warning(f"No chunks found for document {document_id}")
    return []

def chunk_text(text, max_chunk_size=5000):
    """Divide text into chunks respecting sentence boundaries"""
    logger.info(f"Chunking text of length {len(text)}")
    
    # Simple chunking by paragraphs
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = ""
    
    for paragraph in paragraphs:
        if not paragraph.strip():
            continue
        
        if len(current_chunk) + len(paragraph) > max_chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = paragraph + "\n\n"
        else:
            current_chunk += paragraph + "\n\n"
    
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    logger.info(f"Text chunked into {len(chunks)} parts")
    return chunks

def extract_entities(text):
    """Extract named entities from text using spaCy"""
    logger.info(f"Extracting entities from text of length {len(text)}")
    entities = []
    
    # Process in chunks to avoid memory issues
    max_length = 50000  # Smaller chunk size for Lambda
    
    if len(text) <= max_length:
        doc = nlp(text)
        for ent in doc.ents:
            entities.append({
                'text': ent.text,
                'type': ent.label_,
                'start': ent.start_char,
                'end': ent.end_char,
            })
    else:
        # Process in chunks
        for i in range(0, len(text), max_length):
            chunk = text[i:i + max_length]
            doc = nlp(chunk)
            for ent in doc.ents:
                entities.append({
                    'text': ent.text,
                    'type': ent.label_,
                    'start': i + ent.start_char,
                    'end': i + ent.end_char,
                })
    
    # Deduplicate entities
    unique_entities = {}
    for entity in entities:
        key = f"{entity['text']}:{entity['type']}"
        if key not in unique_entities:
            unique_entities[key] = entity
    
    logger.info(f"Extracted {len(unique_entities)} unique entities")
    return list(unique_entities.values())

def extract_entities_from_chunks(document_id):
    """Extract entities from all chunks of a document"""
    logger.info(f"Extracting entities from document {document_id}")
    chunks = get_document_chunks(document_id)
    
    if not chunks:
        return []
    
    all_entities = []
    
    # Process only first few chunks for Lambda time constraints
    max_chunks = min(5, len(chunks))
    logger.info(f"Processing {max_chunks} out of {len(chunks)} chunks due to time constraints")
    
    for i in range(max_chunks):
        chunk = chunks[i]
        chunk_entities = extract_entities(chunk)
        all_entities.extend(chunk_entities)
    
    # If there are more chunks, we should queue a separate job for them
    if len(chunks) > max_chunks:
        logger.info(f"Remaining {len(chunks) - max_chunks} chunks will need separate processing")
        # In a real implementation, queue another job for remaining chunks
    
    # Deduplicate entities
    unique_entities = {}
    for entity in all_entities:
        key = f"{entity['text']}:{entity['type']}"
        if key not in unique_entities:
            unique_entities[key] = entity
    
    logger.info(f"Found {len(unique_entities)} unique entities")
    return list(unique_entities.values())

def store_chunks_in_dynamo(document_id, chunks):
    """Store text chunks in DynamoDB"""
    logger.info(f"Storing {len(chunks)} text chunks for document {document_id}")
    
    for i, chunk in enumerate(chunks):
        chunk_item = {
            'PK': f'doc#{document_id}',
            'SK': f'chunk#{i+1}',
            'text': chunk,
            'chunk_number': i+1,
            'total_chunks': len(chunks),
            'created_at': datetime.utcnow().isoformat(),
            'char_count': len(chunk),
            'word_count': len(chunk.split())
        }
        
        documents_table.put_item(Item=chunk_item)
    
    return len(chunks)

def store_entities_in_dynamo(document_id, entities):
    """Store entities in DynamoDB"""
    logger.info(f"Storing {len(entities)} entities for document {document_id}")
    
    # Store summary of entities
    entity_summary = {
        'PK': f'doc#{document_id}',
        'SK': 'entities',
        'created_at': datetime.utcnow().isoformat(),
        'entity_count': len(entities),
        'entity_types': list(set(entity['type'] for entity in entities))
    }
    
    documents_table.put_item(Item=entity_summary)
    
    # Group entities by type
    entity_batches = {}
    for entity in entities:
        entity_type = entity['type']
        if entity_type not in entity_batches:
            entity_batches[entity_type] = []
        entity_batches[entity_type].append(entity)
    
    # Store each entity type as separate item
    for entity_type, type_entities in entity_batches.items():
        # Check if entities batch is too large
        if len(json.dumps(type_entities)) > 390000:
            # Split into smaller batches (simplified for Lambda performance)
            batch_size = max(1, len(type_entities) // 2)
            for batch_num, i in enumerate(range(0, len(type_entities), batch_size)):
                batch = type_entities[i:i+batch_size]
                documents_table.put_item(Item={
                    'PK': f'doc#{document_id}',
                    'SK': f'entity#{entity_type}#{batch_num+1}',
                    'entity_type': entity_type,
                    'batch': batch_num+1,
                    'entities': batch,
                    'count': len(batch),
                    'created_at': datetime.utcnow().isoformat()
                })
        else:
            # Store all entities of this type in single item
            documents_table.put_item(Item={
                'PK': f'doc#{document_id}',
                'SK': f'entity#{entity_type}',
                'entity_type': entity_type,
                'entities': type_entities,
                'count': len(type_entities),
                'created_at': datetime.utcnow().isoformat()
            })
    
    return len(entities)

def send_to_summarizer(document_id, user_id, chunks_count):
    """Queue the document for summarization"""
    logger.info(f"Queueing document {document_id} for summarization")
    
    message = {
        'document_id': document_id,
        'user_id': user_id,
        'chunks_count': chunks_count,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    sqs.send_message(
        QueueUrl=summarizer_queue,
        MessageBody=json.dumps(message)
    )

def lambda_handler(event, context):
    """
    Text Processing Lambda handler
    
    Supports two modes:
    - extract_text: Extract and chunk text (default for normal flow)
    - extract_entities: Extract entities from existing chunks
    
    Can be triggered:
    - From SQS queue (normal flow)
    - Directly via API call
    """
    # Start a timer to ensure we don't exceed Lambda execution time
    start_time = datetime.now()
    
    # Check if this is a direct API invocation
    if 'Records' not in event:
        # Direct API invocation
        logger.info("Direct API invocation detected")
        
        document_id = event.get('document_id')
        user_id = event.get('user_id')
        processing_mode = event.get('processing_mode', MODE_EXTRACT_ENTITIES)
        
        if not document_id or not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': "Missing document_id or user_id"})
            }
        
        try:
            # Update status
            update_document_status(document_id, 'TEXT_PROCESSING')
            
            # Process based on mode
            if processing_mode == MODE_EXTRACT_TEXT:
                # Extract and chunk text
                text = get_document_text(document_id, False)
                if not text:
                    raise Exception("No text content found")
                
                chunks = chunk_text(text)
                chunks_count = store_chunks_in_dynamo(document_id, chunks)
                result = {
                    'chunks_count': chunks_count,
                    'text_length': len(text)
                }
                
                # Queue for summarization
                send_to_summarizer(document_id, user_id, chunks_count)
                
            elif processing_mode == MODE_EXTRACT_ENTITIES:
                # Extract entities from existing chunks
                entities = extract_entities_from_chunks(document_id)
                entities_count = store_entities_in_dynamo(document_id, entities)
                result = {
                    'entities_count': entities_count,
                    'hasEntities': entities_count > 0
                }
                
            # Update document status
            update_document_status(document_id, 'TEXT_PROCESSED', result)
            
            # Return success response
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'document_id': document_id,
                    'status': 'TEXT_PROCESSED',
                    'result': result
                })
            }
            
        except Exception as e:
            logger.error(f"Error processing text for document {document_id}: {str(e)}")
            update_document_status(document_id, 'TEXT_PROCESSING_FAILED', {'error': str(e)})
            
            return {
                'statusCode': 500,
                'body': json.dumps({'error': str(e)})
            }
    
    # SQS queue invocation (normal processing flow)
    for record in event['Records']:
        # Check remaining execution time - exit if close to timeout
        elapsed = (datetime.now() - start_time).total_seconds()
        if elapsed > 8:  # Leave 2 seconds buffer
            logger.warning("Approaching Lambda timeout, exiting")
            break
        
        # Parse message from SQS
        message = json.loads(record['body'])
        document_id = message['document_id']
        user_id = message['user_id']
        is_ocr_result = message.get('ocr_result', False)
        
        # Default to text extraction for normal flow
        processing_mode = message.get('processing_mode', MODE_EXTRACT_TEXT)
        
        logger.info(f"Processing document {document_id}, mode={processing_mode}")
        
        try:
            # Update status
            update_document_status(document_id, 'TEXT_PROCESSING')
            
            if processing_mode == MODE_EXTRACT_TEXT:
                # Get text, chunk it, store chunks
                text = get_document_text(document_id, is_ocr_result)
                if not text:
                    raise Exception("Failed to retrieve document text")
                
                chunks = chunk_text(text)
                chunks_count = store_chunks_in_dynamo(document_id, chunks)
                
                # Update status with text processing results
                update_document_status(document_id, 'TEXT_PROCESSED', {
                    'text_length': len(text),
                    'chunks_count': chunks_count
                })
                
                # Queue for summarization
                send_to_summarizer(document_id, user_id, chunks_count)
                
            elif processing_mode == MODE_EXTRACT_ENTITIES:
                # Extract and store entities
                entities = extract_entities_from_chunks(document_id)
                entities_count = store_entities_in_dynamo(document_id, entities)
                
                # Update status with entity results
                update_document_status(document_id, 'TEXT_PROCESSED', {
                    'entities_count': entities_count,
                    'hasEntities': entities_count > 0
                })
                
        except Exception as e:
            logger.error(f"Error processing document {document_id}: {str(e)}")
            update_document_status(document_id, 'TEXT_PROCESSING_FAILED', {'error': str(e)})
    
    return {
        'statusCode': 200,
        'body': json.dumps('Text processing complete')
    }
