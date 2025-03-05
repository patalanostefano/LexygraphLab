from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.services.chunk_service import chunk_text, extract_text_from_binary

router = APIRouter()

class ChunkRequest(BaseModel):
    text: str
    chunk_size: int = 2000
    chunk_overlap: int = 200
    split_by_paragraph: bool = True

class ChunkBinaryRequest(BaseModel):
    chunk_size: int = 2000
    chunk_overlap: int = 200
    split_by_paragraph: bool = True

class Chunk(BaseModel):
    content: str
    order: int
    section: Optional[str] = None
    page_number: Optional[int] = None

class ChunkResponse(BaseModel):
    chunks: List[Chunk]
    total_chunks: int

@router.post("/chunk", response_model=ChunkResponse, summary="Split text into chunks")
async def create_chunks(request: ChunkRequest):
    try:
        chunks = chunk_text(
            request.text,
            request.chunk_size,
            request.chunk_overlap,
            request.split_by_paragraph
        )
        
        result = []
        for i, chunk in enumerate(chunks):
            result.append(Chunk(
                content=chunk,
                order=i,
                section="main"  # Logic for section detection can be added
            ))
            
        return ChunkResponse(
            chunks=result,
            total_chunks=len(result)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error chunking text: {str(e)}")

@router.post("/extract-and-chunk", response_model=ChunkResponse, summary="Extract text from binary and chunk it")
async def extract_and_chunk(
    file_bytes: bytes = Body(...),
    mime_type: str = Body(...),
    chunk_size: int = Body(2000),
    chunk_overlap: int = Body(200),
    split_by_paragraph: bool = Body(True)
):
    try:
        # Extract text from binary file
        text = extract_text_from_binary(file_bytes, mime_type)
        
        # Chunk the extracted text
        chunks = chunk_text(
            text,
            chunk_size,
            chunk_overlap,
            split_by_paragraph
        )
        
        result = []
        for i, chunk in enumerate(chunks):
            result.append(Chunk(
                content=chunk,
                order=i,
                section="main"  # Logic for section detection can be added
            ))
            
        return ChunkResponse(
            chunks=result,
            total_chunks=len(result)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
