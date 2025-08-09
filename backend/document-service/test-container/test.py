#!/usr/bin/env python3
import os
import requests
from pathlib import Path

BASE_URL = "http://localhost:8000/api/v1"
PDF_DIR = "pdfs"
REAL_USER_ID = "54df1b72-6838-4061-8312-32ac7d3ce640" 


def test_upload_document(pdf_path, user_id="54df1b72-6838-4061-8312-32ac7d3ce640", project_id="test_project", doc_id="doc1"):
    """Test document upload"""
    print(f"📤 Uploading: {pdf_path}")
    
    if not os.path.exists(pdf_path):
        print(f"❌ PDF not found: {pdf_path}")
        return None
    
    with open(pdf_path, 'rb') as pdf_file:
        files = {'file': pdf_file}
        data = {
            'user_id': user_id,
            'project_id': project_id,
            'doc_id': doc_id,
            'title': f"Test Document {doc_id}"
        }
        
        response = requests.post(f"{BASE_URL}/documents/upload", files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Upload successful: {result['document_id']}")
            return result['document_id']
        else:
            print(f"❌ Upload failed: {response.text}")
            return None

def test_get_document(user_id, project_id, doc_id):
    """Test PDF retrieval"""
    print(f"📥 Getting PDF: {user_id}/{project_id}/{doc_id}")
    
    response = requests.get(f"{BASE_URL}/documents/{user_id}/{project_id}/{doc_id}")
    
    if response.status_code == 200:
        print(f"✅ PDF retrieved, size: {len(response.content)} bytes")
        return True
    else:
        print(f"❌ PDF retrieval failed: {response.text}")
        return False

def test_get_text(user_id, project_id, doc_id):
    """Test text retrieval"""
    print(f"📄 Getting text: {user_id}/{project_id}/{doc_id}")
    
    response = requests.get(f"{BASE_URL}/documents/{user_id}/{project_id}/{doc_id}/text")
    
    if response.status_code == 200:
        result = response.json()
        text_preview = result['text_content'][:100] + "..." if len(result['text_content']) > 100 else result['text_content']
        print(f"✅ Text retrieved: {text_preview}")
        return result['text_content']
    else:
        print(f"❌ Text retrieval failed: {response.text}")
        return None

def test_list_documents(user_id, project_id):
    """Test project documents listing"""
    print(f"📋 Listing docs: {user_id}/{project_id}")
    
    response = requests.get(f"{BASE_URL}/documents/{user_id}/{project_id}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Found {len(result['documents'])} documents")
        for doc in result['documents']:
            print(f"  - {doc['title']} ({doc['doc_id']})")
        return result['documents']
    else:
        print(f"❌ List failed: {response.text}")
        return []

def create_test_pdf():
    """Create a simple test PDF"""
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        
        os.makedirs(PDF_DIR, exist_ok=True)
        pdf_path = os.path.join(PDF_DIR, "test_sample.pdf")
        
        c = canvas.Canvas(pdf_path, pagesize=letter)
        c.drawString(100, 750, "Test PDF Document")
        c.drawString(100, 730, "This is a sample document for testing")
        c.drawString(100, 710, "Document Service API endpoints")
        c.save()
        
        print(f"✅ Created test PDF: {pdf_path}")
        return pdf_path
    except ImportError:
        print("❌ reportlab not available for PDF creation")
        return None

def run_tests():
    """Run all tests"""
    print("🚀 Starting Document Service Tests")
    print("=" * 40)
    
    # Check if service is running
    try:
        response = requests.get("http://localhost:8000", timeout=5)
    except:
        print("❌ Service not running. Start with: docker run -p 8000:8000 document-service")
        return
    
    # Find PDF files
    pdf_files = []
    if Path(PDF_DIR).exists():
        pdf_files = list(Path(PDF_DIR).glob("*.pdf"))
    
    if not pdf_files:
        print("📁 No PDFs found, creating test PDF...")
        test_pdf = create_test_pdf()
        if test_pdf:
            pdf_files = [Path(test_pdf)]
    
    if not pdf_files:
        print("❌ No PDFs available for testing")
        return
    
    print(f"📁 Testing with {len(pdf_files)} PDF files")
    print("=" * 40)
    
    # Test uploads
    uploaded_docs = []
    for i, pdf_file in enumerate(pdf_files[:2]):  # Test max 2 files
        doc_id = f"doc{i+1}"
        document_id = test_upload_document(str(pdf_file), REAL_USER_ID, doc_id=doc_id)
        if document_id:
            uploaded_docs.append({
                'document_id': document_id,
                'user_id': REAL_USER_ID,
                'project_id': 'test_project',
                'doc_id': doc_id
            })
    
    if not uploaded_docs:
        print("❌ No documents uploaded")
        return
    
    print(f"\n✅ Uploaded {len(uploaded_docs)} documents")
    print("=" * 40)
    
    # Test retrieval
    for doc in uploaded_docs:
        test_get_document(doc['user_id'], doc['project_id'], doc['doc_id'])
    
    print("\n" + "=" * 40)
    
    # Test text extraction
    for doc in uploaded_docs:
        test_get_text(doc['user_id'], doc['project_id'], doc['doc_id'])
    
    print("\n" + "=" * 40)
    
    # Test listing
    test_list_documents(REAL_USER_ID, "test_project")
    
    print("\n🎉 Tests completed!")

if __name__ == "__main__":
    run_tests()