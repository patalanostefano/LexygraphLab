# Text Processing Service

This service provides document text extraction, chunking, and summarization capabilities for the LexygraphAI platform.

## Features

- Extract text from various document formats (PDF, DOCX, images, etc.)
- Split documents into manageable chunks with configurable size and overlap
- Generate summaries of document content using advanced NLP models
- RESTful API for easy integration with other services

## API Endpoints

### Text Chunking

- `POST /api/v1/chunk`: Split plain text into chunks
- `POST /api/v1/extract-and-chunk`: Extract text from a binary document and split into chunks

### Summarization

- `POST /api/v1/summarize`: Generate a summary from plain text
- `POST /api/v1/extract-and-summarize`: Extract text from a binary document and generate a summary

## Development

### Prerequisites

- Python 3.9+
- Docker and Docker Compose

### Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the service:
   ```
   uvicorn app.main:app --reload --port 8083
   ```

### Docker Build

```
docker build -t lexygraphai/text-processing-service .
```

## Integration with Document Service

This service is designed to work with the Document Service to process uploaded documents. The Document Service calls this service's API endpoints to:

1. Extract text from uploaded documents
2. Chunk documents for better analysis and storage
3. Generate summaries for quick document understanding

## Configuration

Configuration options can be set via environment variables or by modifying `app/config.py`.
