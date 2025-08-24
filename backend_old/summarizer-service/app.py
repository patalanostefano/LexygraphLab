import os
import json
import boto3
import logging
from datetime import datetime
import time
from typing import List, Dict, Any, Optional

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
bedrock = boto3.client('bedrock-runtime')

# DynamoDB tables
documents_table = dynamodb.Table(os.environ['DOCUMENTS_TABLE'])
doc_processing_table = dynamodb.Table(os.environ['DOC_PROCESSING_TABLE'])

# Bedrock model configuration
DEFAULT_MODEL = "anthropic.claude-v2"

def update_document_status(document_id: str, status: str, metadata: Optional[Dict[str, Any]] = None) -> None:
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
        'step': 'SUMMARIZATION',
        'timestamp': datetime.utcnow().isoformat(),
        'service_type': 'summarizer_service'
    })

def get_document_chunks(document_id: str, chunks_count: Optional[int] = None) -> List[str]:
    """Retrieve document text chunks from DynamoDB"""
    logger.info(f"Getting document chunks for {document_id}")
    chunks = []
    
    # Query chunks for this document
    response = documents_table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('PK').eq(f'doc#{document_id}') &
                              boto3.dynamodb.conditions.Key('SK').begins_with('chunk#')
    )
    
    # Sort chunks by chunk number
    items = sorted(response.get('Items', []), key=lambda x: x.get('chunk_number', 0))
    
    for item in items:
        chunk_text = item.get('text', '')
        chunks.append(chunk_text)
    
    logger.info(f"Retrieved {len(chunks)} chunks")
    
    if chunks_count is not None and len(chunks) != chunks_count:
        logger.warning(f"Expected {chunks_count} chunks but retrieved {len(chunks)}")
    
    # For Lambda performance, limit number of chunks processed
    if len(chunks) > 3:
        logger.info(f"Processing first 3 chunks out of {len(chunks)} due to time constraints")
        return chunks[:3]
    
    return chunks

