"""
Document Storage Service - FastAPI Implementation
Handles PDF document storage, retrieval, and text extraction
Now integrated with Chunker Service for automatic chunking & querying
"""

from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import requests
import tempfile
import os
import uuid
import numpy as np

from database import DatabaseManager
from pdf_processor import PDFProcessor

# URL del chunker service (in Docker sarà il nome del servizio)
CHUNKER_URL = os.getenv("CHUNKER_URL", "http://chunker-service:8000")

app = FastAPI(title="Document Storage Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
db_manager = DatabaseManager()
pdf_processor = PDFProcessor()

# =======================================
# MODELS
# =======================================

class DocumentResponse(BaseModel):
    success: bool
    message: str
    doc_id: str
    chunks: List[dict] = []


class DocumentMetadata(BaseModel):
    doc_id: str
    title: str
    content: str


class DocumentListResponse(BaseModel):
    documents: List[DocumentMetadata]


class ProjectInfo(BaseModel):
    project_id: str
    document_count: int


class ProjectListResponse(BaseModel):
    projects: List[ProjectInfo]


class QueryRequest(BaseModel):
    user_id: str
    project_id: str
    doc_id: str
    query: str
    limit: int = 4000


class QueryResponse(BaseModel):
    doc_id: str
    query: str
    result_text: str
    used_chunks: List[dict] = []


# =======================================
# ENDPOINTS
# =======================================

@app.get("/")
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "document-service"}


@app.get("/api/v1/projects/{user_id}", response_model=ProjectListResponse)
async def get_user_projects(user_id: str):
    try:
        projects = db_manager.list_user_projects(user_id)
        return ProjectListResponse(projects=projects)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve projects: {str(e)}")


@app.post("/api/v1/documents/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    project_id: str = Form(...),
    title: str = Form(...),
    doc_id: Optional[str] = Form(None)
):
    """Upload a document to a project"""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    if not doc_id:
        doc_id = str(uuid.uuid4())

    file_content = await file.read()
    text_content = pdf_processor.extract_text_from_bytes(file_content)
    document_id = f"{user_id}_{project_id}_{doc_id}"

    success = db_manager.store_document(
        document_id, user_id, project_id, doc_id, title, file_content, text_content
    )

    # invio al chunker (per salvare subito chunks + embeddings)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(file_content)
        temp_path = tmp.name

    chunks_data = []
    try:
        with open(temp_path, "rb") as f:
            files = {"file": (file.filename, f)}
            r = requests.post(f"{CHUNKER_URL}/chunk", files=files, timeout=120)
            if r.status_code == 200:
                chunks_data = r.json().get("chunks", [])
                # salvo nel DB i chunks
                for idx, chunk in enumerate(chunks_data):
                    # CORREZIONE: passaggio dei parametri corretti
                    db_manager.store_chunk(
                        user_id=user_id,
                        project_id=project_id,
                        doc_id=doc_id,
                        chunk_index=idx,
                        chunk_text=chunk["text"],
                        embedding=chunk["embedding"]
                    )
            else:
                raise HTTPException(status_code=500, detail=f"Chunker error: {r.text}")
    finally:
        os.remove(temp_path)

    if success:
        return DocumentResponse(
            success=True,
            message="Document uploaded successfully",
            doc_id=doc_id,
            chunks=chunks_data
        )
    else:
        raise HTTPException(status_code=500, detail="Failed to store document")


@app.get("/api/v1/documents/{user_id}/{project_id}/{doc_id}")
async def get_document(user_id: str, project_id: str, doc_id: str):
    document_id = f"{user_id}_{project_id}_{doc_id}"
    document_data = db_manager.get_document(document_id)

    if not document_data:
        raise HTTPException(status_code=404, detail="Document not found")

    return Response(content=document_data, media_type="application/pdf")


@app.get("/api/v1/documents/{user_id}/{project_id}", response_model=DocumentListResponse)
async def list_project_documents(user_id: str, project_id: str):
    documents = db_manager.list_project_documents(user_id, project_id)
    return DocumentListResponse(documents=documents)


# ========================================================
# NEW: Query endpoint with intelligent chunk retrieval
# ========================================================

@app.post("/api/v1/documents/query", response_model=QueryResponse)
async def query_document(req: QueryRequest):
    document_id = f"{req.user_id}_{req.project_id}_{req.doc_id}"
    text_content = db_manager.get_document_text(document_id)

    if text_content is None:
        raise HTTPException(status_code=404, detail="Document not found")

    # caso 1: documento corto
    if len(text_content) <= req.limit:
        return QueryResponse(
            doc_id=req.doc_id,
            query=req.query,
            result_text=text_content,
            used_chunks=[]
        )

    # caso 2: documento lungo -> cerco chunks nel DB
    # CORREZIONE: passaggio dei parametri corretti
    chunks = db_manager.get_chunks(user_id=req.user_id, project_id=req.project_id, doc_id=req.doc_id)

    if not chunks or len(chunks) == 0:
        # non ho chunks -> devo chunkare
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            pdf_bytes = db_manager.get_document(document_id)
            if not pdf_bytes:
                 raise HTTPException(status_code=404, detail="Document not found during re-chunking")
            tmp.write(pdf_bytes)
            temp_path = tmp.name

        try:
            with open(temp_path, "rb") as f:
                files = {"file": (f"{req.doc_id}.pdf", f)}
                r = requests.post(f"{CHUNKER_URL}/chunk", files=files, timeout=120)
                if r.status_code == 200:
                    chunks_data = r.json().get("chunks", [])
                    for idx, chunk in enumerate(chunks_data):
                        # CORREZIONE: passaggio dei parametri corretti
                        db_manager.store_chunk(
                            user_id=req.user_id,
                            project_id=req.project_id,
                            doc_id=req.doc_id,
                            chunk_index=idx,
                            chunk_text=chunk["text"],
                            embedding=chunk["embedding"]
                        )
                    # CORREZIONE: Chiamare nuovamente get_chunks dopo averli salvati
                    chunks = db_manager.get_chunks(user_id=req.user_id, project_id=req.project_id, doc_id=req.doc_id)
                else:
                    raise HTTPException(status_code=500, detail=f"Chunker error: {r.text}")
        finally:
            os.remove(temp_path)

    # ottengo embedding della query dal chunker
    try:
        r = requests.post(f"{CHUNKER_URL}/embed-query", json={"query": req.query}, timeout=60)
        if r.status_code == 200:
            query_emb = r.json().get("embedding", [])
        else:
            raise HTTPException(status_code=500, detail=f"Chunker query embedding error: {r.text}")
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error contacting chunker service: {str(e)}")

    # similarity search sui chunks
    def cosine_similarity(a, b):
        a, b = np.array(a), np.array(b)
        # Protezione per divisione per zero
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return np.dot(a, b) / (norm_a * norm_b)

    scored_chunks = []
    for ch in chunks:
        # Assicurati che l'embedding esista
        if "embedding" in ch and ch["embedding"]:
            sim = cosine_similarity(query_emb, ch["embedding"])
            scored_chunks.append((sim, ch))

    scored_chunks.sort(key=lambda x: x[0], reverse=True)

    result_text = ""
    used_chunks = []
    for _, ch in scored_chunks:
        if len(result_text) + len(ch["chunk_text"]) > req.limit:
            break
        result_text += ch["chunk_text"] + "\n"
        used_chunks.append(ch)

    return QueryResponse(
        doc_id=req.doc_id,
        query=req.query,
        result_text=result_text.strip(),
        used_chunks=used_chunks
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)