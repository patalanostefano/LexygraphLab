"""
Orchestration Agent Service - FastAPI Implementation
AI Legal Assistant that coordinates multiple agents using Gemini for document-based legal analysis
Supports complex multi-agent workflows for legal document processing
"""

from typing import List, Optional, Dict, Any, Union
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import httpx
import os
import json
import re
from contextlib import asynccontextmanager
import asyncio
import logging
from google import genai
from google.genai import types
from urllib.parse import quote

httpx_client = None


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Gemini API configuration
GEMINI_API_KEYS = [
    "AIzaSyBEsyakskQ7iZnDfnlDGQYwSB0QQJ5fMhA",
    "AIzaSyAEEjrZnXFKR-uonJWnt46iPYdNLQzSqVI"
]

# Global variables
gemini_client = None
current_gemini_key_index = 0
service_ready = False

# Service URLs
DOCUMENT_SERVICE_URL = os.getenv("DOCUMENT_SERVICE_URL", "http://document-service:8000")
WRAPPER_URL = os.getenv("WRAPPER_URL", "http://orchestration-wrapper:8010")

def configure_gemini():
    """Configure Gemini with current API key"""
    global gemini_client, current_gemini_key_index
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEYS[current_gemini_key_index])
        logger.info(f"Configured Gemini with key index {current_gemini_key_index}")
    except Exception as e:
        logger.error(f"Failed to configure Gemini: {e}")
        raise

def try_next_gemini_key():
    """Switch to next Gemini API key"""
    global current_gemini_key_index
    current_gemini_key_index = (current_gemini_key_index + 1) % len(GEMINI_API_KEYS)
    configure_gemini()
    logger.info(f"Switched to Gemini key index {current_gemini_key_index}")

def initialize_service():
    """Initialize the orchestration service"""
    global service_ready, httpx_client
    
    try:
        logger.info("Initializing Orchestration Agent Service...")
        
        # Configure Gemini
        configure_gemini()
        
        # Initialize httpx client
        httpx_client = httpx.AsyncClient(timeout=120.0)
        
        service_ready = True
        logger.info("Orchestration Agent Service initialized successfully!")
        
    except Exception as e:
        logger.error(f"Failed to initialize service: {str(e)}")
        service_ready = False
        raise

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize service
    logger.info("Starting Orchestration Agent Service...")
    await asyncio.get_event_loop().run_in_executor(None, initialize_service)
    yield
    # Shutdown: cleanup if needed
    logger.info("Shutting down Orchestration Agent Service...")
    if httpx_client:
        await httpx_client.aclose()

app = FastAPI(
    title="Orchestration Agent Service",
    lifespan=lifespan
)

# Pydantic models
class OrchestrationRequest(BaseModel):
    document_ids: List[str]  # Format: userId_projectId_docId
    prompt: str  # The user's legal query
    agent_id: str = "orchestration-agent"
    execution_id: Optional[str] = None

class AgentAction(BaseModel):
    action_type: str  # "search", "extract", "generate"
    query: str
    document_titles: Optional[List[str]] = None
    full_doc: Optional[bool] = False

class OrchestrationResponse(BaseModel):
    success: bool
    agent_id: str
    execution_id: Optional[str]
    prompt: str
    document_ids: List[str]
    actions_taken: List[Dict[str, Any]]
    final_response: str
    message: str