def summarize_with_bedrock(text: str, max_length: int = 1000, model: str = DEFAULT_MODEL) -> Dict[str, Any]:
    """Generate a summary using AWS Bedrock"""
    logger.info(f"Starting summarization, text length={len(text)}")
    start_time = time.time()
    
    try:
        # Simple prompt for faster processing
        prompt = f"""
        Summarize this document in a few sentences:
        
        {text}
        """
        
        # Call Bedrock API with model-specific parameters
        if "anthropic" in model:
            request_body = {
                "prompt": prompt,
                "max_tokens_to_sample": max_length,
                "temperature": 0.3,
                "top_p": 0.9,
                "top_k": 250
            }
        else:
            request_body = {
                "prompt": prompt,
                "max_tokens_to_sample": max_length,
                "temperature": 0.3,
                "top_p": 0.9
            }
        
        # Invoke model
        response = bedrock.invoke_model(
            modelId=model,
            body=json.dumps(request_body)
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        
        if "anthropic" in model:
            summary = response_body.get('completion', '')
        else:
            summary = response_body.get('generation', response_body.get('text', ''))
        
        summary = summary.strip()
        
        elapsed_time = time.time() - start_time
        logger.info(f"Summarization completed in {elapsed_time:.2f} seconds")
        
        return {
            'status': 'success',
            'summary': summary
        }
    except Exception as e:
        logger.error(f"Error in Bedrock summarization: {str(e)}")
        return {
            'status': 'failed',
            'error': str(e)
        }

def generate_summary(document_id: str, chunks: List[str]) -> Dict[str, Any]:
    """Generate summary for document by processing chunks"""
    logger.info(f"Generating summary for document {document_id}")
    summary_text = ""
    key_points = []
    
    if not chunks:
        logger.error(f"No chunks provided for document {document_id}")
        return {'summary': '', 'key_points': []}
    
    # Combine chunks for small documents, or first 2-3 chunks for larger ones
    combined_text = "\n\n".join(chunks)
    
    # Check length to ensure Lambda doesn't timeout
    if len(combined_text) > 30000:
        logger.info(f"Text too large ({len(combined_text)} chars), truncating to 30000")
        combined_text = combined_text[:30000]
    
    # Generate summary
    summary_result = summarize_with_bedrock(combined_text)
    if summary_result['status'] == 'success':
        summary_text = summary_result['summary']
        
        # Extract some key sentences as key points (simplified for Lambda)
        sentences = summary_text.split('.')
        key_points = [s.strip() + '.' for s in sentences if len(s.strip()) > 20][:3]
    else:
        logger.error(f"Summary generation failed: {summary_result.get('error')}")
    
    # Store summary in DynamoDB
    summary_data = {
        'PK': f'doc#{document_id}',
        'SK': 'summary',
        'summary': summary_text,
        'key_points': key_points,
        'generated_at': datetime.utcnow().isoformat()
    }
    
    documents_table.put_item(Item=summary_data)
    logger.info("Summary stored successfully")
    
    return {
        'summary': summary_text,
        'key_points': key_points
    }

def lambda_handler(event, context):
    """
    Summarizer Lambda handler
    
    Two invocation methods:
    1. SQS event (async processing) - Event contains Records with SQS message
    2. Direct API invocation - Event contains document_id and user_id directly
    
    For both methods:
    - Retrieves document chunks from DynamoDB
    - Generates summary 
    - Stores results in DynamoDB
    - Updates document status
    """
    start_time = datetime.now()
    logger.info(f"Summarizer service invoked")
    
    # Check if this is a direct API invocation
    if 'Records' not in event:
        logger.info("Direct API invocation detected")
        
        document_id = event.get('document_id')
        user_id = event.get('user_id')
        
        if not document_id or not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': "Missing document_id or user_id"})
            }
        
        try:
            # Update status
            update_document_status(document_id, 'SUMMARIZING')
            
            # Get document chunks
            chunks = get_document_chunks(document_id)
            
            if not chunks:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'error': "No document chunks found"})
                }
            
            # Generate summary
            summary_results = generate_summary(document_id, chunks)
            
            # Update document status
            update_document_status(document_id, 'COMPLETED', {
                'hasSummary': True,
                'summaryLength': len(summary_results['summary']),
                'keyPointsCount': len(summary_results['key_points'])
            })
            
            # Return summary in response
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'document_id': document_id,
                    'summary': summary_results['summary'],
                    'key_points': summary_results['key_points']
                })
            }
            
        except Exception as e:
            logger.error(f"Error summarizing document {document_id}: {str(e)}")
            update_document_status(document_id, 'SUMMARIZING_FAILED', {'error': str(e)})
            
            return {
                'statusCode': 500,
                'body': json.dumps({'error': str(e)})
            }
    
    # SQS queue invocation
    # Process only one record to ensure we stay within Lambda time limits
    if event['Records']:
        record = event['Records'][0]
        message = json.loads(record['body'])
        document_id = message['document_id']
        user_id = message['user_id']
        chunks_count = message.get('chunks_count')
        
        logger.info(f"Summarizing document {document_id}")
        
        try:
            # Update status
            update_document_status(document_id, 'SUMMARIZING')
            
            # Get document chunks
            chunks = get_document_chunks(document_id, chunks_count)
            
            if not chunks:
                logger.error(f"No chunks found for document {document_id}")
                update_document_status(document_id, 'SUMMARIZING_FAILED', {'error': 'No chunks found'})
                return {
                    'statusCode': 200,
                    'body': json.dumps('Processing complete with errors')
                }
            
            # Generate summary
            summary_results = generate_summary(document_id, chunks)
            
            # Update document status
            update_document_status(document_id, 'COMPLETED', {
                'hasSummary': True,
                'summaryLength': len(summary_results['summary']),
                'keyPointsCount': len(summary_results['key_points'])
            })
            
            # Check if there are more records that need processing
            if len(event['Records']) > 1:
                logger.info(f"Processed 1 record, {len(event['Records'])-1} records remain")
                # In a real implementation, would requeue remaining records
            
        except Exception as e:
            logger.error(f"Error summarizing document {document_id}: {str(e)}")
            update_document_status(document_id, 'SUMMARIZING_FAILED', {'error': str(e)})
    else:
        logger.warning("No records found in event")
    
    return {
        'statusCode': 200,
        'body': json.dumps('Summarization complete')
    }
