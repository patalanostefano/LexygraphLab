import re
from typing import List, Optional
import io
import PyPDF2
from docx import Document as DocxDocument
import pytesseract
from PIL import Image
import tika
from tika import parser

# Initialize Tika
tika.initVM()

def extract_text_from_binary(file_bytes: bytes, mime_type: str) -> str:
    """Extract text from binary file data based on mime type"""
    try:
        # For PDFs
        if mime_type == 'application/pdf':
            pdf_file = io.BytesIO(file_bytes)
            reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n\n"
            return text
            
        # For DOCX
        elif mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            docx_file = io.BytesIO(file_bytes)
            doc = DocxDocument(docx_file)
            text = "\n\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text
            
        # For images (JPG, PNG)
        elif mime_type in ['image/jpeg', 'image/png', 'image/jpg']:
            img = Image.open(io.BytesIO(file_bytes))
            text = pytesseract.image_to_string(img)
            return text
            
        # Fallback to Tika for other formats
        else:
            parsed = parser.from_buffer(file_bytes)
            return parsed["content"] if parsed["content"] else ""
            
    except Exception as e:
        raise Exception(f"Error extracting text: {str(e)}")

def chunk_text(text: str, chunk_size: int = 2000, chunk_overlap: int = 200, 
               split_by_paragraph: bool = True) -> List[str]:
    """Split text into chunks with specified size and overlap"""
    if not text:
        return []
        
    # Clean the text
    text = re.sub(r'\s+', ' ', text).strip()
    
    chunks = []
    
    if split_by_paragraph:
        # Split by paragraphs first
        paragraphs = re.split(r'\n\s*\n|\r\n\s*\r\n', text)
        
        current_chunk = []
        current_size = 0
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue
                
            paragraph_size = len(paragraph)
            
            # If this paragraph alone exceeds chunk size, we need to split it
            if paragraph_size > chunk_size:
                # If we have content in the current chunk, add it first
                if current_size > 0:
                    chunks.append(' '.join(current_chunk))
                    current_chunk = []
                    current_size = 0
                
                # Split long paragraph
                words = paragraph.split(' ')
                temp_chunk = []
                temp_size = 0
                
                for word in words:
                    word_size = len(word) + 1  # +1 for the space
                    
                    if temp_size + word_size <= chunk_size:
                        temp_chunk.append(word)
                        temp_size += word_size
                    else:
                        chunks.append(' '.join(temp_chunk))
                        
                        # Start a new chunk with overlap
                        overlap_point = max(0, len(temp_chunk) - chunk_overlap // len(' '.join(temp_chunk)) * len(temp_chunk))
                        temp_chunk = temp_chunk[int(overlap_point):]
                        temp_chunk.append(word)
                        temp_size = sum(len(w) + 1 for w in temp_chunk)
                
                if temp_chunk:
                    chunks.append(' '.join(temp_chunk))
            
            # Regular case - paragraph fits or can be added to current chunk
            elif current_size + paragraph_size + 1 <= chunk_size:  # +1 for space
                current_chunk.append(paragraph)
                current_size += paragraph_size + 1
            else:
                # Current chunk is full, start a new one
                chunks.append(' '.join(current_chunk))
                current_chunk = [paragraph]
                current_size = paragraph_size
        
        # Add the last chunk if there's anything left
        if current_chunk:
            chunks.append(' '.join(current_chunk))
    
    else:
        # Simple chunking by character count
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = min(start + chunk_size, text_length)
            
            # Try to break at a natural boundary
            if end < text_length:
                # Look for the last period followed by space
                last_period = text.rfind('. ', start, end)
                if last_period > start and (last_period + 2 - start) > chunk_size // 2:
                    end = last_period + 2  # Include the period and space
            
            chunks.append(text[start:end].strip())
            
            # Move start position for next chunk
            start = max(start, end - chunk_overlap)
            
    return chunks
