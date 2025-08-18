import base64
from typing import List, Optional, Dict, Any

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

class DatabaseManager:
    def __init__(self):
        self.supabase: Optional[Client] = None
        self.available = False
        self._initialize_client()
    
    def _initialize_client(self):
        if not SUPABASE_AVAILABLE:
            print("❌ Supabase library not available")
            return
            
        supabase_url = "https://sjfdkgzmjaasjtavuhfu.supabase.co"
        supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZmRrZ3ptamFhc2p0YXZ1aGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NDUwNTIsImV4cCI6MjA1NzUyMTA1Mn0.dWBqYF31Ot73oXqf8v2KaMj37Tkzb3dd7Szq1WviDPA"
        
        print(f"🔗 Connecting to Supabase: {supabase_url[:30]}...")
        
        try:
            self.supabase = create_client(supabase_url, supabase_key)
            self.available = True
            print("✅ Supabase connected successfully")
        except Exception as e:
            print(f"❌ Supabase error: {e}")
            self.available = False
    
    def list_user_projects(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all projects for a user (derived from documents)"""
        if not self.available:
            return []
        
        try:
            # Get distinct project_ids for the user with document counts
            result = self.supabase.table('project_documents').select(
                'project_id'
            ).eq('user_id', user_id).execute()
            
            if not result.data:
                return []
            
            # Count documents per project
            project_counts = {}
            for doc in result.data:
                project_id = doc['project_id']
                project_counts[project_id] = project_counts.get(project_id, 0) + 1
            
            # Return list of project info
            projects = [
                {'project_id': project_id, 'document_count': count}
                for project_id, count in project_counts.items()
            ]
            
            return projects
        except Exception as e:
            print(f"List projects error: {e}")
            return []
    
    def store_document(self, document_id: str, user_id: str, project_id: str, 
                           doc_id: str, title: str, file_data: bytes, text_content: str) -> bool:
        if not self.available:
            return False
        
        try:
            # Convert bytes to base64 for JSON storage
            file_data_b64 = base64.b64encode(file_data).decode('utf-8')
            
            # Store binary PDF data
            self.supabase.table('pdf_storage').insert({
                'id': document_id,
                'user_id': user_id,
                'project_id': project_id,
                'doc_id': doc_id,
                'file_data': file_data_b64,
                'file_size': len(file_data),
                'content_type': 'application/pdf'
            }).execute()
            
            # Store document metadata and text content
            self.supabase.table('project_documents').insert({
                'id': document_id,
                'user_id': user_id,
                'project_id': project_id,
                'doc_id': doc_id,
                'title': title,
                'content': text_content
            }).execute()
            
            print(f"✅ Document {document_id} stored successfully")
            return True
        except Exception as e:
            print(f"❌ Store error: {e}")
            return False
    
    def get_document(self, document_id: str) -> Optional[bytes]:
        if not self.available:
            return None
        
        try:
            result = self.supabase.table('pdf_storage').select('file_data').eq('id', document_id).execute()
            if result.data:
                # Decode base64 back to bytes
                file_data_b64 = result.data[0]['file_data']
                return base64.b64decode(file_data_b64)
            return None
        except Exception as e:
            print(f"❌ Get document error: {e}")
            return None
    
    def get_document_text(self, document_id: str) -> Optional[str]:
        if not self.available:
            return None
        
        try:
            result = self.supabase.table('project_documents').select('content').eq('id', document_id).execute()
            if result.data:
                return result.data[0]['content']
            return None
        except Exception as e:
            print(f"Get text error: {e}")
            return None
    
    def list_project_documents(self, user_id: str, project_id: str) -> List[Dict[str, Any]]:
        if not self.available:
            return []
        
        try:
            result = self.supabase.table('project_documents').select(
                'doc_id, title, content'
            ).eq('user_id', user_id).eq('project_id', project_id).execute()
            
            return [
                {
                    'doc_id': doc['doc_id'], 
                    'title': doc['title'], 
                    'content': doc['content']
                } for doc in result.data
            ]
        except Exception as e:
            print(f"List documents error: {e}")
            return []