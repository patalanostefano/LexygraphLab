import re
from typing import List, Optional, Dict, Any
from transformers import pipeline
import torch
from tika import parser

# Load the summarization model
device = 0 if torch.cuda.is_available() else -1
summarizer = pipeline("summarization", model="facebook/bart-large-cnn", device=device)

def extract_text_from_binary(file_bytes: bytes, mime_type: str) -> str:
    """
    Extract text from binary file data using Apache Tika.
    This is a simplified version - the full implementation should handle various file types.
    """
    try:
        parsed = parser.from_buffer(file_bytes)
        return parsed["content"] if parsed["content"] else ""
    except Exception as e:
        raise Exception(f"Error extracting text: {str(e)}")

def summarize_text(text: str, max_length: int = 300, min_length: Optional[int] = None, 
                   format_as_bullets: bool = False) -> str:
    """
    Summarize text using a pre-trained model.
    
    Args:
        text: The text to summarize.
        max_length: Maximum length of the summary.
        min_length: Minimum length of the summary (optional).
        format_as_bullets: Whether to format the summary as bullet points.
    
    Returns:
        Summarized text.
    """
    if not text or len(text) < 100:
        return text
    
    # Clean the text
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Set minimum length if not provided
    if min_length is None:
        min_length = min(30, max(10, max_length // 5))
    
    # Truncate very long input to fit model limit (typically 1024 tokens for BART)
    max_input_length = 4000  # Conservative estimate
    if len(text) > max_input_length:
        text = text[:max_input_length]
    
    # Generate summary
    try:
        summary = summarizer(
            text,
            max_length=max_length,
            min_length=min_length,
            do_sample=False  # Deterministic output
        )[0]['summary_text']
        
        if format_as_bullets:
            # Split by sentences and format as bullets
            sentences = re.split(r'(?<=[.!?])\s+', summary)
            summary = "\n• " + "\n• ".join([s.strip() for s in sentences if s.strip()])
        
        return summary
        
    except Exception as e:
        # Fallback to extractive summarization if model fails
        return fallback_extractive_summarization(text, max_length)

def fallback_extractive_summarization(text: str, max_length: int) -> str:
    """
    A simple extractive summarization as fallback when the model fails.
    """
    # Split text into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    # Simple heuristic for important sentences: first and last sentences of each paragraph
    important_sentences = [sentences[0]]  # Always include first sentence
    
    # Find paragraph breaks and add first/last sentences of each paragraph
    paragraphs = re.split(r'\n\s*\n|\r\n\s*\r\n', text)
    for para in paragraphs[1:]:  # Skip first paragraph as we already included its first sentence
        para_sentences = re.split(r'(?<=[.!?])\s+', para)
        if len(para_sentences) > 0:
            important_sentences.append(para_sentences[0])
            if len(para_sentences) > 1:
                important_sentences.append(para_sentences[-1])
    
    # Add last sentence of text if not already included
    if sentences[-1] not in important_sentences:
        important_sentences.append(sentences[-1])
    
    # Join sentences and truncate to max_length
    summary = ' '.join(important_sentences)
    if len(summary) > max_length:
        summary = summary[:max_length] + "..."
    
    return summary
