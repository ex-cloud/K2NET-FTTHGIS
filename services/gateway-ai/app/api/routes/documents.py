"""
K2NET FTTH AI Gateway — Document Upload, Manual Entry, Listing & Server Sync
Endpoints:
- POST   /api/v1/ai/documents             Upload file (PDF, Markdown, TXT)
- POST   /api/v1/ai/documents/text        Manual text entry (SOP / Technical Note)
- GET    /api/v1/ai/documents             List indexed documents with search & filter
- DELETE /api/v1/ai/documents/{doc_id}    Delete document & vector embeddings
- POST   /api/v1/ai/documents/sync-server 1-Click Server Sync (/opt/project5/docs)
- GET    /api/v1/ai/documents/stats       Knowledge Base statistics
"""
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks, Query
from sqlalchemy import text
from app.api.dependencies import verify_gateway_and_tenant, TenantContext
from app.models.schemas import (
    DocumentUploadResponse,
    ManualDocumentCreate,
    DocumentUpdateRequest,
    DocumentApproveRequest,
    DocumentRejectRequest,
    DocumentDetailResponse,
    DocumentListResponse,
    DocumentItem,
    AiStatsResponse,
)
from app.db.session import get_db_session
from app.db.vector_store import vector_store
from app.services.rag_retriever import DocumentChunker
from app.services.llm_engine import LLMEngine
from app.services.audit_client import audit_client
from app.core.config import settings
import uuid
import logging
import os
import glob
from pathlib import Path
from typing import Optional

router = APIRouter(prefix="/api/v1/ai/documents", tags=["AI Documents & Knowledge Base"])
logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/x-markdown",
}
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB

# ─── Vendor & Device Tagging ──────────────────────────────────────────────────
# Otomatis mendeteksi vendor perangkat dari nama file & konten dokumen
VENDOR_PATTERNS: list[tuple[list[str], str]] = [
    (["zte", "c300", "c320", "c600", "c680", "an5516", "fiberhome", "fiber-home"], "FiberHome/ZTE"),
    (["huawei", "ma5800", "ma5600", "ma5608", "smartax"], "Huawei"),
    (["mikrotik", "routeros", "winbox", "chr"], "MikroTik"),
    (["cisco", "asr", "catalyst", "ios"], "Cisco"),
    (["unifi", "ubiquiti", "edgerouter"], "Ubiquiti"),
    (["gpon", "epon", "xgspon", "olt", "ont", "onu", "odp", "odc", "fsp", "splitter"], "FTTH-General"),
    (["postgres", "postgis", "pgvector", "spring", "keycloak", "kong", "traefik", "docker"], "System-Infra"),
]


def _extract_vendor(title: str, content: str) -> str:
    """Mendeteksi vendor/kategori perangkat dari judul dan isi dokumen (case-insensitive)."""
    combined = (title + " " + content[:500]).lower()
    for keywords, vendor_label in VENDOR_PATTERNS:
        if any(kw in combined for kw in keywords):
            return vendor_label
    return "General"


# ─── 1. List Documents ─────────────────────────────────────────────────────────

