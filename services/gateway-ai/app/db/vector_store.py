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
        scope: str = "ALL",
        category: str = "ALL",
        allowed_scopes: Optional[list[str]] = None,
        limit: int = 4,
        min_similarity: float = 0.25,
    ) -> list[dict]:
        """
        Cosine similarity search di pgvector.
        HNSW index otomatis digunakan oleh PostgreSQL untuk query ini.
        HANYA menarik dokumen yang berstatus 'INDEXED' dan lolos filter scope tenant.
        
        Returns:
            List of dict: {content, document_id, title, category, scope, chunk_index, similarity_score}
        """
        scope_conditions = []
        params = {
            "query_vec": str(query_embedding),
            "tenant_id": str(tenant_id),
            "min_similarity": min_similarity,
            "limit": limit,
        }

        if allowed_scopes and len(allowed_scopes) > 0:
            scope_conditions.append("d.scope = ANY(:allowed_scopes)")
            params["allowed_scopes"] = allowed_scopes
        elif scope and scope.upper() not in ("ALL", "GENERAL"):
            scope_conditions.append("(d.scope = :scope OR d.category = :scope)")
            params["scope"] = scope.upper()

        if category and category.upper() != "ALL":
            scope_conditions.append("d.category = :category")
            params["category"] = category.upper()

        extra_filter = ("AND " + " AND ".join(scope_conditions)) if scope_conditions else ""

        sql = text(f"""
            SELECT
                CAST(c.id AS text)               AS chunk_id,
                CAST(c.document_id AS text)      AS document_id,
                d.title                          AS document_title,
                d.category                       AS category,
                d.scope                          AS scope,
                c.chunk_index                    AS chunk_index,
                c.content                        AS content,
                c.metadata                       AS metadata,
                1 - (c.embedding <=> CAST(:query_vec AS vector)) AS similarity_score
            FROM ai_document_chunks c
            JOIN ai_documents d ON d.id = c.document_id
            WHERE
                c.tenant_id = :tenant_id          -- Isolasi Mutlak Tenant!
                AND d.tenant_id = :tenant_id       -- Double-lock pada join
                AND d.status = 'INDEXED'           -- Hanya dokumen terverifikasi
                {extra_filter}
                AND 1 - (c.embedding <=> CAST(:query_vec AS vector)) >= :min_similarity
            ORDER BY c.embedding <=> CAST(:query_vec AS vector)
            LIMIT :limit
        """)

        async with get_db_session() as session:
            result = await session.execute(sql, params)
            rows = result.mappings().fetchall()

        return [
            {
                "chunk_id": str(r["chunk_id"]),
                "document_id": str(r["document_id"]),
                "title": r["document_title"],
                "category": r["category"],
                "scope": r.get("scope", "GLOBAL"),
                "chunk_index": r["chunk_index"],
                "content": r["content"],
                "similarity_score": float(r["similarity_score"]),
            }
            for r in rows
        ]

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
                (:document_id, :tenant_id, :chunk_index, :content, :token_count, CAST(:embedding AS vector), CAST(:metadata AS jsonb))
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

    async def fulltext_search(
        self,
        query: str,
        tenant_id: uuid.UUID,
        scope: str = "ALL",
        category: str = "ALL",
        allowed_scopes: Optional[list[str]] = None,
        limit: int = 8,
    ) -> list[dict]:
        """
        PostgreSQL Full-Text Search (tsvector / plainto_tsquery) untuk domain teknis FTTH.
        Efektif menangkap istilah teknis, nomor model, kode CLI, dan kode alarm.
        Kombinasikan dengan similarity_search() via Reciprocal Rank Fusion (RRF) untuk akurasi maksimal.
        """
        # Sanitasi query: hilangkan karakter yang bisa merusak tsquery
        safe_query = " ".join(
            w for w in query.split()
            if w.isalnum() or any(c in w for c in "-_./")
        )[:200] or "ftth"

        scope_conditions = []
        params = {
            "query": safe_query,
            "tenant_id": str(tenant_id),
            "limit": limit,
        }

        if allowed_scopes and len(allowed_scopes) > 0:
            scope_conditions.append("d.scope = ANY(:allowed_scopes)")
            params["allowed_scopes"] = allowed_scopes
        elif scope and scope.upper() not in ("ALL", "GENERAL"):
            scope_conditions.append("(d.scope = :scope OR d.category = :scope)")
            params["scope"] = scope.upper()

        if category and category.upper() != "ALL":
            scope_conditions.append("d.category = :category")
            params["category"] = category.upper()

        extra_filter = ("AND " + " AND ".join(scope_conditions)) if scope_conditions else ""

        sql = text(f"""
            SELECT
                CAST(c.id AS text)           AS chunk_id,
                CAST(c.document_id AS text)  AS document_id,
                d.title                      AS document_title,
                d.category                   AS category,
                d.scope                      AS scope,
                c.chunk_index                AS chunk_index,
                c.content                    AS content,
                ts_rank_cd(
                    to_tsvector('simple', c.content),
                    plainto_tsquery('simple', :query)
                )                            AS similarity_score
            FROM ai_document_chunks c
            JOIN ai_documents d ON d.id = c.document_id
            WHERE
                c.tenant_id = :tenant_id
                AND d.tenant_id = :tenant_id
                AND d.status = 'INDEXED'
                {extra_filter}
                AND to_tsvector('simple', c.content) @@ plainto_tsquery('simple', :query)
            ORDER BY similarity_score DESC
            LIMIT :limit
        """)

        try:
            async with get_db_session() as session:
                result = await session.execute(sql, params)
                rows = result.mappings().fetchall()

            return [
                {
                    "chunk_id": str(r["chunk_id"]),
                    "document_id": str(r["document_id"]),
                    "title": r["document_title"],
                    "category": r["category"],
                    "scope": r.get("scope", "GLOBAL"),
                    "chunk_index": r["chunk_index"],
                    "content": r["content"],
                    "similarity_score": float(r["similarity_score"] or 0.0),
                }
                for r in rows
            ]
        except Exception as e:
            logger.warning(f"fulltext_search query error: {e}")
            return []


# Singleton instance
vector_store = VectorStore()
