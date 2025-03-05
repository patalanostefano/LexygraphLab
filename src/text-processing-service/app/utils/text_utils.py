import re
from typing import List, Dict, Any

def clean_text(text: str) -> str:
    """Clean text by removing extra whitespace and normalizing line breaks"""
    # Replace multiple spaces with single space
    text = re.sub(r'\s+', ' ', text)
    
    # Normalize line breaks
    text = re.sub(r'\r\n', '\n', text)
    
    # Remove extra spaces at start/end of lines
    text = re.sub(r'^ +| +$', '', text, flags=re.MULTILINE)
    
    # Remove extra line breaks
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()

def detect_sections(text: str) -> List[Dict[str, Any]]:
    """
    Detect sections in a document based on headings.
    Returns a list of detected sections with their content.
    """
    # Simple heuristic: lines that are all caps or have specific patterns 
    # (numbers followed by dot/space, etc.) are likely headings
    heading_patterns = [
        r'^[A-Z\s]+$',  # All uppercase
        r'^\d+\.\s+.+$',  # Numbered sections (1. Title)
        r'^[IVXLCDM]+\.\s+.+$',  # Roman numerals (IV. Title)
        r'^Chapter\s+\d+',  # Chapter headings
        r'^Section\s+\d+'   # Section headings
    ]
    
    # Compile patterns
    patterns = [re.compile(p, re.MULTILINE) for p in heading_patterns]
    
    # Split text into lines
    lines = text.split('\n')
    
    sections = []
    current_section = {"heading": "Introduction", "content": ""}
    
    for line in lines:
        is_heading = any(p.match(line) for p in patterns)
        
        if is_heading:
            # If we have content in the current section, save it
            if current_section["content"].strip():
                sections.append(current_section)
                
            # Start a new section
            current_section = {"heading": line.strip(), "content": ""}
        else:
            # Add line to current section's content
            current_section["content"] += line + "\n"
    
    # Add the last section
    if current_section["content"].strip():
        sections.append(current_section)
    
    return sections

def extract_keywords(text: str, max_keywords: int = 10) -> List[str]:
    """
    Extract important keywords from text using simple TF-IDF approach.
    This is a simplified implementation - for production use NLTK or spaCy.
    """
    # Remove common punctuation
    text = re.sub(r'[,.;:!?"\'\(\)\[\]]', '', text.lower())
    
    # Split into words
    words = text.split()
    
    # Filter out common stop words (simplified list)
    stop_words = {'a', 'an', 'the', 'and', 'or', 'but', 'if', 'of', 'at', 'by', 
                 'for', 'with', 'about', 'to', 'from', 'in', 'on', 'is', 'are',
                 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
                 'this', 'that', 'these', 'those', 'as', 'so', 'than', 'then',
                 'there', 'here', 'when', 'which', 'who', 'whom', 'what', 'why'}
    
    filtered_words = [word for word in words if word not in stop_words and len(word) > 2]
    
    # Count word frequency
    word_freq = {}
    for word in filtered_words:
        word_freq[word] = word_freq.get(word, 0) + 1
    
    # Sort by frequency
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    
    # Return top keywords
    return [word for word, _ in sorted_words[:max_keywords]]
