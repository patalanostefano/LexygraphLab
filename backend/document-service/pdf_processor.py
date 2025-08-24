import io

class PDFProcessor:
    def __init__(self):
        self.available_extractors = []
        
        try:
            import fitz  # PyMuPDF
            self.available_extractors.append('pymupdf')
        except ImportError:
            pass
        
        try:
            from PyPDF2 import PdfReader
            self.available_extractors.append('pypdf2')
        except ImportError:
            pass
    
    def extract_text_from_bytes(self, pdf_bytes: bytes) -> str:
        for extractor in self.available_extractors:
            try:
                if extractor == 'pymupdf':
                    return self._extract_with_pymupdf(pdf_bytes)
                elif extractor == 'pypdf2':
                    return self._extract_with_pypdf2(pdf_bytes)
            except Exception:
                continue
        
        return "Text extraction failed"
    
    def _extract_with_pymupdf(self, pdf_bytes: bytes) -> str:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ''.join([page.get_text() for page in doc])
        doc.close()
        return text.strip()
    
    def _extract_with_pypdf2(self, pdf_bytes: bytes) -> str:
        from PyPDF2 import PdfReader
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)
        text = ''.join([page.extract_text() or '' for page in reader.pages])
        return text.strip()