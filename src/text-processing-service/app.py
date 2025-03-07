# app.py - Lambda function for text processing

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

# SQS queue for summarization
summarizer_queue = os.environ['SUMMARIZER_QUEUE']

# S3 buckets
raw_bucket = os.environ['RAW_DOCUMENTS_BUCKET']
processed_bucket = os.environ['PROCESSED_DOCUMENTS_BUCKET']

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

def get_document_text(document_id, user_id, is_ocr_result):
    """
    Retrieve document text from S3
    """
    if is_ocr_result:
        # If the document was processed by OCR, get the extracted text
        s3_key = f"users/{user_id}/documents/{document_id}/processed/extracted_text.txt"
    else:
        # Otherwise, get the text from the parser
        s3_key = f"users/{user_id}/documents/{document_id}/processed/parsed_text.txt"
    
    try:
        response = s3.get_object(Bucket=processed_bucket, Key=s3_key)
        text = response['Body'].read().decode('utf-8')
        return text
    except Exception as e:
        logger.error(f"Error retrieving text for document {document_id}: {str(e)}")
        return None

def chunk_text(text, max_chunk_size=5000):
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
    
    # Process text with spaCy
    doc = nlp(text)
    
    for ent in doc.ents:
        entity = {
            'text': ent.text,
            'type': ent.label_,
            'start': ent.start_char,
            'end': ent.end_char,
        }
        entities.append(entity)
    
    return entities

def process_text(document_id, user_id, text):
    """
    Process document text: chunk, extract entities, and prepare for summarization
    """
    # Chunk the text
    chunks = chunk_text(text)
    logger.info(f"Document {document_id} chunked into {len(chunks)} parts")
    
    # Extract entities from the full text
    entities = extract_entities(text)
    logger.info(f"Extracted {len(entities)} entities from document {document_id}")
    
    # Store chunks in S3
    for i, chunk in enumerate(chunks):
        s3_key = f"users/{user_id}/documents/{document_id}/processed/chunk_{i+1}.txt"
        s3.put_object(
            Bucket=processed_bucket,
            Key=s3_key,
            Body=chunk,
            ContentType='text/plain'
        )
    
    # Store entities in S3
    entities_data = json.dumps(entities)
    s3_key = f"users/{user_id}/documents/{document_id}/processed/entities.json"
    s3.put_object(
        Bucket=processed_bucket,
        Key=s3_key,
        Body=entities_data,
        ContentType='application/json'
    )
    
    # Store entity information in DynamoDB for quick access
    entity_types = set(entity['type'] for entity in entities)
    update_document_status(document_id, 'ENTITIES_EXTRACTED', {
        'entities_count': len(entities),
        'entity_types': list(entity_types),
        'chunks_count': len(chunks),
        'hasEntities': True
    })
    
    return {
        'chunks_count': len(chunks),
        'entities_count': len(entities)
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
            text = get_document_text(document_id, user_id, is_ocr_result)
            
            if not text:
                raise Exception("Failed to retrieve document text")
            
            # Process text and extract entities
            processing_results = process_text(document_id, user_id, text)
            
            # Update document status
            update_document_status(document_id, 'TEXT_PROCESSED', {
                'text_length': len(text),
                'language': 'en'  # In a real implementation, detect language
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
