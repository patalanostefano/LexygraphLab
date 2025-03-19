# text-processing-service/app.py
import os
import json
import boto3
import logging
from datetime import datetime
import re
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
collections_table = dynamodb.Table(os.environ['COLLECTIONS_TABLE'])

# SQS queue for summarization
summarizer_queue = os.environ['SUMMARIZER_QUEUE']

# S3 buckets
raw_bucket = os.environ['RAW_BUCKET']

# Download NLTK resources
nltk.download('punkt', download_dir='/tmp')
nltk.data.path.append('/tmp')

# Load spaCy model
spacy_model = "en_core_web_sm"
nlp = spacy.load(spacy_model)

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
    doc_processing_table.put_item(Item={
        'PK': f'doc#{document_id}',
        'SK': f'process#{datetime.utcnow().isoformat()}',
        'status': status,
        'step': 'TEXT_PROCESSING',
        'timestamp': datetime.utcnow().isoformat(),
        'service_type': 'text_processing_service'
    })

def get_document_text(document_id, is_ocr_result):
    """
    Retrieve document text from DynamoDB
    """
    try:
        if is_ocr_result:
            # Try to get content that might be split across chunks
            chunks_query = documents_table.query(
                KeyConditionExpression=boto3.dynamodb.conditions.Key('PK').eq(f'doc#{document_id}') &
                                      boto3.dynamodb.conditions.Key('SK').begins_with('content#chunk')
            )
            
            if chunks_query['Items']:
                # Text is stored in chunks - need to reassemble
                chunks = sorted(chunks_query['Items'], key=lambda x: x.get('chunk_number', 0))
                text = ''.join(chunk.get('text', '') for chunk in chunks)
                return text
            
            # Try to get a single content item
            response = documents_table.get_item(
                Key={'PK': f'doc#{document_id}', 'SK': 'content'}
            )
            
            if 'Item' in response:
                return response['Item'].get('text', '')
        else:
            # For non-OCR documents, we may need to extract text from S3
            metadata_response = documents_table.get_item(
                Key={'PK': f'doc#{document_id}', 'SK': 'metadata'}
            )
            
            if 'Item' in metadata_response:
                file_key = metadata_response['Item'].get('content_s3_key')
                if file_key:
                    # Get the file and extract text (simplified - would need to handle different formats)
                    with tempfile.NamedTemporaryFile() as tmp:
                        s3.download_file(raw_bucket, file_key, tmp.name)
                        # Extract text - this is a simplified version
                        # Would need appropriate libraries for different file types
                        with open(tmp.name, 'r', errors='ignore') as f:
                            text = f.read()
                        return text
        
        logger.warning(f"No text content found for document {document_id}")
        return None
    except Exception as e:
        logger.error(f"Error retrieving text for document {document_id}: {str(e)}")
        return None

def chunk_text(text, max_chunk_size=5000, min_sentences=3):
    """
    Divide text into chunks while respecting sentence boundaries
    """
    # First, split by paragraphs
    paragraphs = text.split('\n\n')
    
    chunks = []
    current_chunk = ""
    
    for paragraph in paragraphs:
        # Skip empty paragraphs
        if not paragraph.strip():
            continue
        
        # If adding this paragraph would exceed the max size, start a new chunk
        if len(current_chunk) + len(paragraph) > max_chunk_size and current_chunk:
            # Try to break at sentence boundaries for cleaner chunks
            sentences = sent_tokenize(current_chunk)
            
            if len(sentences) > min_sentences * 2:
                # Find a good break point (roughly middle)
                midpoint = len(sentences) // 2
                
                # First half becomes a chunk
                chunk1 = " ".join(sentences[:midpoint])
                chunks.append(chunk1.strip())
                
                # Second half starts the next chunk
                current_chunk = " ".join(sentences[midpoint:]) + "\n\n" + paragraph + "\n\n"
            else:
                # If not enough sentences for a good split, keep as is
                chunks.append(current_chunk.strip())
                current_chunk = paragraph + "\n\n"
        else:
            current_chunk += paragraph + "\n\n"
    
    # Add the last chunk if it's not empty
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    return chunks

