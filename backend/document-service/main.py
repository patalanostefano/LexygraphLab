"""
Document Storage Service - FastAPI Implementation
Handles PDF document storage, retrieval, and text extraction
Now integrated with Chunker Service for automatic chunking
"""

from typing import List
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import Response
from pydantic import BaseModel
import uvicorn
import requests
import tempfile
import os

from database import DatabaseManager
from pdf_processor import PDFProcessor

# URL del chunker service (in Docker sarà il nome del servizio)
CHUNKER_URL = os.getenv("CHUNKER_URL", "http://chunker-service:8000/chunk")

app = FastAPI(title="Document Storage Service")

# Initialize services
db_manager = DatabaseManager()
pdf_processor = PDFProcessor()

# Pydantic models
class DocumentResponse(BaseModel):
    success: bool
    message: str
    document_id: str
    chunks: List[dict] = []  # aggiunto per restituire i chunk

class DocumentMetadata(BaseModel):
    doc_id: str
    title: str
    content: str

class DocumentListResponse(BaseModel):
    documents: List[DocumentMetadata]

# Document upload endpoint
@app.post("/api/v1/documents/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    project_id: str = Form(...),
    doc_id: str = Form(...),
    title: str = Form(...)
):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    file_content = await file.read()
    text_content = pdf_processor.extract_text_from_bytes(file_content)
    document_id = f"{user_id}_{project_id}_{doc_id}"
    
    success = await db_manager.store_document(
        document_id, user_id, project_id, doc_id, title, file_content, text_content
    )

    # Salva file temporaneo per invio al chunker
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(file_content)
        temp_path = tmp.name

    chunks_data = []
    try:
        with open(temp_path, "rb") as f:
            files = {"file": (file.filename, f)}
            try:
                r = requests.post(CHUNKER_URL, files=files, timeout=60)
                if r.status_code == 200:
                    chunks_data = r.json().get("chunks", [])
                else:
                    raise HTTPException(status_code=500, detail=f"Chunker error: {r.text}")
            except requests.RequestException as e:
                raise HTTPException(status_code=500, detail=f"Error contacting chunker service: {str(e)}")
    finally:
        os.remove(temp_path)

    if success:
        return DocumentResponse(
            success=True,
            message="Document uploaded and processed successfully",
            document_id=document_id,
            chunks=chunks_data
        )
    else:
        raise HTTPException(status_code=500, detail="Failed to store document")

# Document retrieval endpoint
@app.get("/api/v1/documents/{user_id}/{project_id}/{doc_id}")
async def get_document(user_id: str, project_id: str, doc_id: str):
    document_id = f"{user_id}_{project_id}_{doc_id}"
    document_data = await db_manager.get_document(document_id)
    
    if not document_data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return Response(content=document_data, media_type="application/pdf")

# List project documents endpoint
@app.get("/api/v1/documents/{user_id}/{project_id}", response_model=DocumentListResponse)
async def list_project_documents(user_id: str, project_id: str):
    documents = await db_manager.list_project_documents(user_id, project_id)
    return DocumentListResponse(documents=documents)

# Get document text content endpoint
@app.get("/api/v1/documents/{user_id}/{project_id}/{doc_id}/text")
async def get_document_text(user_id: str, project_id: str, doc_id: str):
    document_id = f"{user_id}_{project_id}_{doc_id}"
    text_content = await db_manager.get_document_text(document_id)
    
    if text_content is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"document_id": document_id, "text_content": text_content}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
