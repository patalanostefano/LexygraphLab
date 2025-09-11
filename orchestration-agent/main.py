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

# System prompts in Italian cutting for now:
# - GENERATION AGENT: Usa per creare riassunti, analisi o rigenerare documenti con modifiche
#  {"action_type": "extract", "query": "cosa estrarre", "document_titles": ["doc1", "doc2"]},
#3. Per domande generiche sui documenti, usa "extract" per ottenere informazioni rilevanti



PLANNING_SYSTEM_PROMPT = """Sei un assistente legale specializzato nel coordinare diversi agenti per l'analisi di documenti legali. Il tuo ruolo è pianificare la sequenza ottimale di azioni.

AGENTI DISPONIBILI:
- SEARCH AGENT: Usa per trovare informazioni rilevanti, giurisprudenza, normative o precedenti legali
- EXTRACTION AGENT: Usa per estrarre dati specifici, entità, date, parti o informazioni strutturate dai documenti (consigliato! usalo anche per domande semplici)

REGOLE IMPORTANTI:
1. DEVI SEMPRE rispondere SOLO con un array JSON di azioni
2. Anche per domande semplici, usa generatore almeno una volta
3. Per analisi legali, inizia sempre con "search" per il contesto normativo


FORMATO RISPOSTA - SOLO JSON:
[
  {"action_type": "search", "query": "termini di ricerca specifici"},
  {"action_type": "generate", "query": "compito di generazione", "document_titles": ["doc1"], "full_doc": true/false}
]

Non aggiungere testo extra, ritorna solo l'array JSON."""

REASONING_SYSTEM_PROMPT = """Sei un assistente legale esperto che deve fornire risposte complete e accurate basandoti sui risultati degli agenti specializzati.

ISTRUZIONI:
1. Analizza attentamente i risultati forniti dagli agenti
2. Se i risultati sono sufficienti per rispondere, fornisci una risposta completa e dettagliata
3. Se servono ulteriori informazioni, puoi richiedere nuove azioni specificando esattamente cosa serve
4. Cita sempre le fonti normative e i documenti utilizzati
5. Spiega chiaramente il ragionamento legale
6. Menziona quali agenti sono stati utilizzati per ottenere le informazioni

FORMATO RISPOSTA:
- Se hai informazioni sufficienti: Fornisci risposta completa con citazioni e spiegazioni
- Se servono più informazioni: Specifica esattamente cosa cercare ulteriormente

Mantieni sempre un tono professionale e preciso."""

