import os
import json
import logging
from typing import Any, Dict, List, Optional, Tuple, Callable, Awaitable
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict

# ---------- Logging ----------
logger = logging.getLogger("orchestration-wrapper")
logger.setLevel(logging.INFO)
_h = logging.StreamHandler()
_h.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s"))
logger.addHandler(_h)

# ---------- Config ----------
WRAPPER_PORT = int(os.getenv("WRAPPER_PORT", "8010"))

SEARCH_AGENT_URL        = os.getenv("SEARCH_AGENT_URL",        "http://search-agent:8002")
EXTRACTION_AGENT_URL    = os.getenv("EXTRACTION_AGENT_URL",    "http://extraction-agent:8001")
GENERATION_AGENT_URL    = os.getenv("GENERATION_AGENT_URL",    "http://generation-agent:8003")
ORCHESTRATION_AGENT_URL = os.getenv("ORCHESTRATION_AGENT_URL", "http://orchestration-agent:8005")

REQUEST_TIMEOUT_SECONDS = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "60"))
RETRY_ATTEMPTS          = max(1, int(os.getenv("RETRY_ATTEMPTS", "1")))

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins_list = [o.strip() for o in ALLOWED_ORIGINS.split(",")] if ALLOWED_ORIGINS else ["*"]

# ---------- Pydantic models ----------
class SearchIn(BaseModel):
    query: str = Field(..., min_length=1)
    agent_id: Optional[str] = "search-agent"

class SearchOut(BaseModel):
    results: str
    sources: Optional[List[Dict[str, Any]]] = None
    provider_summary: Optional[Dict[str, Any]] = None

class ProcessIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    agentId: str = Field(..., pattern="^(extract(or)?ion-agent|generation-agent)$")
    prompt: str = ""
    documentIds: List[str] = Field(default_factory=list)
    executionId: Optional[str] = None
    fullDoc: Optional[bool] = False

class AgentOut(BaseModel):
    agentId: str
    prompt: Optional[str] = None
    documentIds: List[str] = Field(default_factory=list)
    executionId: Optional[str] = None
    response: Any
    completedAt: Optional[str] = None
    fullResult: Optional[Any] = None

class OrchestrateIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    # accetta sia camelCase che snake_case in ingresso
    document_ids: Optional[List[str]] = None
    documentIds: Optional[List[str]] = None
    prompt: str
    agent_id: str = "orchestration-agent"
    execution_id: Optional[str] = None

class OrchestrateOut(BaseModel):
    success: bool
    agent_id: str
    execution_id: Optional[str]
    prompt: str
    document_ids: List[str]
    actions_taken: List[Dict[str, Any]]
    final_response: str
    message: str

# ---------- FastAPI app ----------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global client
    client = httpx.AsyncClient(timeout=httpx.Timeout(REQUEST_TIMEOUT_SECONDS))
    logger.info("orchestration-wrapper starting")
    yield
    logger.info("orchestration-wrapper stopping")
    await client.aclose()

app = FastAPI(title="Orchestration Wrapper", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Utils ----------
def _extract_corr_headers(execution_id: Optional[str]) -> Dict[str, str]:
    return {"X-Execution-Id": execution_id} if execution_id else {}

def _synonym_agent(agent_id: str) -> Tuple[str, str]:
    """Normalizza gli ID agent e decide il base URL."""
    norm = agent_id
    if agent_id in ("extractor-agent", "extraction-agent"):
        norm = "extraction-agent"
        return norm, EXTRACTION_AGENT_URL
    if agent_id == "generation-agent":
        return norm, GENERATION_AGENT_URL
    if agent_id == "orchestration-agent":
        return norm, ORCHESTRATION_AGENT_URL
    if agent_id == "search-agent":
        return norm, SEARCH_AGENT_URL
    # default
    return agent_id, ""

def _pass_downstream_error(resp: httpx.Response) -> None:
    # Prova a restituire l’errore del downstream così com’è (JSON o testo)
    try:
        data = resp.json()
        raise HTTPException(status_code=resp.status_code, detail=data)
    except Exception:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

async def _with_retries(fn: Callable[[], Awaitable[httpx.Response]]) -> httpx.Response:
    last_exc: Optional[Exception] = None
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            return await fn()
        except Exception as e:
            last_exc = e
            logger.warning("retry %d/%d failed: %s", attempt, RETRY_ATTEMPTS, str(e))
    assert last_exc is not None
    raise last_exc

# ---------- Health ----------
@app.get("/")
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "orchestration-wrapper",
        "downstreams": {
            "search": SEARCH_AGENT_URL,
            "extraction": EXTRACTION_AGENT_URL,
            "generation": GENERATION_AGENT_URL,
            "orchestration": ORCHESTRATION_AGENT_URL,
        },
        "timeouts": REQUEST_TIMEOUT_SECONDS,
        "retries": RETRY_ATTEMPTS,
    }

