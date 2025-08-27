"""
Document Storage Service - FastAPI Implementation
Handles PDF document storage, retrieval, and text extraction
Now integrated with Chunker Service for automatic chunking
"""

from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import Response
from pydantic import BaseModel
import uvicorn
import requests
import tempfile
import os
import uuid
import json

from database import DatabaseManager
from pdf_processor import PDFProcessor

# URL del chunker service (in Docker sarà il nome del servizio)
CHUNKER_URL = os.getenv("CHUNKER_URL", "http://chunker-service:8000")
CHUNK_LIMIT_CHARS = 4000  # Define the limit for chunking

app = FastAPI(title="Document Storage Service")


# Initialize services
db_manager = DatabaseManager()
pdf_processor = PDFProcessor()

# Pydantic models
class DocumentResponse(BaseModel):
    success: bool
    message: str
    doc_id: str
    chunks: List[dict] = []  # aggiunto per restituire i chunk


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


class ChunksResponse(BaseModel):
    success: bool
    message: str
    chunks: List[dict]


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "document-service"}


# Get user projects (derived from documents)
@app.get("/api/v1/projects/{user_id}", response_model=ProjectListResponse)
async def get_user_projects(user_id: str):
    """Get all projects for a user (derived from existing documents)"""
    try:
        projects = db_manager.list_user_projects(user_id)
        return ProjectListResponse(projects=projects)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve projects: {str(e)}")


# Document upload endpoint
@app.post("/api/v1/documents/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    project_id: str = Form(...),
    title: str = Form(...),
    doc_id: Optional[str] = Form(None)
):
    """Upload a document to a project and store its chunks+embeddings"""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Generate doc_id if not provided
    if not doc_id:
        doc_id = str(uuid.uuid4())

    file_content = await file.read()
    text_content = pdf_processor.extract_text_from_bytes(file_content)
    document_id = f"{user_id}_{project_id}_{doc_id}"

    # Store document binary + text
    success = db_manager.store_document(
        document_id, user_id, project_id, doc_id, title, file_content, text_content
    )

    temp_path = None
    chunks_data = []
    try:
        # Crea un file temporaneo per inviarlo al chunker-service
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_content)
            temp_path = tmp.name

        with open(temp_path, "rb") as f:
            files = {"file": (file.filename, f)}
            r = requests.post(f"{CHUNKER_URL}/chunk", files=files, timeout=120)

        if r.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Chunker error: {r.text}")

        chunks_from_service = r.json().get("chunks", [])

        # Arricchiamo i chunk con metadata per DB
        chunks_to_store = [{
            "id": f"{document_id}_{i}",
            "user_id": user_id,
            "project_id": project_id,
            "doc_id": doc_id,
            "chunk_index": i,
            "chunk_text": chunk['text'],
            "embedding": chunk['embedding']
        } for i, chunk in enumerate(chunks_from_service)]

        if not db_manager.store_chunks(chunks_to_store):
            raise HTTPException(status_code=500, detail="Failed to store chunks in database.")

        # Aggiungi questa parte per rimuovere gli embeddings prima di restituire la risposta
        for chunk in chunks_to_store:
            if 'embedding' in chunk:
                del chunk['embedding']

        chunks_data = chunks_to_store
    
    except Exception as e:
        print(f"Error during chunking or storage: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {e}")
    finally:
        # Rimuove sempre il file temporaneo, anche in caso di errore
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

    if success:
        return DocumentResponse(
            success=True,
            message="Document uploaded and chunked successfully",
            doc_id=doc_id,
            chunks=chunks_data
        )
    else:
        raise HTTPException(status_code=500, detail="Failed to store document")


# Document retrieval endpoint (PDF binary)
@app.get("/api/v1/documents/{user_id}/{project_id}/{doc_id}")
async def get_document(user_id: str, project_id: str, doc_id: str):
    """Get document PDF binary"""
    document_id = f"{user_id}_{project_id}_{doc_id}"
    document_data = db_manager.get_document(document_id)

    if not document_data:
        raise HTTPException(status_code=404, detail="Document not found")

    return Response(content=document_data, media_type="application/pdf")


# ADDED: Alternative endpoint with /pdf suffix for gateway compatibility
@app.get("/api/v1/documents/{user_id}/{project_id}/{doc_id}/pdf")
async def get_document_pdf(user_id: str, project_id: str, doc_id: str):
    """Get document PDF binary (alternative endpoint with /pdf suffix)"""
    return await get_document(user_id, project_id, doc_id)


# Get document text content endpoint
@app.get("/api/v1/documents/{user_id}/{project_id}/{doc_id}/text")
async def get_document_text(user_id: str, project_id: str, doc_id: str):
    """Get document extracted text content"""
    document_id = f"{user_id}_{project_id}_{doc_id}"
    text_content = db_manager.get_document_text(document_id)

    if text_content is None:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"document_id": document_id, "text_content": text_content}


# List project documents endpoint
@app.get("/api/v1/documents/{user_id}/{project_id}", response_model=DocumentListResponse)
async def list_project_documents(user_id: str, project_id: str):
    """Get all documents in a project"""
    documents = db_manager.list_project_documents(user_id, project_id)
    return DocumentListResponse(documents=documents)

# NEW ENDPOINT: Query a document
@app.post("/api/v1/documents/query", response_model=ChunksResponse)
async def query_document(req: QueryRequest):
    """Query a document: retrieve best chunks from DB"""
    document_id = f"{req.user_id}_{req.project_id}_{req.doc_id}"

    # Controllo che il documento esista
    text_content = db_manager.get_document_text(document_id)
    if text_content is None:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Se il documento è corto restituisco tutto senza retrieval
    if len(text_content) <= CHUNK_LIMIT_CHARS:
        return ChunksResponse(
            success=True,
            message="Document is within the character limit, returning full text.",
            chunks=[{"text": text_content}]
        )

    # Ottengo embedding della query
    try:
        r = requests.post(f"{CHUNKER_URL}/embed-query", json={"query": req.query}, timeout=30)
        if r.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Embedding error: {r.text}")
        query_embedding = r.json().get("embedding")
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error contacting chunker service: {str(e)}")

    # Retrieval top-k chunks dal DB
    best_chunks = db_manager.get_best_chunks(
        req.user_id, req.project_id, req.doc_id, query_embedding, limit=1
    )

    return ChunksResponse(
        success=True,
        message="Returning relevant chunks based on query.",
        chunks=best_chunks
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)