def extract_entities(text):
    """
    Extract named entities from text using spaCy
    """
    entities = []
    
    # Process text with spaCy - handle large documents by processing in chunks
    max_length = 100000  # spaCy default is much smaller, but we increase it
    
    if len(text) <= max_length:
        # Process entire text at once
        doc = nlp(text)
        
        for ent in doc.ents:
            entity = {
                'text': ent.text,
                'type': ent.label_,
                'start': ent.start_char,
                'end': ent.end_char,
            }
            entities.append(entity)
    else:
        # Split text into overlapping chunks for processing
        text_chunks = []
        chunk_size = max_length - 10000  # Allow for some overlap
        
        for i in range(0, len(text), chunk_size):
            chunk = text[i:i + chunk_size]
            # Find a sentence boundary if possible
            if i + chunk_size < len(text):
                # look for a period followed by space or newline
                pos = chunk.rfind('. ')
                if pos == -1:
                    pos = chunk.rfind('.\n')
                if pos != -1:
                    chunk = chunk[:pos + 1]  # Include the period
            
            text_chunks.append((i, chunk))
        
        # Process each chunk
        for offset, chunk in text_chunks:
            doc = nlp(chunk)
            
            for ent in doc.ents:
                entity = {
                    'text': ent.text,
                    'type': ent.label_,
                    'start': offset + ent.start_char,
                    'end': offset + ent.end_char,
                }
                entities.append(entity)
    
    # Deduplicate entities
    unique_entities = {}
    for entity in entities:
        key = f"{entity['text']}:{entity['type']}"
        if key not in unique_entities:
            unique_entities[key] = entity
    
    return list(unique_entities.values())

def store_chunks_in_dynamo(document_id, chunks):
    """
    Store text chunks in DynamoDB
    """
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
        
        # Store in DynamoDB
        documents_table.put_item(Item=chunk_item)
    
    logger.info(f"Stored {len(chunks)} chunks for document {document_id}")
    return len(chunks)

def store_entities_in_dynamo(document_id, entities):
    """
    Store entities in DynamoDB with efficient indexing
    """
    # Store summary of all entities
    entity_summary = {
        'PK': f'doc#{document_id}',
        'SK': 'entities',
        'created_at': datetime.utcnow().isoformat(),
        'entity_count': len(entities),
        'entity_types': list(set(entity['type'] for entity in entities))
    }
    
    documents_table.put_item(Item=entity_summary)
    
    # Group entities by type to reduce number of DB operations
    entity_batches = {}
    for entity in entities:
        entity_type = entity['type']
        if entity_type not in entity_batches:
            entity_batches[entity_type] = []
        
        entity_batches[entity_type].append(entity)
    
    # Store each entity type as a separate item
    for entity_type, type_entities in entity_batches.items():
        # If we have too many entities of one type, we may need to split them
        if len(json.dumps(type_entities)) > 390000:  # DynamoDB item size limit is 400KB
            # Split into smaller batches
            current_batch = []
            current_size = 0
            batch_num = 1
            
            for entity in type_entities:
                entity_size = len(json.dumps(entity))
                if current_size + entity_size > 390000:
                    # Store current batch and start a new one
                    documents_table.put_item(Item={
                        'PK': f'doc#{document_id}',
                        'SK': f'entity#{entity_type}#{batch_num}',
                        'entity_type': entity_type,
                        'batch': batch_num,
                        'entities': current_batch,
                        'count': len(current_batch),
                        'created_at': datetime.utcnow().isoformat()
                    })
                    
                    current_batch = [entity]
                    current_size = entity_size
                    batch_num += 1
                else:
                    current_batch.append(entity)
                    current_size += entity_size
            
            # Store final batch if not empty
            if current_batch:
                documents_table.put_item(Item={
                    'PK': f'doc#{document_id}',
                    'SK': f'entity#{entity_type}#{batch_num}',
                    'entity_type': entity_type,
                    'batch': batch_num,
                    'entities': current_batch,
                    'count': len(current_batch),
                    'created_at': datetime.utcnow().isoformat()
                })
        else:
            # Store all entities of this type in a single item
            documents_table.put_item(Item={
                'PK': f'doc#{document_id}',
                'SK': f'entity#{entity_type}',
                'entity_type': entity_type,
                'entities': type_entities,
                'count': len(type_entities),
                'created_at': datetime.utcnow().isoformat()
            })
    
    # Create index items for each unique entity for quick lookup
    # This enables finding all documents that mention a specific entity
    for entity in entities:
        # Normalize the entity text to create a consistent key
        normalized_text = entity['text'].lower().strip()
        if normalized_text:
            # Create a GSI item for entity lookup
            # This would require a GSI on PK + SK
            documents_table.put_item(Item={
                'PK': f'entity#{entity["type"]}#{normalized_text}',
                'SK': f'doc#{document_id}',
                'document_id': document_id,
                'entity_text': entity['text'],
                'entity_type': entity['type'],
                'created_at': datetime.utcnow().isoformat()
            })
    
    logger.info(f"Stored {len(entities)} entities for document {document_id}")
    return len(entities)