def extract_json_actions(response_text: str) -> Optional[List[Dict[str, Any]]]:
    """Extract JSON actions from Gemini response with improved parsing"""
    try:
        logger.info(f"Attempting to parse JSON from response: {response_text[:500]}...")
        
        # Remove markdown code blocks if present
        cleaned_text = response_text.strip()
        
        # Handle markdown code blocks
        if "```json" in cleaned_text:
            start_marker = "```json"
            end_marker = "```"
            start_idx = cleaned_text.find(start_marker)
            if start_idx != -1:
                start_idx += len(start_marker)
                end_idx = cleaned_text.find(end_marker, start_idx)
                if end_idx != -1:
                    cleaned_text = cleaned_text[start_idx:end_idx].strip()
        
        # Also handle code blocks without 'json' language specifier
        elif "```" in cleaned_text:
            lines = cleaned_text.split('\n')
            in_code_block = False
            code_lines = []
            
            for line in lines:
                if line.strip() == "```" or line.strip().startswith("```"):
                    if in_code_block:
                        break  # End of code block
                    else:
                        in_code_block = True  # Start of code block
                elif in_code_block:
                    code_lines.append(line)
            
            if code_lines:
                cleaned_text = '\n'.join(code_lines).strip()
        
        # Remove any remaining backticks and extra whitespace
        cleaned_text = cleaned_text.replace('`', '').strip()
        
        # Try to find the JSON array directly
        start_bracket = cleaned_text.find('[')
        if start_bracket != -1:
            # Find matching closing bracket
            bracket_count = 0
            end_bracket = -1
            
            for i in range(start_bracket, len(cleaned_text)):
                if cleaned_text[i] == '[':
                    bracket_count += 1
                elif cleaned_text[i] == ']':
                    bracket_count -= 1
                    if bracket_count == 0:
                        end_bracket = i
                        break
            
            if end_bracket != -1:
                json_str = cleaned_text[start_bracket:end_bracket + 1]
                logger.info(f"Extracted JSON string: {json_str}")
                
                try:
                    actions = json.loads(json_str)
                    if isinstance(actions, list) and len(actions) > 0:
                        # Validate action structure
                        valid_actions = []
                        for action in actions:
                            if isinstance(action, dict) and "action_type" in action and "query" in action:
                                # Ensure document_titles is a list if present
                                if "document_titles" in action and not isinstance(action["document_titles"], list):
                                    action["document_titles"] = [str(action["document_titles"])]
                                valid_actions.append(action)
                        
                        if valid_actions:
                            logger.info(f"Successfully parsed {len(valid_actions)} valid actions")
                            return valid_actions
                        else:
                            logger.warning("No valid actions found in parsed JSON")
                    else:
                        logger.warning("Parsed JSON is not a non-empty list")
                except json.JSONDecodeError as e:
                    logger.warning(f"JSON parsing failed: {e}")
        
        # Fallback: try regex pattern matching
        json_pattern = r'\[[\s\S]*?\]'
        matches = re.findall(json_pattern, cleaned_text)
        
        for match in matches:
            try:
                actions = json.loads(match)
                if isinstance(actions, list) and len(actions) > 0:
                    valid_actions = []
                    for action in actions:
                        if isinstance(action, dict) and "action_type" in action:
                            valid_actions.append(action)
                    
                    if valid_actions:
                        logger.info(f"Regex fallback successful: {len(valid_actions)} actions")
                        return valid_actions
            except json.JSONDecodeError:
                continue
        
        logger.warning("No valid JSON actions found in response")
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
        
        response = await httpx_client.post(url, json=payload)
        response.raise_for_status()
        
        result = response.json()
        return result.get("response", "No generation results")
        
    except Exception as e:
        logger.error(f"Generation action failed: {e}")
        return f"Generation failed: {str(e)}"

async def plan_actions(prompt: str, documents: List[Dict]) -> List[Dict[str, Any]]:
    """Step 1: Plan actions using dedicated planning prompt"""
    global gemini_client
    
    if not gemini_client:
        raise HTTPException(status_code=503, detail="Gemini not available")
    
    # Prepare document context
    doc_context = "\n".join([
        f"- {doc['title']}: {doc['first_lines']}" 
        for doc in documents
    ])
    
    planning_prompt = f"""QUERY UTENTE: {prompt}

DOCUMENTI DISPONIBILI:
{doc_context}

Pianifica la sequenza ottimale di azioni per rispondere a questa domanda legale."""
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            full_prompt = f"{PLANNING_SYSTEM_PROMPT}\n\n{planning_prompt}"
            
            response = gemini_client.models.generate_content(
                model="gemini-1.5-flash",
                contents=full_prompt
            )
            response_text = response.text.strip()
            
            logger.info(f"Planning response attempt {attempt + 1}: {response_text[:200]}...")
            
            # Extract JSON actions
            actions = extract_json_actions(response_text)
            
            if actions:
                logger.info(f"Successfully planned {len(actions)} actions")
                return actions
            else:
                logger.warning(f"No valid JSON actions in attempt {attempt + 1}")
                if attempt < max_retries - 1:
                    continue
                else:
                    # Fallback: create a default extraction action
                    logger.info("Creating fallback action")
                    return [{
                        "action_type": "extract",
                        "query": f"Analizza i documenti per rispondere a: {prompt}",
                        "document_titles": [doc['title'] for doc in documents[:2]]  # Limit to first 2 docs
                    }]
            
        except Exception as e:
            logger.error(f"Planning attempt {attempt + 1} failed: {e}")
            if attempt < len(GEMINI_API_KEYS) - 1:
                try_next_gemini_key()
            else:
                raise HTTPException(status_code=503, detail="Action planning failed")
    
    # Should not reach here
    return []