# System prompt for the orchestration agent
SYSTEM_PROMPT = """You are a Legal Assistant AI specialized in coordinating multiple agents for legal document analysis. Your role is to:

1. ANALYZE the user's legal query and available documents
2. PLAN a sequence of actions using available agents
3. COORDINATE agent execution in the optimal order
4. SYNTHESIZE results into a comprehensive legal response

AVAILABLE AGENTS:
- SEARCH AGENT: Use for finding relevant information, case law, regulations, or legal precedents
  Format: {"action_type": "search", "query": "specific search terms"}

- EXTRACTION AGENT: Use for extracting specific data, entities, dates, parties, or structured information from documents
  Format: {"action_type": "extract", "query": "what to extract", "document_titles": ["doc1", "doc2"]}

- GENERATION AGENT: Use for creating summaries, analyses, or regenerating documents with modifications
  Format: {"action_type": "generate", "query": "generation task", "document_titles": ["doc1"], "full_doc": true/false}

WORKFLOW STRATEGY:
1. ALWAYS start with SEARCH if you need external legal context
2. Use EXTRACTION for specific data needs from documents
3. Use GENERATION for synthesis, analysis, or document creation
4. Chain actions logically (search→extract→generate)

RESPONSE FORMAT:
Always respond with a JSON list of actions to take:
[
  {"action_type": "search", "query": "contract law termination clauses"},
  {"action_type": "extract", "query": "extract all termination clauses and dates", "document_titles": ["Contract A", "Contract B"]},
  {"action_type": "generate", "query": "analyze termination risks and provide recommendations", "document_titles": ["Contract A"], "full_doc": false}
]

If no actions are needed, respond with your direct analysis instead of JSON.
IMPORTANT: After executing actions, always provide a final comprehensive answer that directly addresses the user's question. Do not expose the internal action details to the user - focus on delivering a clear, complete response based on all gathered information.
"""

def extract_json_actions(response_text: str) -> Optional[List[Dict[str, Any]]]:
    """Extract JSON actions from Gemini response"""
    try:
        # Try to find JSON array in the response
        json_pattern = r'\[[\s\S]*?\]'
        matches = re.findall(json_pattern, response_text)
        
        for match in matches:
            try:
                actions = json.loads(match)
                if isinstance(actions, list) and len(actions) > 0:
                    # Validate action structure
                    valid_actions = []
                    for action in actions:
                        if isinstance(action, dict) and "action_type" in action:
                            valid_actions.append(action)
                    
                    if valid_actions:
                        return valid_actions
            except json.JSONDecodeError:
                continue
                
        return None
    except Exception as e:
        logger.error(f"Error extracting JSON actions: {e}")
        return None