def process_text(document_id, text):
    """
    Process document text: chunk, extract entities, and prepare for summarization
    """
    if not text:
        raise Exception("No text content available for processing")
    
    # Chunk the text
    chunks = chunk_text(text)
    logger.info(f"Document {document_id} chunked into {len(chunks)} parts")
    
    # Store chunks in DynamoDB
    chunks_count = store_chunks_in_dynamo(document_id, chunks)
    
    # Extract entities from the full text
    entities = extract_entities(text)
    logger.info(f"Extracted {len(entities)} entities from document {document_id}")
    
    # Store entities in DynamoDB
    entities_count = store_entities_in_dynamo(document_id, entities)
    
    # Return processing results
    return {
        'chunks_count': chunks_count,
        'entities_count': entities_count
    }

def queue_for_summarization(document_id, user_id, chunks_count):
    """
    Queue the document for summarization
    """
    message = {
        'document_id': document_id,
        'user_id': user_id,
        'chunks_count': chunks_count,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    # Send to summarizer
    sqs.send_message(
        QueueUrl=summarizer_queue,
        MessageBody=json.dumps(message)
    )
    
    logger.info(f"Document {document_id} queued for summarization")

def lambda_handler(event, context):
    """
    Main Lambda handler
    """
    for record in event['Records']:
        # Parse message from SQS
        message = json.loads(record['body'])
        document_id = message['document_id']
        user_id = message['user_id']
        is_ocr_result = message.get('ocr_result', False)
        
        logger.info(f"Processing text for document {document_id} for user {user_id}")
        
        try:
            # Update status to processing
            update_document_status(document_id, 'TEXT_PROCESSING')
            
            # Get document text
            text = get_document_text(document_id, is_ocr_result)
            
            if not text:
                raise Exception("Failed to retrieve document text")
            
            # Process text and extract entities
            processing_results = process_text(document_id, text)
            
            # Update document status
            update_document_status(document_id, 'TEXT_PROCESSED', {
                'text_length': len(text),
                'language': 'en',  # In a real implementation, detect language
                'entities_count': processing_results['entities_count'],
                'chunks_count': processing_results['chunks_count'],
                'hasEntities': processing_results['entities_count'] > 0
            })
            
            # Queue for summarization
            queue_for_summarization(document_id, user_id, processing_results['chunks_count'])
            
        except Exception as e:
            logger.error(f"Error processing text for document {document_id}: {str(e)}")
            update_document_status(document_id, 'TEXT_PROCESSING_FAILED', {'error': str(e)})
            raise
    
    return {
        'statusCode': 200,
        'body': json.dumps('Text processing complete')
    }
