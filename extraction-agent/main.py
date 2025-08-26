"""
Extraction Agent Service - FastAPI Implementation
Lightweight NER extraction service using Italian_NER_XXL model
Optimized for CPU usage and reduced memory footprint
"""

from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import requests
import os
from contextlib import asynccontextmanager
import asyncio
import logging
import torch

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set PyTorch to use single thread for CPU inference (lighter)
torch.set_num_threads(1)

# Global variables for model components
nlp_pipeline = None
model_loaded = False

def load_ner_model():
    """Load the NER model and tokenizer at startup to avoid cold starts"""
    global nlp_pipeline, model_loaded
    
    try:
        logger.info("Loading Italian NER model (CPU-optimized)...")
        from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
        
        # Load model and tokenizer with CPU optimization
        tokenizer = AutoTokenizer.from_pretrained(
            "DeepMount00/Italian_NER_XXL",
            use_fast=True  # Use fast tokenizer for better performance
        )
        model = AutoModelForTokenClassification.from_pretrained(
            "DeepMount00/Italian_NER_XXL", 
            ignore_mismatched_sizes=True,
            torch_dtype=torch.float32,  # Use float32 for CPU
            low_cpu_mem_usage=True  # Enable memory optimization
        )
        
        # Create NER pipeline with CPU optimizations
        nlp_pipeline = pipeline(
            "ner", 
            model=model, 
            tokenizer=tokenizer, 
            aggregation_strategy="simple",
            device=-1,  # Force CPU usage
            batch_size=1  # Small batch size for memory efficiency
        )
        
        model_loaded = True
        logger.info("NER model loaded successfully on CPU!")
        
    except Exception as e:
        logger.error(f"Failed to load NER model: {str(e)}")
        model_loaded = False
        raise

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load model
    logger.info("Starting Extraction Agent Service...")
    await asyncio.get_event_loop().run_in_executor(None, load_ner_model)
    yield
    # Shutdown: cleanup if needed
    logger.info("Shutting down Extraction Agent Service...")

app = FastAPI(
    title="Extraction Agent Service",
    lifespan=lifespan
)

# Document service URL (will be resolved via API Gateway)
DOCUMENT_SERVICE_URL = os.getenv("DOCUMENT_SERVICE_URL", "http://api-gateway:8080")

# Pydantic models
class ExtractionRequest(BaseModel):
    document_ids: List[str]  # Format: userId_projectId_docId
    agent_id: str = "extractor-agent"
    execution_id: Optional[str] = None

class EntityResult(BaseModel):
    label: str
    entities: List[str]

class ExtractionResponse(BaseModel):
    success: bool
    agent_id: str
    document_ids: List[str]
    execution_id: Optional[str]
    extracted_entities: str  # Concatenated string format
    entities_by_label: List[EntityResult]
    message: str

def extract_entities_from_text(text: str) -> tuple[str, List[EntityResult]]:
    """Extract entities from text using the loaded NER model"""
    global nlp_pipeline, model_loaded
    
    if not model_loaded or nlp_pipeline is None:
        raise HTTPException(status_code=503, detail="NER model not loaded")
    
    try:
        # Truncate text if too long to avoid memory issues
        max_length = 5000  # Reasonable limit for processing
        if len(text) > max_length:
            text = text[:max_length]
            logger.warning(f"Text truncated to {max_length} characters")
        
        # Run NER with CPU optimization
        with torch.inference_mode():  # Disable gradient computation
            ner_results = nlp_pipeline(text)
        
        # Extract and group entities
        entities_by_label = {}
        for ent in ner_results:
            label = ent["entity_group"]
            entity_text = ent["word"].strip()
            if label not in entities_by_label:
                entities_by_label[label] = []
            if entity_text and entity_text not in entities_by_label[label]:  # avoid duplicates and empty strings
                entities_by_label[label].append(entity_text)
        
        # Create response format
        entity_results = []
        concatenated_entities = []
        
        for label, entities in entities_by_label.items():
            entity_results.append(EntityResult(label=label, entities=entities))
            for entity in entities:
                concatenated_entities.append(f"{label}:{entity}")
        
        concatenated_string = ", ".join(concatenated_entities)
        
        return concatenated_string, entity_results
        
    except Exception as e:
        logger.error(f"Error during NER extraction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"NER extraction failed: {str(e)}")

async def fetch_document_text(document_id: str) -> str:
    """Fetch document text from document service via API Gateway"""
    try:
        # Parse document_id: userId_projectId_docId
        parts = document_id.split('_')
        if len(parts) != 3:
            raise ValueError(f"Invalid document_id format: {document_id}")
        
        user_id, project_id, doc_id = parts
        
        # Call document service via API Gateway
        url = f"{DOCUMENT_SERVICE_URL}/api/v1/documents/{user_id}/{project_id}/{doc_id}/text"
        
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        return data.get("text_content", "")
        
    except requests.RequestException as e:
        logger.error(f"Failed to fetch document {document_id}: {str(e)}")
        raise HTTPException(
            status_code=502, 
            detail=f"Failed to fetch document text: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Health check endpoint
@app.get("/")
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "extraction-agent",
        "model_loaded": model_loaded
    }

# Main extraction endpoint
@app.post("/api/v1/agents/extract", response_model=ExtractionResponse)
async def extract_entities(request: ExtractionRequest):
    """Extract entities from documents using Italian NER model"""
    
    if not model_loaded:
        raise HTTPException(status_code=503, detail="NER model not ready")
    
    if not request.document_ids:
        raise HTTPException(status_code=400, detail="No document IDs provided")
    
    try:
        all_texts = []
        processed_docs = []
        
        # Fetch text from all documents
        for doc_id in request.document_ids:
            try:
                text = await fetch_document_text(doc_id)
                if text.strip():  # Only add non-empty texts
                    all_texts.append(text)
                    processed_docs.append(doc_id)
            except Exception as e:
                logger.warning(f"Skipping document {doc_id}: {str(e)}")
                continue
        
        if not all_texts:
            raise HTTPException(
                status_code=404, 
                detail="No valid document texts found"
            )
        
        # Combine all texts for processing
        combined_text = "\n\n".join(all_texts)
        
        # Extract entities
        concatenated_entities, entity_results = extract_entities_from_text(combined_text)
        
        return ExtractionResponse(
            success=True,
            agent_id=request.agent_id,
            document_ids=processed_docs,
            execution_id=request.execution_id,
            extracted_entities=concatenated_entities,
            entities_by_label=entity_results,
            message=f"Successfully extracted entities from {len(processed_docs)} documents"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

# Alternative endpoint for orchestrator compatibility
@app.post("/api/v1/agents/process")
async def process_agent_task(request: dict):
    """Process agent task (orchestrator compatibility endpoint)"""
    
    agent_id = request.get("agentId")
    prompt = request.get("prompt", "")
    document_ids = request.get("documentIds", [])
    execution_id = request.get("executionId")
    
    if agent_id != "extractor-agent":
        raise HTTPException(status_code=400, detail="Invalid agent ID")
    
    extraction_request = ExtractionRequest(
        document_ids=document_ids,
        agent_id=agent_id,
        execution_id=execution_id
    )
    
    result = await extract_entities(extraction_request)
    
    return {
        "agentId": agent_id,
        "prompt": prompt,
        "documentIds": document_ids,
        "executionId": execution_id,
        "response": result.extracted_entities,
        "completedAt": None,  # Could add timestamp if needed
        "fullResult": result
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)