async def fetch_document_content(document_id: str) -> Dict[str, Any]:
    """Fetch document content and metadata"""
    global httpx_client
    try:
        parts = document_id.split('_')
        if len(parts) < 3:
            raise ValueError(f"Invalid document_id format: {document_id}")
        
        user_id = parts[0]
        doc_id = parts[-1]
        project_id = '_'.join(parts[1:-1])
        
        encoded_project_id = quote(project_id, safe='')
        url = f"{DOCUMENT_SERVICE_URL}/api/v1/documents/{user_id}/{encoded_project_id}/{doc_id}/text"
        
        # CHANGE FROM requests to httpx:
        response = await httpx_client.get(url)
        response.raise_for_status()
        
        doc_data = response.json()
        
        # Extract title and first few lines for context
        chunks = doc_data.get("chunks", [])
        if chunks:
            first_chunk = chunks[0].get("text", "")
            title = first_chunk.split('\n')[0][:100] if first_chunk else f"Document {doc_id}"
            first_lines = '\n'.join(first_chunk.split('\n')[:3])[:200]
        else:
            title = f"Document {doc_id}"
            first_lines = "No content available"
        
        return {
            "document_id": document_id,
            "title": title,
            "first_lines": first_lines,
            "full_data": doc_data
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch document {document_id}: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to fetch document: {e}")
    
def title_to_document_id(title: str, available_docs: List[Dict]) -> Optional[str]:
    """Convert document title back to document ID"""
    for doc in available_docs:
        if title.lower() in doc["title"].lower() or doc["title"].lower() in title.lower():
            return doc["document_id"]
    return None

async def execute_search_action(query: str) -> str:
    """Execute search agent action"""
    global httpx_client
    try:
        url = f"{WRAPPER_URL}/api/v1/agents/search"
        payload = {
            "query": query,
            "agent_id": "search-agent"
        }
        
        # CHANGE FROM requests to httpx:
        response = await httpx_client.post(url, json=payload)
        response.raise_for_status()
        
        result = response.json()
        return result.get("results", "No search results found")
        
    except Exception as e:
        logger.error(f"Search action failed: {e}")
        return f"Search failed: {str(e)}"


async def execute_extraction_action(query: str, document_titles: List[str], available_docs: List[Dict]) -> str:
    """Execute extraction agent action"""
    global httpx_client
    try:
        # Convert titles to document IDs
        document_ids = []
        for title in document_titles:
            doc_id = title_to_document_id(title, available_docs)
            if doc_id:
                document_ids.append(doc_id)
        
        if not document_ids:
            return "No valid documents found for extraction"
        
        url = f"{WRAPPER_URL}/api/v1/agents/process"
        payload = {
            "agentId": "extraction-agent",
            "prompt": query,
            "documentIds": document_ids
        }
        
        # CHANGE FROM requests to httpx:
        response = await httpx_client.post(url, json=payload)
        response.raise_for_status()
        
        result = response.json()
        return result.get("response", "No extraction results")
        
    except Exception as e:
        logger.error(f"Extraction action failed: {e}")
        return f"Extraction failed: {str(e)}"

async def execute_generation_action(query: str, document_titles: List[str], full_doc: bool, available_docs: List[Dict]) -> str:
    """Execute generation agent action"""
    global httpx_client
    try:
        # Convert titles to document IDs
        document_ids = []
        for title in document_titles:
            doc_id = title_to_document_id(title, available_docs)
            if doc_id:
                document_ids.append(doc_id)
        
        if not document_ids:
            return "No valid documents found for generation"
        
        url = f"{WRAPPER_URL}/api/v1/agents/process"
        payload = {
            "agentId": "generation-agent",
            "prompt": query,
            "documentIds": document_ids,
            "fullDoc": full_doc
        }
        
        # CHANGE FROM requests to httpx:
        response = await httpx_client.post(url, json=payload)
        response.raise_for_status()
        
        result = response.json()
        return result.get("response", "No generation results")
        
    except Exception as e:
        logger.error(f"Generation action failed: {e}")
        return f"Generation failed: {str(e)}"

async def plan_and_execute(prompt: str, documents: List[Dict], max_turns: int = 3) -> tuple[List[Dict[str, Any]], str]:
    """Plan and execute agent actions using Gemini"""
    global gemini_client
    
    if not gemini_client:
        raise HTTPException(status_code=503, detail="Gemini not available")
    
    # Prepare document context
    doc_context = "\n".join([
        f"- {doc['title']}: {doc['first_lines']}" 
        for doc in documents
    ])
    
    user_prompt = f"""LEGAL QUERY: {prompt}

AVAILABLE DOCUMENTS:
{doc_context}

Plan the optimal sequence of agent actions to address this legal query. Consider:
1. Do I need external legal research first?
2. What specific information should I extract from documents?
3. What analysis or generation is needed?

Respond with JSON actions or direct analysis if no agent actions are needed."""
    
    actions_taken = []
    current_context = user_prompt
    
    for turn in range(max_turns):
        logger.info(f"Planning turn {turn + 1}")
        
        try:
            # Create the full prompt with system instruction
            full_prompt = f"{SYSTEM_PROMPT}\n\n{current_context}"
            
            response = gemini_client.models.generate_content(
                model="gemini-1.5-flash",
                contents=full_prompt
            )
            response_text = response.text
            
            logger.info(f"Gemini response: {response_text[:200]}...")
            
            # Try to extract JSON actions
            actions = extract_json_actions(response_text)
            
            if not actions:
                # If no JSON actions found, treat response as final answer
                final_answer = response_text.strip()
                return actions_taken, final_answer
            
            # Execute actions
            action_results = []
            for action in actions:
                action_type = action.get("action_type")
                query = action.get("query", "")
                
                logger.info(f"Executing {action_type} action: {query}")
                
                if action_type == "search":
                    result = await execute_search_action(query)
                    action_results.append(f"Search Results: {result}")
                    
                elif action_type == "extract":
                    document_titles = action.get("document_titles", [])
                    result = await execute_extraction_action(query, document_titles, documents)
                    action_results.append(f"Extraction Results: {result}")
                    
                elif action_type == "generate":
                    document_titles = action.get("document_titles", [])
                    full_doc = action.get("full_doc", False)
                    result = await execute_generation_action(query, document_titles, full_doc, documents)
                    action_results.append(f"Generation Results: {result}")
                
                actions_taken.append({
                    "turn": turn + 1,
                    "action": action,
                    "result": result
                })
            
            # Update context for next turn
            current_context = f"PREVIOUS ACTIONS AND RESULTS:\n" + "\n\n".join(action_results) + f"\n\nORIGINAL QUERY: {prompt}\n\nWhat should be done next or provide final analysis?"
            
        except Exception as e:
            logger.error(f"Error in planning turn {turn + 1}: {e}")
            if turn < len(GEMINI_API_KEYS) - 1:
                try_next_gemini_key()
            else:
                raise HTTPException(status_code=503, detail="All planning attempts failed")
    
    # Synthesize final response using all collected results
    context_summary = "\n\n".join([
        f"Action: {action['action']['action_type']} - {action['action']['query']}\nResult: {action['result'][:500]}..."
        for action in actions_taken
    ])

    final_synthesis_prompt = f"""Based on the following actions and results, provide a comprehensive final answer to the user's question: "{prompt}"

    ACTIONS AND RESULTS:
    {context_summary}

    Provide a clear, concise, and complete answer that synthesizes all the information gathered. Focus on directly answering the user's question without mentioning the internal process."""

    try:
        response = gemini_client.models.generate_content(
            model="gemini-1.5-flash",
            contents=final_synthesis_prompt
        )
        final_response = response.text.strip()
        return actions_taken, final_response
    except Exception as e:
        logger.error(f"Final synthesis failed: {e}")
        # If synthesis fails, provide a basic summary
        if actions_taken:
            basic_summary = f"Analysis completed using {len(actions_taken)} actions. "
            latest_result = actions_taken[-1].get('result', '')[:200]
            return actions_taken, basic_summary + latest_result
        return actions_taken, "Analysis completed but synthesis failed."


# Health check endpoint
@app.get("/")
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "orchestration-agent",
        "gemini_configured": gemini_client is not None,
        "service_ready": service_ready
    }

