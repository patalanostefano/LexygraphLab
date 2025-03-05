FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for Tesseract OCR and PDF processing
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    poppler-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Export Tesseract data path
ENV TESSDATA_PREFIX=/usr/share/tesseract-ocr/4.00/tessdata

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8083"]
