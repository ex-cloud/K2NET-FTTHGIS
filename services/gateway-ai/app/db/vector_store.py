"""
K2NET FTTH AI Gateway — Vector Store
Pencarian kemiripan kosinus pgvector dengan isolasi tenant mutlak.
ATURAN WAJIB: SETIAP kueri vektor HARUS menyertakan WHERE tenant_id = :tenant_id
"""
from sqlalchemy import text
from typing import Optional
import uuid
import logging

from app.db.session import get_db_session

logger = logging.getLogger(__name__)


class VectorStore:
    """
    Antarmuka untuk operasi pgvector: similarity search & chunk storage.
    Semua operasi bersifat tenant-scoped (Zero Data Leakage).
    """

    async def similarity_search(
        self,
        query_embedding: list[float],
        tenant_id: uuid.UUID,
        scope: str = "GENERAL",
        limit: int = 4,
        min_similarity: float = 0.3,
    ) -> list[dict]:
        """
        Cosine similarity search di pgvector.
        HNSW index otomatis digunakan oleh PostgreSQL untuk query ini.
        
        Returns:
            List of dict: {content, document_id, title, chunk_index, similarity_score}
        """
        sql = text("""
            SELECT
                c.id::text               AS chunk_id,
                c.document_id::text      AS document_id,
                d.title                  AS document_title,
                d.category               AS category,
                c.chunk_index            AS chunk_index,
                c.content                AS content,
                c.metadata               AS metadata,
                1 - (c.embedding <=> :query_vec::vector) AS similarity_score
            FROM ai_document_chunks c
            JOIN ai_documents d ON d.id = c.document_id
            WHERE
                c.tenant_id = :tenant_id          -- Isolasi Mutlak!
                AND d.tenant_id = :tenant_id       -- Double-lock pada join
                AND d.status = 'INDEXED'
                AND (:scope = 'GENERAL' OR d.category = :scope)
                AND 1 - (c.embedding <=> :query_vec::vector) >= :min_similarity
            ORDER BY c.embedding <=> :query_vec::vector
            LIMIT :limit
        """)

        async with get_db_session() as session:
            result = await session.execute(
                sql,
                {
                    "query_vec": str(query_embedding),
                    "tenant_id": str(tenant_id),
                    "scope": scope,
                    "min_similarity": min_similarity,
                    "limit": limit,
                },
            )
            rows = result.mappings().all()

        return [dict(row) for row in rows]

    async def store_chunk(
        self,
        document_id: uuid.UUID,
        tenant_id: uuid.UUID,
        chunk_index: int,
        content: str,
        token_count: int,
        embedding: list[float],
        metadata: dict,
    ) -> uuid.UUID:
        """Simpan chunk teks beserta vektor embedding ke database."""
        sql = text("""
            INSERT INTO ai_document_chunks
                (document_id, tenant_id, chunk_index, content, token_count, embedding, metadata)
            VALUES
                (:document_id, :tenant_id, :chunk_index, :content, :token_count, :embedding::vector, :metadata::jsonb)
            RETURNING id
        """)
        import json
        async with get_db_session() as session:
            result = await session.execute(
                sql,
                {
                    "document_id": str(document_id),
                    "tenant_id": str(tenant_id),
                    "chunk_index": chunk_index,
                    "content": content,
                    "token_count": token_count,
                    "embedding": str(embedding),
                    "metadata": json.dumps(metadata),
                },
            )
            row = result.fetchone()
        return uuid.UUID(str(row[0]))

    async def update_document_status(
        self,
        document_id: uuid.UUID,
        tenant_id: uuid.UUID,
        status: str,
        chunk_count: int = 0,
        error_message: Optional[str] = None,
    ) -> None:
        """Update status dokumen setelah proses indexing selesai atau gagal."""
        sql = text("""
            UPDATE ai_documents
            SET status = :status,
                chunk_count = :chunk_count,
                error_message = :error_message,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :document_id AND tenant_id = :tenant_id
        """)
        async with get_db_session() as session:
            await session.execute(
                sql,
                {
                    "status": status,
                    "chunk_count": chunk_count,
                    "error_message": error_message,
                    "document_id": str(document_id),
                    "tenant_id": str(tenant_id),
                },
            )


# Singleton instance
vector_store = VectorStore()
