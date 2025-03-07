# app.py - Lambda function for document summarization

import os
import json
import boto3
import logging
from datetime import datetime
import openai

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# DynamoDB tables
documents_table = dynamodb.Table(os.environ['DOCUMENTS_TABLE'])
doc_processing_table = dynamodb.Table(os.environ['DOC_PROCESSING_TABLE'])

# S3 bucket for processed documents
processed_bucket = os.environ['PROCESSED_DOCUMENTS_BUCKET']

# Azure OpenAI or OpenAI API key
OPENAI_API_KEY = os.environ['OPENAI_API_KEY']
openai.api_key = OPENAI_API_KEY

# Option to use Azure OpenAI
AZURE_OPENAI_ENDPOINT = os.environ.get('AZURE_OPENAI_ENDPOINT')
if AZURE_OPENAI_ENDPOINT:
    openai.api_type = "azure"
    openai.api_base = AZURE_OPENAI_ENDPOINT
    openai.api_version = "2023-05-15"

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
        'step': 'SUMMARIZATION',
        'timestamp': datetime.utcnow().isoformat(),
        'service_type': 'summarizer_service'
    })

def get_document_chunks(document_id, user_id, chunks_count):
    """
    Retrieve document text chunks from S3
    """
    chunks = []
    
    for i in range(1, chunks_count + 1):
        try:
            s3_key = f"users/{user_id}/documents/{document_id}/processed/chunk_{i}.txt"
            response = s3.get_object(Bucket=processed_bucket, Key=s3_key)
            chunk_text = response['Body'].read().decode('utf-8')
            chunks.append(chunk_text)
        except Exception as e:
            logger.error(f"Error retrieving chunk {i} for document {document_id}: {str(e)}")
    
    return chunks

def summarize_with_openai(text, max_length=500):
    """
    Generate a summary using OpenAI's GPT model
    """
    try:
        response = openai.chat.completions.create(
            model="gpt-4",  # or "gpt-35-turbo" for Azure
            messages=[
                {"role": "system", "content": "You are an expert document summarizer. Create a concise yet comprehensive summary."},
                {"role": "user", "content": f"Summarize the following text in about {max_length} characters:\n\n{text}"}
            ],
            max_tokens=max_length,
            temperature=0.5,
            top_p=1.0
        )
        
        # Extract the summary from the response
        summary = response.choices[0].message.content.strip()
        
        return {
            'status': 'success',
            'summary': summary
        }
    except Exception as e:
        logger.error(f"Error in OpenAI summarization: {str(e)}")
        return {
            'status': 'failed',
            'error': str(e)
        }

def extract_key_points(text):
    """
    Extract key points from the text using OpenAI
    """
    try:
        response = openai.chat.completions.create(
            model="gpt-4",  # or "gpt-35-turbo" for Azure
            messages=[
                {"role": "system", "content": "You are an expert at extracting important points from documents."},
                {"role": "user", "content": "Extract 3-5 key points from the following text as a JSON array of strings:\n\n" + text}
            ],
            max_tokens=1000,
            temperature=0.3,
            top_p=1.0
        )
        
        # Extract the key points from the response
        result = response.choices[0].message.content.strip()
        
        # Parse the response as JSON if it's in JSON format
        try:
            key_points = json.loads(result)
            # Ensure the result is an array
            if isinstance(key_points, list):
                return key_points
            return []
        except:
            # If it's not valid JSON, try to parse it manually
            lines = result.split('\n')
            key_points = []
            for line in lines:
                # Remove list markers like "1.", "*", "-"
                cleaned_line = re.sub(r'^\s*[\d*\-]+[\.\)\]]*\s*', '', line).strip()
                if cleaned_line:
                    key_points.append(cleaned_line)
            return key_points
            
    except Exception as e:
        logger.error(f"Error extracting key points: {str(e)}")
        return []

def generate_summary(document_id, user_id, chunks):
    """
    Generate summary for the document
    """
    # For very large documents, we might need to summarize each chunk 
    # and then create a summary of summaries
    summary_text = ""
    key_points = []
    
    if len(chunks) <= 3:
        # For smaller documents, summarize the whole text
        full_text = "\n\n".join(chunks)
        
        # Generate summary
        summary_result = summarize_with_openai(full_text)
        if summary_result['status'] == 'success':
            summary_text = summary_result['summary']
            
            # Extract key points
            key_points = extract_key_points(full_text)
    else:
        # For larger documents, summarize each chunk, then create a summary of summaries
        chunk_summaries = []
        
        for chunk in chunks:
            summary_result = summarize_with_openai(chunk, max_length=200)
            if summary_result['status'] == 'success':
                chunk_summaries.append(summary_result['summary'])
        
        # Create a summary of summaries
        combined_summaries = "\n\n".join(chunk_summaries)
        final_summary_result = summarize_with_openai(combined_summaries)
        if final_summary_result['status'] == 'success':
            summary_text = final_summary_result['summary']
            
            # Extract key points from the combined summaries
            key_points = extract_key_points(combined_summaries)
    
    # Store summary in S3
    summary_data = {
        'summary': summary_text,
        'keyPoints': key_points,
        'generated_at': datetime.utcnow().isoformat()
    }
    
    s3_key = f"users/{user_id}/documents/{document_id}/processed/summary.json"
    s3.put_object(
        Bucket=processed_bucket,
        Key=s3_key,
        Body=json.dumps(summary_data),
        ContentType='application/json'
    )
    
    # Store summary text in a separate file for easier access
    s3_key = f"users/{user_id}/documents/{document_id}/processed/summary.txt"
    s3.put_object(
        Bucket=processed_bucket,
        Key=s3_key,
        Body=summary_text,
        ContentType='text/plain'
    )
    
    return {
        'summary': summary_text,
        'key_points': key_points
    }

def lambda_handler(event, context):
    """
    Main Lambda handler
    """
    for record in event['Records']:
        # Parse message from SQS
        message = json.loads(record['body'])
        document_id = message['document_id']
        user_id = message['user_id']
        chunks_count = message['chunks_count']
        
        logger.info(f"Summarizing document {document_id} for user {user_id}")
        
        try:
            # Update status to summarizing
            update_document_status(document_id, 'SUMMARIZING')
            
            # Get document chunks
            chunks = get_document_chunks(document_id, user_id, chunks_count)
            
            if not chunks:
                raise Exception("Failed to retrieve document chunks")
            
            # Generate summary
            summary_results = generate_summary(document_id, user_id, chunks)
            
            # Update document status
            update_document_status(document_id, 'COMPLETED', {
                'hasSummary': True,
                'summaryLength': len(summary_results['summary']),
                'keyPointsCount': len(summary_results['key_points'])
            })
            
        except Exception as e:
            logger.error(f"Error summarizing document {document_id}: {str(e)}")
            update_document_status(document_id, 'SUMMARIZING_FAILED', {'error': str(e)})
            raise
    
    return {
        'statusCode': 200,
        'body': json.dumps('Summarization complete')
    }