@router.get("", response_model=DocumentListResponse)
async def list_documents(
    category: Optional[str] = Query(None, description="Filter by category"),
    scope: Optional[str] = Query(None, description="Filter by scope: PLATFORM_INTERNAL | TENANT_INTERNAL | GLOBAL"),
    status: Optional[str] = Query(None, description="Filter by status: INDEXED | PENDING_REVIEW | DRAFT | REJECTED"),
    search: Optional[str] = Query(None, description="Search by title"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """Mengambil daftar seluruh dokumen pengetahuan di knowledge base tenant."""
    conditions = ["tenant_id = :tenant_id"]
    params: dict = {"tenant_id": str(ctx.tenant_id), "limit": limit, "offset": offset}

    if category and category.upper() != "ALL":
        conditions.append("category = :category")
        params["category"] = category.upper()

    if scope and scope.upper() != "ALL":
        conditions.append("scope = :scope")
        params["scope"] = scope.upper()

    if status and status.upper() != "ALL":
        conditions.append("status = :status")
        params["status"] = status.upper()

    if search:
        conditions.append("title ILIKE :search")
        params["search"] = f"%{search}%"

    where_clause = " AND ".join(conditions)

    count_sql = text(f"SELECT COUNT(*) FROM ai_documents WHERE {where_clause}")
    list_sql = text(f"""
        SELECT id, tenant_id, title, category, scope, file_name, file_size_bytes, mime_type,
               status, chunk_count, raw_content, error_message, created_at, updated_at
        FROM ai_documents
        WHERE {where_clause}
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """)

    async with get_db_session() as session:
        count_res = await session.execute(count_sql, params)
        total = count_res.scalar() or 0

        rows_res = await session.execute(list_sql, params)
        rows = rows_res.mappings().fetchall()

    return DocumentListResponse(
        total=total,
        documents=[DocumentItem(**dict(r)) for r in rows],
    )


# ─── 2. Knowledge Base Stats ──────────────────────────────────────────────────

@router.get("/stats", response_model=AiStatsResponse)
async def get_ai_stats(ctx: TenantContext = Depends(verify_gateway_and_tenant)):
    """Mengambil statistik dokumen terindeks, total chunk vektor, dan status LLM."""
    sql = text("""
        SELECT
            COUNT(*) AS total_docs,
            COALESCE(SUM(chunk_count), 0) AS total_chunks,
            COALESCE(SUM(file_size_bytes), 0) AS total_bytes
        FROM ai_documents
        WHERE tenant_id = :tenant_id
    """)

    db_ok = True
    total_docs = 0
    total_chunks = 0
    total_bytes = 0

    try:
        async with get_db_session() as session:
            res = await session.execute(sql, {"tenant_id": str(ctx.tenant_id)})
            row = res.mappings().fetchone()
            if row:
                total_docs = row["total_docs"]
                total_chunks = row["total_chunks"]
                total_bytes = row["total_bytes"]
    except Exception as e:
        logger.error(f"Stats query error: {e}")
        db_ok = False

    provider = settings.DEFAULT_LLM_PROVIDER
    if provider == "gemini":
        chat_model = settings.GEMINI_CHAT_MODEL
        emb_model = settings.GEMINI_EMBEDDING_MODEL
    elif provider in ("ollama", "local"):
        chat_model = settings.OLLAMA_CHAT_MODEL
        emb_model = settings.OLLAMA_EMBEDDING_MODEL
    else:
        chat_model = settings.OPENAI_CHAT_MODEL
        emb_model = settings.OPENAI_EMBEDDING_MODEL

    return AiStatsResponse(
        total_documents=total_docs,
        total_chunks=total_chunks,
        total_size_bytes=total_bytes,
        llm_provider=provider.upper(),
        embedding_model=emb_model,
        chat_model=chat_model,
        db_connected=db_ok,
    )


@router.get("/observability")
async def get_ai_observability(ctx: TenantContext = Depends(verify_gateway_and_tenant)):
    """
    Menyediakan metrik observabilitas lengkap AI Gateway:
    Redis Semantic Cache, pgvector HNSW, Hybrid Search & Provider Engine.
    """
    from app.services.semantic_cache import semantic_cache

    redis_ok = await semantic_cache.ping()
    cached_keys = 0
    if redis_ok:
        try:
            keys_res = await semantic_cache._execute_command("KEYS", f"ai:semcache:{ctx.tenant_id}:*")
            if isinstance(keys_res, list):
                cached_keys = len(keys_res)
        except Exception:
            pass

    cat_breakdown: dict = {}
    total_docs = 0
    total_chunks = 0
    total_bytes = 0
    try:
        async with get_db_session() as session:
            res = await session.execute(
                text("SELECT category, COUNT(*) as cnt FROM ai_documents WHERE tenant_id = :tenant_id GROUP BY category"),
                {"tenant_id": str(ctx.tenant_id)},
            )
            for row in res.mappings().fetchall():
                cat_breakdown[row["category"]] = row["cnt"]
                total_docs += row["cnt"]

            chunk_res = await session.execute(
                text("SELECT COALESCE(SUM(chunk_count), 0) as chunks, COALESCE(SUM(file_size_bytes), 0) as bytes FROM ai_documents WHERE tenant_id = :tenant_id"),
                {"tenant_id": str(ctx.tenant_id)},
            )
            c_row = chunk_res.mappings().fetchone()
            if c_row:
                total_chunks = c_row["chunks"]
                total_bytes = c_row["bytes"]
    except Exception as e:
        logger.error(f"Observability query error: {e}")

    provider = settings.DEFAULT_LLM_PROVIDER
    if provider == "gemini":
        chat_model = settings.GEMINI_CHAT_MODEL
        emb_model = settings.GEMINI_EMBEDDING_MODEL
    elif provider in ("ollama", "local"):
        chat_model = settings.OLLAMA_CHAT_MODEL
        emb_model = settings.OLLAMA_EMBEDDING_MODEL
    else:
        chat_model = settings.OPENAI_CHAT_MODEL
        emb_model = settings.OPENAI_EMBEDDING_MODEL

    return {
        "status": "HEALTHY" if redis_ok else "DEGRADED",
        "semantic_cache": {
            "enabled": True,
            "connected": redis_ok,
            "cached_entries": cached_keys,
            "similarity_threshold": 0.96,
            "ttl_seconds": 86400,
            "latency_ms": "< 10ms",
        },
        "search_engine": {
            "type": "Hybrid RRF (Reciprocal Rank Fusion)",
            "vector_backend": "PostgreSQL 17 pgvector (HNSW Cosine)",
            "keyword_backend": "PostgreSQL BM25 Full-Text Search (tsvector)",
            "rrf_k": 60,
            "embedding_dimension": settings.EMBEDDING_DIMENSION,
        },
        "knowledge_base": {
            "total_documents": total_docs,
            "total_chunks": total_chunks,
            "total_size_bytes": total_bytes,
            "categories": cat_breakdown,
        },
        "llm_engine": {
            "provider": provider.upper(),
            "chat_model": chat_model,
            "embedding_model": emb_model,
            "streaming": True,
        },
    }


# ─── 3. Upload File ───────────────────────────────────────────────────────────

# ─── 3. Upload File ───────────────────────────────────────────────────────────

@router.post("", response_model=DocumentUploadResponse, status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form(default="GENERAL"),
    scope: str = Form(default="GLOBAL"),
    auto_approve: bool = Form(default=True),
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    Upload dokumen SOP/Manual ke knowledge base tenant.
    Mendukung penentuan scope visibilitas (PLATFORM_INTERNAL, TENANT_INTERNAL, GLOBAL).
    """
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Tipe file tidak didukung: {content_type}. Gunakan PDF, TXT, atau Markdown.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Ukuran file melebihi batas maksimum 20 MB.",
        )

    # Ekstrak raw_content jika format teks/markdown
    raw_content_str = None
    if content_type in ("text/plain", "text/markdown", "text/x-markdown"):
        try:
            raw_content_str = file_bytes.decode("utf-8", errors="replace")
        except Exception:
            pass

    initial_status = "PENDING" if auto_approve else "PENDING_REVIEW"
    doc_id = uuid.uuid4()
    scope_val = scope.upper() if scope.upper() in ("PLATFORM_INTERNAL", "TENANT_INTERNAL", "GLOBAL") else "GLOBAL"

    audit_client.log(
        tenant_id=ctx.tenant_id,
        actor_id=ctx.actor_id,
        action="AI_DOCUMENT_UPLOADED",
        resource_type="KNOWLEDGE_BASE",
        resource_id=title,
        log_group="OPERATIONS",
        metadata={"filename": file.filename, "size_bytes": len(file_bytes), "category": category, "scope": scope_val, "status": initial_status},
    )

    sql = text("""
        INSERT INTO ai_documents
            (id, tenant_id, title, category, scope, file_name, file_size_bytes, mime_type,
             status, raw_content, created_by)
        VALUES
            (:id, :tenant_id, :title, :category, :scope, :file_name, :file_size,
             :mime_type, :status, :raw_content, :created_by)
        RETURNING id, tenant_id, title, category, scope, status, chunk_count, created_at
    """)
    async with get_db_session() as session:
        result = await session.execute(
            sql,
            {
                "id": str(doc_id),
                "tenant_id": str(ctx.tenant_id),
                "title": title,
                "category": category.upper(),
                "scope": scope_val,
                "file_name": file.filename,
                "file_size": len(file_bytes),
                "mime_type": content_type,
                "status": initial_status,
                "raw_content": raw_content_str,
                "created_by": ctx.actor_id,
            },
        )
        row = result.mappings().fetchone()

    if auto_approve:
        background_tasks.add_task(
            _index_document,
            doc_id=doc_id,
            tenant_id=ctx.tenant_id,
            file_bytes=file_bytes,
            content_type=content_type,
            scope=scope_val,
        )

    return DocumentUploadResponse(**dict(row))


# ─── 4. Manual Text Entry ─────────────────────────────────────────────────────

@router.post("/text", response_model=DocumentUploadResponse, status_code=201)
async def create_manual_document(
    payload: ManualDocumentCreate,
    background_tasks: BackgroundTasks,
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    Menyimpan dokumen SOP / Catatan Teknis secara langsung dari form teks UI.
    """
    raw_bytes = payload.content.encode("utf-8")
    doc_id = uuid.uuid4()
    scope_val = payload.scope if payload.scope in ("PLATFORM_INTERNAL", "TENANT_INTERNAL", "GLOBAL") else "GLOBAL"

    initial_status = "PENDING" if payload.auto_approve else ("DRAFT" if payload.is_draft else "PENDING_REVIEW")

    audit_client.log(
        tenant_id=ctx.tenant_id,
        actor_id=ctx.actor_id,
        action="AI_DOCUMENT_CREATED_MANUAL",
        resource_type="KNOWLEDGE_BASE",
        resource_id=payload.title,
        log_group="OPERATIONS",
        metadata={"title": payload.title, "category": payload.category, "scope": scope_val, "status": initial_status, "char_count": len(payload.content)},
    )

    sql = text("""
        INSERT INTO ai_documents
            (id, tenant_id, title, category, scope, file_name, file_size_bytes, mime_type,
             status, raw_content, created_by)
        VALUES
            (:id, :tenant_id, :title, :category, :scope, 'manual-entry.md', :file_size,
             'text/markdown', :status, :raw_content, :created_by)
        RETURNING id, tenant_id, title, category, scope, status, chunk_count, created_at
    """)
    async with get_db_session() as session:
        result = await session.execute(
            sql,
            {
                "id": str(doc_id),
                "tenant_id": str(ctx.tenant_id),
                "title": payload.title,
                "category": payload.category.upper(),
                "scope": scope_val,
                "file_size": len(raw_bytes),
                "status": initial_status,
                "raw_content": payload.content,
                "created_by": ctx.actor_id,
            },
        )
        row = result.mappings().fetchone()

    if payload.auto_approve:
        background_tasks.add_task(
            _index_document,
            doc_id=doc_id,
            tenant_id=ctx.tenant_id,
            file_bytes=raw_bytes,
            content_type="text/markdown",
            scope=scope_val,
        )

    return DocumentUploadResponse(**dict(row))


# ─── 5. Document Detail ───────────────────────────────────────────────────────

@router.get("/{doc_id}", response_model=DocumentDetailResponse)
async def get_document_detail(
    doc_id: uuid.UUID,
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """Mengambil informasi detail dokumen beserta isi teks markdown asli (raw_content)."""
    sql = text("""
        SELECT id, tenant_id, title, category, scope, file_name, file_size_bytes, mime_type,
               status, chunk_count, raw_content, error_message, created_by, created_at, updated_at
        FROM ai_documents
        WHERE id = :doc_id AND tenant_id = :tenant_id
    """)
    async with get_db_session() as session:
        result = await session.execute(sql, {"doc_id": str(doc_id), "tenant_id": str(ctx.tenant_id)})
        row = result.mappings().fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan.")

    return DocumentDetailResponse(**dict(row))


# ─── 6. Update / Edit Document ────────────────────────────────────────────────

@router.put("/{doc_id}", response_model=DocumentDetailResponse)
async def update_document(
    doc_id: uuid.UUID,
    payload: DocumentUpdateRequest,
    background_tasks: BackgroundTasks,
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    Mengubah metadata (judul, kategori, scope) atau isi konten Markdown dokumen.
    Jika status adalah INDEXED dan reindex=True, sistem otomatis melakukan re-vectorisasi.
    """
    # 1. Ambil dokumen existing
    async with get_db_session() as session:
        fetch_res = await session.execute(
            text("SELECT * FROM ai_documents WHERE id = :doc_id AND tenant_id = :tenant_id"),
            {"doc_id": str(doc_id), "tenant_id": str(ctx.tenant_id)},
        )
        existing = fetch_res.mappings().fetchone()

    if not existing:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan.")

    new_title = payload.title if payload.title is not None else existing["title"]
    new_category = payload.category.upper() if payload.category is not None else existing["category"]
    new_scope = payload.scope if payload.scope is not None else existing.get("scope", "GLOBAL")
    new_content = payload.content if payload.content is not None else existing.get("raw_content")
    new_status = payload.status if payload.status is not None else existing["status"]

    content_changed = payload.content is not None and payload.content != existing.get("raw_content")
    new_file_size = len(new_content.encode("utf-8")) if new_content else existing["file_size_bytes"]

    # 2. Update data master dokumen
    update_sql = text("""
        UPDATE ai_documents
        SET title = :title,
            category = :category,
            scope = :scope,
            raw_content = :raw_content,
            file_size_bytes = :file_size,
            status = :status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :doc_id AND tenant_id = :tenant_id
        RETURNING id, tenant_id, title, category, scope, file_name, file_size_bytes, mime_type,
                  status, chunk_count, raw_content, error_message, created_by, created_at, updated_at
    """)
    async with get_db_session() as session:
        res = await session.execute(
            update_sql,
            {
                "doc_id": str(doc_id),
                "tenant_id": str(ctx.tenant_id),
                "title": new_title,
                "category": new_category,
                "scope": new_scope,
                "raw_content": new_content,
                "file_size": new_file_size,
                "status": new_status,
            },
        )
        updated_row = res.mappings().fetchone()

    audit_client.log(
        tenant_id=ctx.tenant_id,
        actor_id=ctx.actor_id,
        action="AI_DOCUMENT_UPDATED",
        resource_type="KNOWLEDGE_BASE",
        resource_id=str(doc_id),
        log_group="OPERATIONS",
        metadata={"title": new_title, "category": new_category, "scope": new_scope, "content_changed": content_changed},
    )

    # 3. Trigger re-indexing jika dokumen berstatus INDEXED atau disetujui
    if (content_changed or payload.reindex) and new_status == "INDEXED" and new_content:
        # Hapus chunks lama terlebih dahulu
        async with get_db_session() as session:
            await session.execute(
                text("DELETE FROM ai_document_chunks WHERE document_id = :doc_id AND tenant_id = :tenant_id"),
                {"doc_id": str(doc_id), "tenant_id": str(ctx.tenant_id)},
            )
        background_tasks.add_task(
            _index_document,
            doc_id=doc_id,
            tenant_id=ctx.tenant_id,
            file_bytes=new_content.encode("utf-8"),
            content_type="text/markdown",
            scope=new_scope,
        )

    return DocumentDetailResponse(**dict(updated_row))


# ─── 7. Approve Document (Super Admin) ────────────────────────────────────────

@router.post("/{doc_id}/approve", response_model=DocumentUploadResponse)
async def approve_document(
    doc_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    payload: Optional[DocumentApproveRequest] = None,
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    Super Admin menyetujui dokumen pengetahuan (status -> INDEXED).
    Memicu proses embedding ke pgvector jika belum diindeks.
    """
    async with get_db_session() as session:
        fetch_res = await session.execute(
            text("SELECT * FROM ai_documents WHERE id = :doc_id AND tenant_id = :tenant_id"),
            {"doc_id": str(doc_id), "tenant_id": str(ctx.tenant_id)},
        )
        existing = fetch_res.mappings().fetchone()

    if not existing:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan.")

    final_scope = payload.scope if (payload and payload.scope) else existing.get("scope", "GLOBAL")

    update_sql = text("""
        UPDATE ai_documents
        SET status = 'INDEXED',
            scope = :scope,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :doc_id AND tenant_id = :tenant_id
        RETURNING id, tenant_id, title, category, scope, status, chunk_count, created_at
    """)
    async with get_db_session() as session:
        res = await session.execute(
            update_sql,
            {
                "doc_id": str(doc_id),
                "tenant_id": str(ctx.tenant_id),
                "scope": final_scope,
            },
        )
        updated_row = res.mappings().fetchone()

    audit_client.log(
        tenant_id=ctx.tenant_id,
        actor_id=ctx.actor_id,
        action="AI_DOCUMENT_APPROVED",
        resource_type="KNOWLEDGE_BASE",
        resource_id=str(doc_id),
        log_group="OPERATIONS",
        metadata={"title": existing["title"], "scope": final_scope},
    )

    # Jika belum ada chunk vektor, jalankan indeks dari raw_content
    if existing["chunk_count"] == 0 and existing.get("raw_content"):
        background_tasks.add_task(
            _index_document,
            doc_id=doc_id,
            tenant_id=ctx.tenant_id,
            file_bytes=existing["raw_content"].encode("utf-8"),
            content_type="text/markdown",
            scope=final_scope,
        )

    return DocumentUploadResponse(**dict(updated_row))


# ─── 8. Reject Document (Super Admin) ─────────────────────────────────────────

@router.post("/{doc_id}/reject", response_model=DocumentUploadResponse)
async def reject_document(
    doc_id: uuid.UUID,
    payload: Optional[DocumentRejectRequest] = None,
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    Super Admin menolak dokumen pengetahuan (status -> REJECTED).
    Menghapus vektor embedding dari pgvector jika sebelumnya ada.
    """
    reason = payload.reason if payload and payload.reason else "Dokumen ditolak oleh Super Admin."

    async with get_db_session() as session:
        # Hapus chunks
        await session.execute(
            text("DELETE FROM ai_document_chunks WHERE document_id = :doc_id AND tenant_id = :tenant_id"),
            {"doc_id": str(doc_id), "tenant_id": str(ctx.tenant_id)},
        )
        update_sql = text("""
            UPDATE ai_documents
            SET status = 'REJECTED',
                chunk_count = 0,
                error_message = :reason,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :doc_id AND tenant_id = :tenant_id
            RETURNING id, tenant_id, title, category, scope, status, chunk_count, created_at
        """)
        res = await session.execute(
            update_sql,
            {
                "doc_id": str(doc_id),
                "tenant_id": str(ctx.tenant_id),
                "reason": reason,
            },
        )
        updated_row = res.mappings().fetchone()

    if not updated_row:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan.")

    audit_client.log(
        tenant_id=ctx.tenant_id,
        actor_id=ctx.actor_id,
        action="AI_DOCUMENT_REJECTED",
        resource_type="KNOWLEDGE_BASE",
        resource_id=str(doc_id),
        log_group="OPERATIONS",
        metadata={"reason": reason},
    )

    return DocumentUploadResponse(**dict(updated_row))


# ─── 9. Simulate Search ───────────────────────────────────────────────────────

@router.post("/simulate-search")
async def simulate_vector_search(
    payload: dict,
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """Simulasi pencarian semantik vektor untuk inspeksi dan testing RAG secara visual di UI."""
    from app.services.rag_retriever import RAGRetriever

    query = payload.get("query", "")
    limit = int(payload.get("limit", 5))
    min_sim = float(payload.get("min_similarity", 0.1))
    scope = payload.get("scope", "GENERAL")

    if not query:
        return {"query": "", "total_matches": 0, "results": []}

    retriever = RAGRetriever(tenant_id=ctx.tenant_id)
    contexts, sources = await retriever.retrieve_context(
        query=query,
        limit=limit,
        scope=scope,
        min_similarity=min_sim,
    )
    return {
        "query": query,
        "total_matches": len(sources),
        "results": sources,
    }


# ─── 10. Delete Document ──────────────────────────────────────────────────────

@router.delete("/{doc_id}", status_code=200)
async def delete_document(
    doc_id: uuid.UUID,
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """Menghapus dokumen dan seluruh vektor embedding terkait di pgvector."""
    async with get_db_session() as session:
        # Hapus chunks terlebih dahulu
        await session.execute(
            text("DELETE FROM ai_document_chunks WHERE document_id = :doc_id AND tenant_id = :tenant_id"),
            {"doc_id": str(doc_id), "tenant_id": str(ctx.tenant_id)},
        )
        # Hapus master dokumen
        del_res = await session.execute(
            text("DELETE FROM ai_documents WHERE id = :doc_id AND tenant_id = :tenant_id RETURNING title"),
            {"doc_id": str(doc_id), "tenant_id": str(ctx.tenant_id)},
        )
        deleted_row = del_res.mappings().fetchone()

        if not deleted_row:
            raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan atau bukan milik tenant Anda.")

    audit_client.log(
        tenant_id=ctx.tenant_id,
        actor_id=ctx.actor_id,
        action="AI_DOCUMENT_DELETED",
        resource_type="KNOWLEDGE_BASE",
        resource_id=str(doc_id),
        log_group="OPERATIONS",
        metadata={"title": deleted_row["title"]},
    )

    return {"status": "ok", "message": f"Dokumen '{deleted_row['title']}' berhasil dihapus."}


# ─── 11. 1-Click Server Docs Sync ─────────────────────────────────────────────

@router.post("/sync-server", status_code=202)
async def sync_server_docs(
    background_tasks: BackgroundTasks,
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    1-Click Server Sync: Memindai folder /opt/project5/docs/ dan mengindeks
    seluruh file Markdown/TXT ke pgvector untuk tenant saat ini.
    """
    docs_base = os.getenv("DOCS_ROOT_PATH", "/opt/project5/docs")

    if not os.path.exists(docs_base):
        raise HTTPException(
            status_code=400,
            detail=f"Direktori dokumen server '{docs_base}' tidak ditemukan.",
        )

    background_tasks.add_task(
        _sync_all_server_docs,
        docs_dir=docs_base,
        tenant_id=ctx.tenant_id,
        actor_id=ctx.actor_id,
    )

    return {
        "status": "QUEUED",
        "message": "Sinkronisasi direktori server /opt/project5/docs telah dipicu di latar belakang.",
    }


# ─── Internal Background Indexing Helpers ─────────────────────────────────────

async def _index_document(
    doc_id: uuid.UUID,
    tenant_id: uuid.UUID,
    file_bytes: bytes,
    content_type: str,
    scope: str = "GLOBAL",
) -> None:
    """Ekstrak teks → chunk → embedding → simpan ke pgvector."""
    logger.info(f"Indexing started for doc_id={doc_id}, tenant={tenant_id}, scope={scope}")
    try:
        await vector_store.update_document_status(doc_id, tenant_id, "PROCESSING")
        raw_text = _extract_text(file_bytes, content_type)
        if not raw_text.strip():
            raise ValueError("Dokumen kosong atau tidak dapat dibaca.")

        chunker = DocumentChunker(
            chunk_size=settings.RAG_CHUNK_SIZE,
            overlap=settings.RAG_CHUNK_OVERLAP,
        )
        chunks = chunker.chunk_text(raw_text)

        engine = LLMEngine()
        stored_count = 0
        vendor = _extract_vendor(raw_text, raw_text)
        for i, chunk_text in enumerate(chunks):
            try:
                embedding = await engine.generate_embedding(chunk_text)
                token_count = chunker.count_tokens(chunk_text)
                await vector_store.store_chunk(
                    document_id=doc_id,
                    tenant_id=tenant_id,
                    chunk_index=i,
                    content=chunk_text,
                    token_count=token_count,
                    embedding=embedding,
                    metadata={"chunk_index": i, "total_chunks": len(chunks), "vendor": vendor, "scope": scope},
                )
                stored_count += 1
            except Exception as chunk_err:
                logger.error(f"Chunk {i} error: {chunk_err}")

        await vector_store.update_document_status(
            doc_id, tenant_id, "INDEXED", chunk_count=stored_count
        )
        logger.info(f"doc_id={doc_id} complete ({stored_count}/{len(chunks)} chunks).")

    except Exception as e:
        logger.error(f"Indexing failed for doc_id={doc_id}: {e}")
        await vector_store.update_document_status(
            doc_id, tenant_id, "FAILED", error_message=str(e)
        )


async def _sync_all_server_docs(docs_dir: str, tenant_id: uuid.UUID, actor_id: Optional[str]) -> None:
    """Memindai seluruh subfolder /opt/project5/docs dan mengindeks per kategori."""
    category_mapping = {
        "01_Architecture": "ARCHITECTURE",
        "02_SOP_Troubleshooting": "TROUBLESHOOTING",
        "03_Infrastructure": "INFRASTRUCTURE",
        "04_GIS_Mapping": "GIS_MANUAL",
        "05_Plans_Roadmap": "PLANS",
        "Server": "PLANS",
    }

    files = glob.glob(os.path.join(docs_dir, "**/*.md"), recursive=True)
    files.extend(glob.glob(os.path.join(docs_dir, "**/*.txt"), recursive=True))

    logger.info(f"[Server Sync] Found {len(files)} files in {docs_dir}")
    engine = LLMEngine()
    chunker = DocumentChunker(chunk_size=settings.RAG_CHUNK_SIZE, overlap=settings.RAG_CHUNK_OVERLAP)

    for file_path in files:
        rel_path = os.path.relpath(file_path, docs_dir)
        top_folder = rel_path.split(os.sep)[0] if os.sep in rel_path else "GENERAL"
        category = category_mapping.get(top_folder, "GENERAL")
        title = Path(file_path).stem.replace("-", " ").replace("_", " ").title()

        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read().strip()

            if len(content) < 10:
                continue

            # Tentukan scope otomatis berdasarkan kategori folder
            if category in ("INFRASTRUCTURE", "ARCHITECTURE", "PLANS"):
                scope_val = "PLATFORM_INTERNAL"
            elif category in ("TROUBLESHOOTING",):
                scope_val = "TENANT_INTERNAL"
            else:
                scope_val = "GLOBAL"

            doc_id = uuid.uuid4()
            async with get_db_session() as session:
                # Cek apakah file sudah ada
                check = await session.execute(
                    text("SELECT id FROM ai_documents WHERE tenant_id = :tenant_id AND file_name = :fn"),
                    {"tenant_id": str(tenant_id), "fn": rel_path},
                )
                existing = check.scalar()
                if existing:
                    continue

                await session.execute(
                    text("""
                        INSERT INTO ai_documents
                            (id, tenant_id, title, category, scope, file_name, file_size_bytes, mime_type, status, raw_content, created_by)
                        VALUES
                            (:id, :tenant_id, :title, :category, :scope, :fn, :size, 'text/markdown', 'PROCESSING', :raw_content, :actor)
                    """),
                    {
                        "id": str(doc_id),
                        "tenant_id": str(tenant_id),
                        "title": title,
                        "category": category,
                        "scope": scope_val,
                        "fn": rel_path,
                        "size": len(content.encode("utf-8")),
                        "raw_content": content,
                        "actor": actor_id or "system-sync",
                    },
                )

            chunks = chunker.chunk_text(content)
            vendor = _extract_vendor(title, content)
            stored_count = 0
            for i, chunk_text in enumerate(chunks):
                try:
                    embedding = await engine.generate_embedding(chunk_text)
                    token_count = chunker.count_tokens(chunk_text)
                    await vector_store.store_chunk(
                        document_id=doc_id,
                        tenant_id=tenant_id,
                        chunk_index=i,
                        content=chunk_text,
                        token_count=token_count,
                        embedding=embedding,
                        metadata={"source_file": rel_path, "chunk_index": i, "total_chunks": len(chunks), "vendor": vendor, "scope": scope_val},
                    )
                    stored_count += 1
                except Exception as ce:
                    logger.warning(f"Failed chunk {i} for {rel_path}: {ce}")

            await vector_store.update_document_status(doc_id, tenant_id, "INDEXED", chunk_count=stored_count)
            logger.info(f"[Server Sync] Indexed {title} ({stored_count} chunks)")

        except Exception as fe:
            logger.error(f"[Server Sync] Failed to process {rel_path}: {fe}")


def _extract_text(file_bytes: bytes, content_type: str) -> str:
    """Ekstrak raw text dari file bytes berdasarkan MIME type."""
    if content_type == "application/pdf":
        import io
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        return "\n\n".join(
            page.extract_text() or "" for page in reader.pages
        )
    else:
        for encoding in ["utf-8", "utf-16", "latin-1"]:
            try:
                return file_bytes.decode(encoding)
            except UnicodeDecodeError:
                continue
        return file_bytes.decode("utf-8", errors="replace")
