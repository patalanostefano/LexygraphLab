from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.services.summarize_service import summarize_text, extract_text_from_binary

router = APIRouter()

class SummarizeRequest(BaseModel):
    text: str
    max_length: int = 300
    min_length: Optional[int] = None
    format_as_bullets: bool = False

class SummarizeResponse(BaseModel):
    summary: str
    original_length: int
    summary_length: int

@router.post("/summarize", response_model=SummarizeResponse, summary="Generate a summary of text")
async def summarize(request: SummarizeRequest):
    try:
        if len(request.text) < 100:
            return SummarizeResponse(
                summary=request.text,
                original_length=len(request.text),
                summary_length=len(request.text)
            )
            
        summary = summarize_text(
            request.text, 
            max_length=request.max_length,
            min_length=request.min_length,
            format_as_bullets=request.format_as_bullets
        )
        
        return SummarizeResponse(
            summary=summary,
            original_length=len(request.text),
            summary_length=len(summary)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error summarizing text: {str(e)}")

@router.post("/extract-and-summarize", response_model=SummarizeResponse, summary="Extract text from binary and summarize it")
async def extract_and_summarize(
    file_bytes: bytes = Body(...),
    mime_type: str = Body(...),
    max_length: int = Body(300),
    min_length: Optional[int] = Body(None),
    format_as_bullets: bool = Body(False)
):
    try:
        # Extract text from binary file
        text = extract_text_from_binary(file_bytes, mime_type)
        
        if len(text) < 100:
            return SummarizeResponse(
                summary=text,
                original_length=len(text),
                summary_length=len(text)
            )
            
        # Summarize the extracted text
        summary = summarize_text(
            text, 
            max_length=max_length,
            min_length=min_length,
            format_as_bullets=format_as_bullets
        )
        
        return SummarizeResponse(
            summary=summary,
            original_length=len(text),
            summary_length=len(summary)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