# Main orchestration endpoint
@app.post("/api/v1/agents/orchestrate", response_model=OrchestrationResponse)
async def orchestrate_agents(request: OrchestrationRequest):
    """Orchestrate multiple agents for complex legal document analysis"""
    
    if not service_ready:
        raise HTTPException(status_code=503, detail="Orchestration service not ready")
    
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required")
    
    if not request.document_ids:
        raise HTTPException(status_code=400, detail="At least one document ID is required")
    
    try:
        logger.info(f"Starting orchestration for prompt: {request.prompt[:100]}...")
        
        # Fetch all documents
        documents = []
        for doc_id in request.document_ids:
            try:
                doc_info = await fetch_document_content(doc_id)
                documents.append(doc_info)
            except Exception as e:
                logger.warning(f"Failed to fetch document {doc_id}: {e}")
                continue
        
        if not documents:
            raise HTTPException(status_code=404, detail="No documents could be retrieved")
        
        # Plan and execute agent coordination
        actions_taken, final_response = await plan_and_execute(request.prompt, documents)
        
        return OrchestrationResponse(
            success=True,
            agent_id=request.agent_id,
            execution_id=request.execution_id,
            prompt=request.prompt,
            document_ids=request.document_ids,
            actions_taken=actions_taken,
            final_response=final_response,
            message=f"Successfully orchestrated {len(actions_taken)} actions across {len(documents)} documents"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Orchestration failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Orchestration failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8005)