# ---------- Search ----------
@app.post("/api/v1/agents/search", response_model=SearchOut)
async def wrapper_search(payload: SearchIn, x_execution_id: Optional[str] = Header(None)):
    headers = _extract_corr_headers(x_execution_id)

    # 1) prova lo stile "nuovo" /api/v1/agents/search
    async def call_new():
        body = {"query": payload.query, "agent_id": payload.agent_id}
        return await client.post(f"{SEARCH_AGENT_URL}/api/v1/agents/search", json=body, headers=headers)

    # 2) fallback stile "vecchio" /api/v1/search
    async def call_old():
        body = {"query": payload.query, "max_results": 5, "include_sources": True}
        return await client.post(f"{SEARCH_AGENT_URL}/api/v1/search", json=body, headers=headers)

    # tenta nuovo poi vecchio
    resp = await _with_retries(call_new)
    if resp.status_code == 404:
        resp = await _with_retries(call_old)

    if resp.status_code != 200:
        _pass_downstream_error(resp)

    data = resp.json()
    # normalizzazione campi più comuni
    results = data.get("results") or data.get("summary") or "No search results"
    sources = data.get("sources")
    provider_summary = {"providers": data.get("search_providers_used", [])} if "search_providers_used" in data else None
    return SearchOut(results=results, sources=sources, provider_summary=provider_summary)

# ---------- Process (extraction / generation) ----------
@app.post("/api/v1/agents/process", response_model=AgentOut)
async def wrapper_process(payload: ProcessIn, x_execution_id: Optional[str] = Header(None)):
    agent_norm, base_url = _synonym_agent(payload.agentId)
    if not base_url:
        raise HTTPException(status_code=400, detail=f"Unsupported agentId '{payload.agentId}'")

    headers = _extract_corr_headers(payload.executionId or x_execution_id)

    # il downstream (entrambi gli agent) usa /api/v1/agents/process
    body = {
        "agentId": agent_norm,
        "prompt": payload.prompt,
        "documentIds": payload.documentIds or [],
        "executionId": payload.executionId,
    }
    # il generation-agent accetta anche fullDoc
    if agent_norm == "generation-agent":
        body["fullDoc"] = bool(payload.fullDoc)

    async def _call():
        return await client.post(f"{base_url}/api/v1/agents/process", json=body, headers=headers)

    resp = await _with_retries(_call)
    if resp.status_code != 200:
        _pass_downstream_error(resp)

    # Pass-through + tipica forma standardizzata
    try:
        data = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid JSON from downstream")

    # Se già è nel formato giusto lo rimandiamo tale e quale
    # altrimenti normalizziamo i campi minimi
    if {"agentId", "response"}.issubset(set(data.keys())):
        return data  # FastAPI lo rimappa su AgentOut

    return AgentOut(
        agentId=agent_norm,
        prompt=body["prompt"],
        documentIds=body["documentIds"],
        executionId=body["executionId"],
        response=data,
    )

# ---------- Orchestrate (chiama l’orchestration-agent) ----------
@app.post("/api/v1/agents/orchestrate", response_model=OrchestrateOut)
async def wrapper_orchestrate(payload: OrchestrateIn, x_execution_id: Optional[str] = Header(None)):
    # accetta documentIds/document_ids in ingresso, invia document_ids al downstream
    document_ids = payload.document_ids or payload.documentIds or []
    if not payload.prompt or not document_ids:
        raise HTTPException(status_code=400, detail="Both 'prompt' and 'document_ids' (or 'documentIds') are required")

    headers = _extract_corr_headers(payload.execution_id or x_execution_id)

    body = {
        "document_ids": document_ids,
        "prompt": payload.prompt,
        "agent_id": "orchestration-agent",
        "execution_id": payload.execution_id,
    }

    async def _call():
        return await client.post(f"{ORCHESTRATION_AGENT_URL}/api/v1/agents/orchestrate", json=body, headers=headers)

    resp = await _with_retries(_call)
    if resp.status_code != 200:
        _pass_downstream_error(resp)

    try:
        return resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid JSON from orchestration-agent")

# Alias comodo, se vuoi anche /api/v1/orchestrate
@app.post("/api/v1/orchestrate", response_model=OrchestrateOut)
async def wrapper_orchestrate_alias(payload: OrchestrateIn, x_execution_id: Optional[str] = Header(None)):
    return await wrapper_orchestrate(payload, x_execution_id)
