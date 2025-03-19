import os
import json
import boto3
import logging
from datetime import datetime
import re
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
collections_table = dynamodb.Table(os.environ['COLLECTIONS_TABLE'])

# Bedrock model configuration
DEFAULT_MODEL = "anthropic.claude-v2"
    
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
    logger.debug(f"DynamoDB expression attribute names: {expr_attr_names}")
    logger.debug(f"DynamoDB expression attribute values: {expr_attr_values}")
    
    documents_table.update_item(
        Key={'PK': f'doc#{document_id}', 'SK': 'metadata'},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_attr_names,
        ExpressionAttributeValues=expr_attr_values
    )
    
    # Record processing step
    logger.debug(f"Recording processing step: document_id={document_id}, status={status}")
    doc_processing_table.put_item(Item={
        'PK': f'doc#{document_id}',
        'SK': f'process#{datetime.utcnow().isoformat()}',
        'status': status,
        'step': 'SUMMARIZATION',
        'timestamp': datetime.utcnow().isoformat(),
        'service_type': 'summarizer_service'
    })
    
    logger.debug(f"Document status update completed for document_id={document_id}")

def get_document_chunks(document_id: str, chunks_count: int) -> List[str]:
    """
    Retrieve document text chunks from DynamoDB
    """
    logger.debug(f"Getting document chunks: document_id={document_id}, expected chunks={chunks_count}")
    chunks = []
    
    # Query all chunks for this document
    logger.debug(f"Querying DynamoDB for chunks with PK=doc#{document_id}")
    response = documents_table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('PK').eq(f'doc#{document_id}') &
                              boto3.dynamodb.conditions.Key('SK').begins_with('chunk#')
    )
    
    logger.debug(f"Query returned {len(response.get('Items', []))} items")
    
    # Sort chunks by chunk number
    items = sorted(response.get('Items', []), key=lambda x: x.get('chunk_number', 0))
    
    for item in items:
        chunk_text = item.get('text', '')
        chunk_number = item.get('chunk_number', 'unknown')
        logger.debug(f"Processing chunk #{chunk_number} with length {len(chunk_text)}")
        chunks.append(chunk_text)
        
    logger.info(f"Retrieved {len(chunks)} chunks for document {document_id}")
    
    if len(chunks) != chunks_count:
        logger.warning(f"Expected {chunks_count} chunks but retrieved {len(chunks)} for document {document_id}")
    
    return chunks

def summarize_with_bedrock(text: str, max_length: int = 1500, model: str = DEFAULT_MODEL) -> Dict[str, Any]:
    """
    Generate a summary using AWS Bedrock
    """
    logger.debug(f"Starting summarization with text length={len(text)}, max_length={max_length}, model={model}")
    try:
        start_time = time.time()
        logger.info(f"Starting summarization with Bedrock model: {model}")
        
        # Create prompt for the model
        prompt = f"""
        Given a full document, give me a concise summary. Skip any preamble text and just give the summary.
        
        <document>
        {text}
        </document>
        
        <summary>
        """
        
        logger.debug(f"Prompt length: {len(prompt)} characters")
        
        # Call Bedrock API
        request_body = {
            "prompt": prompt,
            "max_tokens_to_sample": max_length,
            "temperature": 0.3,
            "top_p": 0.9,
        }
        
        # Add model-specific parameters
        if "anthropic" in model:
            logger.debug("Using Anthropic-specific request format")
            request_body = {
                "prompt": prompt,
                "max_tokens_to_sample": max_length,
                "temperature": 0.3,
                "top_p": 0.9,
                "top_k": 250,
                "stop_sequences": ["</summary>"]
            }
        
        # Make API request
        logger.debug(f"Calling Bedrock invoke_model API with modelId={model}")
        response = bedrock.invoke_model(
            modelId=model,
            body=json.dumps(request_body)
        )
        
        logger.debug("Bedrock API call completed, parsing response")
        # Parse response
        response_body = json.loads(response['body'].read())
        
        if "anthropic" in model:
            summary = response_body.get('completion', '')
            logger.debug(f"Extracted completion with length {len(summary)}")
        else:
            # Handle other model response formats
            summary = response_body.get('generation', response_body.get('text', ''))
            logger.debug(f"Extracted generation/text with length {len(summary)}")
        
        # Clean up the summary
        summary = summary.strip()
        
        # Remove any trailing "</summary>" tag if present
        summary = summary.replace("</summary>", "").strip()
        
        elapsed_time = time.time() - start_time
        logger.info(f"Summarization completed in {elapsed_time:.2f} seconds, summary length={len(summary)}")
        
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

