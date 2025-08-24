import sqlite3
import json
from typing import List, Dict, Any, Optional


class DatabaseManager:
    def __init__(self, db_path: str = "documents.db"):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self._create_tables()

    def _create_tables(self):
        cur = self.conn.cursor()

        # Tabella per i documenti
        cur.execute("""
        CREATE TABLE IF NOT EXISTS project_documents (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            doc_id TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # Tabella per i PDF
        cur.execute("""
        CREATE TABLE IF NOT EXISTS pdf_storage (
            id TEXT PRIMARY KEY,
            file_data BLOB NOT NULL,
            file_size INTEGER NOT NULL,
            content_type TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # Tabella per i chunks
        cur.execute("""
        CREATE TABLE IF NOT EXISTS document_chunks (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            doc_id TEXT NOT NULL,
            chunk_index INTEGER NOT NULL,
            chunk_text TEXT NOT NULL,
            embedding TEXT NOT NULL,
            embedding_size INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        self.conn.commit()

    # -----------------------
    # Documenti
    # -----------------------
    def store_document(self, document_id: str, user_id: str, project_id: str,
                       doc_id: str, title: str, file_data: bytes, text_content: str) -> bool:
        try:
            cur = self.conn.cursor()
            # PDF storage
            cur.execute("""
                INSERT OR REPLACE INTO pdf_storage (id, file_data, file_size, content_type)
                VALUES (?, ?, ?, ?)
            """, (document_id, file_data, len(file_data), "application/pdf"))

            # Metadata e testo
            cur.execute("""
                INSERT OR REPLACE INTO project_documents (id, user_id, project_id, doc_id, title, content)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (document_id, user_id, project_id, doc_id, title, text_content))

            self.conn.commit()
            return True
        except Exception as e:
            print(f"❌ Store document error: {e}")
            return False

    def get_document(self, document_id: str) -> Optional[bytes]:
        cur = self.conn.cursor()
        cur.execute("SELECT file_data FROM pdf_storage WHERE id = ?", (document_id,))
        row = cur.fetchone()
        return row[0] if row else None

    def get_document_text(self, document_id: str) -> Optional[str]:
        cur = self.conn.cursor()
        cur.execute("SELECT content FROM project_documents WHERE id = ?", (document_id,))
        row = cur.fetchone()
        return row[0] if row else None

    def list_project_documents(self, user_id: str, project_id: str) -> List[Dict[str, Any]]:
        cur = self.conn.cursor()
        cur.execute("""
            SELECT doc_id, title, content
            FROM project_documents
            WHERE user_id = ? AND project_id = ?
        """, (user_id, project_id))
        rows = cur.fetchall()
        return [{"doc_id": r[0], "title": r[1], "content": r[2]} for r in rows]

    def list_user_projects(self, user_id: str) -> List[Dict[str, Any]]:
        cur = self.conn.cursor()
        cur.execute("""
            SELECT project_id, COUNT(*) as count
            FROM project_documents
            WHERE user_id = ?
            GROUP BY project_id
        """, (user_id,))
        rows = cur.fetchall()
        return [{"project_id": r[0], "document_count": r[1]} for r in rows]

    # -----------------------
    # Chunks
    # -----------------------
    def store_chunk(self, user_id: str, project_id: str,
                    doc_id: str, chunk_index: int,
                    chunk_text: str, embedding: List[float]) -> bool:
        try:
            cur = self.conn.cursor()
            embedding_json = json.dumps(embedding)
            emb_size = len(embedding)
            record_id = f"{user_id}_{project_id}_{doc_id}_{chunk_index}"
            cur.execute("""
                INSERT OR REPLACE INTO document_chunks
                (id, user_id, project_id, doc_id, chunk_index, chunk_text, embedding, embedding_size)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (record_id, user_id, project_id, doc_id, chunk_index, chunk_text, embedding_json, emb_size))
            self.conn.commit()
            return True
        except Exception as e:
            print(f"❌ Store chunk error: {e}")
            return False

    def get_chunks(self, user_id: str, project_id: str, doc_id: str) -> List[Dict[str, Any]]:
        cur = self.conn.cursor()
        cur.execute("""
            SELECT chunk_index, chunk_text, embedding
            FROM document_chunks
            WHERE user_id = ? AND project_id = ? AND doc_id = ?
            ORDER BY chunk_index
        """, (user_id, project_id, doc_id))
        rows = cur.fetchall()
        return [
            {
                "chunk_index": r[0],
                "chunk_text": r[1],
                "embedding": json.loads(r[2])
            }
            for r in rows
        ]