async def execute_planned_actions(actions: List[Dict[str, Any]], documents: List[Dict]) -> List[Dict[str, Any]]:
    """Step 2: Execute the planned actions"""
    actions_taken = []
    
    for i, action in enumerate(actions):
        action_type = action.get("action_type")
        query = action.get("query", "")
        
        logger.info(f"Executing action {i+1}/{len(actions)}: {action_type} - {query}")
        
        try:
            if action_type == "search":
                result = await execute_search_action(query)
                
            elif action_type == "extract":
                document_titles = action.get("document_titles", [doc['title'] for doc in documents])
                result = await execute_extraction_action(query, document_titles, documents)
                
            elif action_type == "generate":
                document_titles = action.get("document_titles", [doc['title'] for doc in documents])
                full_doc = action.get("full_doc", False)
                result = await execute_generation_action(query, document_titles, full_doc, documents)
            else:
                result = f"Unknown action type: {action_type}"
            
            actions_taken.append({
                "action": action,
                "result": result,
                "success": True
            })
            
        except Exception as e:
            logger.error(f"Action {action_type} failed: {e}")
            actions_taken.append({
                "action": action,
                "result": f"Action failed: {str(e)}",
                "success": False
            })
    
    return actions_taken

async def generate_final_response(prompt: str, actions_taken: List[Dict[str, Any]], documents: List[Dict]) -> str:
    """Step 3: Generate final user-facing response"""
    global gemini_client
    
    if not gemini_client:
        raise HTTPException(status_code=503, detail="Gemini not available")
    
    # Prepare results summary
    results_summary = []
    for action_data in actions_taken:
        action = action_data["action"]
        result = action_data["result"]
        success = action_data["success"]
        
        if success:
            results_summary.append(f"Azione {action['action_type']}: {action['query']}\nRisultato: {result[:500]}...")
        else:
            results_summary.append(f"Azione {action['action_type']} fallita: {result}")
    
    results_text = "\n\n".join(results_summary)
    
    reasoning_prompt = f"""DOMANDA ORIGINALE: {prompt}

RISULTATI DEGLI AGENTI:
{results_text}

DOCUMENTI ANALIZZATI:
{', '.join([doc['title'] for doc in documents])}

Fornisci ora una risposta completa e professionale alla domanda dell'utente utilizzando i risultati ottenuti dagli agenti specializzati."""
    
    try:
        full_prompt = f"{REASONING_SYSTEM_PROMPT}\n\n{reasoning_prompt}"
        
        response = gemini_client.models.generate_content(
            model="gemini-1.5-flash",
            contents=full_prompt
        )
        
        return response.text.strip()
        
    except Exception as e:
        logger.error(f"Final response generation failed: {e}")
        # Fallback response
        successful_actions = [a for a in actions_taken if a["success"]]
        if successful_actions:
            latest_result = successful_actions[-1]["result"][:500]
            return f"Analisi completata utilizzando {len(successful_actions)} agenti specializzati. {latest_result}"
        else:
            return "Mi dispiace, non sono riuscito a completare l'analisi richiesta a causa di errori tecnici."

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
        
        # NEW TWO-STEP PROCESS
        
        # Step 1: Plan actions (always returns JSON actions)
        planned_actions = await plan_actions(request.prompt, documents)
        logger.info(f"Planned {len(planned_actions)} actions")
        
        # Step 2: Execute planned actions
        actions_taken = await execute_planned_actions(planned_actions, documents)
        logger.info(f"Executed {len(actions_taken)} actions")
        
        # Step 3: Generate final user-facing response
        final_response = await generate_final_response(request.prompt, actions_taken, documents)
        
        return OrchestrationResponse(
            success=True,
            agent_id=request.agent_id,
            execution_id=request.execution_id,
            prompt=request.prompt,
            document_ids=request.document_ids,
            actions_taken=actions_taken,
            final_response=final_response,
            message=f"Analisi completata con successo: {len(actions_taken)} azioni eseguite su {len(documents)} documenti"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Orchestration failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Orchestration failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8005)