def extract_key_points(text: str, model: str = DEFAULT_MODEL) -> List[str]:
    """
    Extract key points from the text using Bedrock
    """
    logger.debug(f"Extracting key points from text with length={len(text)}, model={model}")
    try:
        # Create prompt for the model
        prompt = f"""
        Extract 3-5 key points from the following text as a JSON array of strings.
        
        <document>
        {text}
        </document>
        
        Format your response as a valid JSON array: ["point 1", "point 2", "point 3"]
        """
        
        logger.debug(f"Key points prompt length: {len(prompt)} characters")
        
        # Call Bedrock API
        request_body = {
            "prompt": prompt,
            "max_tokens_to_sample": 1000,
            "temperature": 0.3,
            "top_p": 0.9,
        }
        
        # Add model-specific parameters
        if "anthropic" in model:
            logger.debug("Using Anthropic-specific request format for key points")
            request_body = {
                "prompt": prompt,
                "max_tokens_to_sample": 1000,
                "temperature": 0.3,
                "top_p": 0.9,
                "top_k": 250
            }
        
        logger.debug(f"Calling Bedrock invoke_model API for key points extraction")
        response = bedrock.invoke_model(
            modelId=model,
            body=json.dumps(request_body)
        )
        
        logger.debug("Bedrock API call for key points completed, parsing response")
        # Parse response
        response_body = json.loads(response['body'].read())
        
        if "anthropic" in model:
            result = response_body.get('completion', '')
            logger.debug(f"Extracted completion with length {len(result)}")
        else:
            # Handle other model response formats
            result = response_body.get('generation', response_body.get('text', ''))
            logger.debug(f"Extracted generation/text with length {len(result)}")
        
        # Extract JSON array from response
        logger.debug("Attempting to extract JSON from response")
        json_match = re.search(r'$$(.*)$$', result, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            try:
                logger.debug(f"Parsing JSON string: {json_str}")
                key_points = json.loads(json_str)
                if isinstance(key_points, list):
                    logger.debug(f"Successfully parsed JSON array with {len(key_points)} key points")
                    return key_points
                else:
                    logger.warning("Parsed JSON is not a list, falling back to manual extraction")
            except json.JSONDecodeError as e:
                logger.warning(f"JSON parse error: {str(e)}, falling back to manual extraction")
                # If JSON parsing fails, try to extract points manually
                pass
        else:
            logger.debug("No JSON format detected in response, using manual extraction")
        
        # Fallback: Extract points manually
        logger.debug("Extracting key points manually from text")
        points = []
        for line in result.split('\n'):
            # Remove list markers and numbers
            clean_line = re.sub(r'^\s*[\d*\-]+[\.\)\]]*\s*', '', line).strip()
            if clean_line and len(clean_line) > 10:  # Minimum length for a key point
                logger.debug(f"Found key point: {clean_line[:30]}...")
                points.append(clean_line)
        
        logger.info(f"Extracted {len(points)} key points manually")
        return points[:5]  # Return at most 5 points
            
    except Exception as e:
        logger.error(f"Error extracting key points: {str(e)}")
        return []

def generate_summary(document_id: str, chunks: List[str]) -> Dict[str, Any]:
    """
    Generate summary for the document
    """
    logger.debug(f"Generating summary for document_id={document_id}, chunks={len(chunks)}")
    summary_text = ""
    key_points = []
    
    if len(chunks) <= 2:
        # For smaller documents, summarize the whole text
        logger.debug(f"Small document detected ({len(chunks)} chunks), summarizing whole text")
        full_text = "\n\n".join(chunks)
        logger.debug(f"Combined text length: {len(full_text)} characters")
        
        # Generate summary
        logger.debug("Calling summarize_with_bedrock for full text")
        summary_result = summarize_with_bedrock(full_text)
        if summary_result['status'] == 'success':
            summary_text = summary_result['summary']
            logger.debug(f"Summary generated successfully, length={len(summary_text)}")
            
            # Extract key points
            logger.debug("Extracting key points from full text")
            key_points = extract_key_points(full_text)
            logger.debug(f"Extracted {len(key_points)} key points")
        else:
            logger.error(f"Summary generation failed: {summary_result.get('error', 'unknown error')}")
    else:
        # For larger documents, summarize each chunk, then create a summary of summaries
        logger.debug(f"Large document detected ({len(chunks)} chunks), summarizing individual chunks first")
        chunk_summaries = []
        
        for i, chunk in enumerate(chunks):
            logger.debug(f"Summarizing chunk {i+1}/{len(chunks)}, chunk length={len(chunk)}")
            summary_result = summarize_with_bedrock(chunk, max_length=500)
            if summary_result['status'] == 'success':
                chunk_summary = summary_result['summary']
                logger.debug(f"Chunk {i+1} summary length: {len(chunk_summary)}")
                chunk_summaries.append(chunk_summary)
            else:
                logger.warning(f"Failed to summarize chunk {i+1}: {summary_result.get('error', 'unknown error')}")
        
        # Create a summary of summaries
        logger.debug(f"Creating summary of {len(chunk_summaries)} chunk summaries")
        combined_summaries = "\n\n".join(chunk_summaries)
        logger.debug(f"Combined summaries length: {len(combined_summaries)} characters")
        
        final_summary_result = summarize_with_bedrock(combined_summaries)
        if final_summary_result['status'] == 'success':
            summary_text = final_summary_result['summary']
            logger.debug(f"Final summary generated successfully, length={len(summary_text)}")
            
            # Extract key points from the combined summaries
            logger.debug("Extracting key points from combined summaries")
            key_points = extract_key_points(combined_summaries)
            logger.debug(f"Extracted {len(key_points)} key points")
        else:
            logger.error(f"Final summary generation failed: {final_summary_result.get('error', 'unknown error')}")
    
    # Store summary in DynamoDB
    logger.debug(f"Storing summary in DynamoDB for document_id={document_id}")
    summary_data = {
        'PK': f'doc#{document_id}',
        'SK': 'summary',
        'summary': summary_text,
        'key_points': key_points,
        'generated_at': datetime.utcnow().isoformat()
    }
    
    documents_table.put_item(Item=summary_data)
    logger.debug("Summary stored in DynamoDB successfully")
    
    # Check if we should also create a graph representation for this document
    graph_enabled = is_graph_enabled()
    logger.debug(f"Graph representation enabled: {graph_enabled}")
    if graph_enabled:
        logger.debug(f"Creating graph representation for document_id={document_id}")
        create_graph_representation(document_id, summary_text, key_points)
    
    return {
        'summary': summary_text,
        'key_points': key_points
    }

def is_graph_enabled() -> bool:
    """
    Check if the graph database features are enabled
    """
    # This could check environment variables or a feature flag
    value = os.environ.get('USE_GRAPH_DB', 'false').lower() == 'true'
    logger.debug(f"Graph database feature enabled: {value}")
    return value

def create_graph_representation(document_id: str, summary: str, key_points: List[str]) -> None:
    """
    Create a graph representation of the document in Neptune
    
    This is a placeholder function - would be implemented with Neptune or other graph DB
    """
    try:
        logger.info(f"Graph representation would be created for document {document_id}")
        logger.debug(f"Summary length: {len(summary)}, key points: {len(key_points)}")
        # In a real implementation, this would create nodes and edges in Neptune
        
        # 1. Create a document node
        # 2. Create nodes for each key point
        # 3. Create edges between document and key points
        
        # Example Neptune code (commented out since we're not actually using it):
        """
        neptune = boto3.client('neptune-graph')
        
        # Create document node
        neptune.execute_query(
            query=f'''
            CREATE (d:Document {{id: '{document_id}', summary: '{summary.replace("'", "\\'")}'}})
            ''',
            language='openCypher'
        )
        
        # Create key point nodes and relationships
        for i, point in enumerate(key_points):
            neptune.execute_query(
                query=f'''
                MATCH (d:Document {{id: '{document_id}'}})
                CREATE (k:KeyPoint {{id: '{document_id}_kp_{i}', text: '{point.replace("'", "\\'")}'}})
                CREATE (d)-[:HAS_KEY_POINT]->(k)
                ''',
                language='openCypher'
            )
        """
        logger.debug("Graph representation creation would be completed here (placeholder)")
        
    except Exception as e:
        logger.error(f"Error creating graph representation: {str(e)}")
        # This is non-critical, so we log the error but don't fail the function

def lambda_handler(event, context):
    """
    Main Lambda handler
    """
    logger.debug(f"Lambda handler invoked with {len(event['Records'])} records")
    
    for i, record in enumerate(event['Records']):
        logger.debug(f"Processing record {i+1}/{len(event['Records'])}")
        # Parse message from SQS
        message = json.loads(record['body'])
        document_id = message['document_id']
        user_id = message['user_id']
        chunks_count = message['chunks_count']
        
        logger.info(f"Summarizing document {document_id} for user {user_id}")
        logger.debug(f"Message details: document_id={document_id}, user_id={user_id}, chunks_count={chunks_count}")
        
        try:
            # Update status to summarizing
            logger.debug(f"Updating document status to SUMMARIZING")
            update_document_status(document_id, 'SUMMARIZING')
            
            # Get document chunks
            logger.debug(f"Retrieving document chunks")
            chunks = get_document_chunks(document_id, chunks_count)
            
            if not chunks:
                logger.error(f"No chunks found for document {document_id}")
                raise Exception("Failed to retrieve document chunks")
            
            # Generate summary
            logger.debug(f"Starting summary generation for document {document_id}")
            summary_results = generate_summary(document_id, chunks)
            
            # Update document status
            logger.debug(f"Updating document status to COMPLETED")
            update_document_status(document_id, 'COMPLETED', {
                'hasSummary': True,
                'summaryLength': len(summary_results['summary']),
                'keyPointsCount': len(summary_results['key_points'])
            })
            
            logger.info(f"Successfully summarized document {document_id} with {len(summary_results['key_points'])} key points")
            
        except Exception as e:
            logger.error(f"Error summarizing document {document_id}: {str(e)}")
            logger.debug(f"Updating document status to SUMMARIZING_FAILED")
            update_document_status(document_id, 'SUMMARIZING_FAILED', {'error': str(e)})
            raise
    
    logger.debug("All records processed successfully")
    return {
        'statusCode': 200,
        'body': json.dumps('Summarization complete')
    }