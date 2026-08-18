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


# ─── 1. List Documents ─────────────────────────────────────────────────────────

@router.get("", response_model=DocumentListResponse)
async def list_documents(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by title"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """Mengambil daftar seluruh dokumen pengetahuan di knowledge base tenant."""
    conditions = ["tenant_id = :tenant_id"]
    params: dict = {"tenant_id": str(ctx.tenant_id), "limit": limit, "offset": offset}

    if category:
        conditions.append("category = :category")
        params["category"] = category.upper()

    if search:
        conditions.append("title ILIKE :search")
        params["search"] = f"%{search}%"

    where_clause = " AND ".join(conditions)

    count_sql = text(f"SELECT COUNT(*) FROM ai_documents WHERE {where_clause}")
    list_sql = text(f"""
        SELECT id, tenant_id, title, category, file_name, file_size_bytes, mime_type,
               status, chunk_count, error_message, created_at, updated_at
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
    chat_model = settings.GEMINI_CHAT_MODEL if provider == "gemini" else settings.OPENAI_CHAT_MODEL
    emb_model = settings.GEMINI_EMBEDDING_MODEL if provider == "gemini" else settings.OPENAI_EMBEDDING_MODEL

    return AiStatsResponse(
        total_documents=total_docs,
        total_chunks=total_chunks,
        total_size_bytes=total_bytes,
        llm_provider=provider.upper(),
        embedding_model=emb_model,
        chat_model=chat_model,
        db_connected=db_ok,
    )


# ─── 3. Upload File ───────────────────────────────────────────────────────────

@router.post("", response_model=DocumentUploadResponse, status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form(default="GENERAL"),
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    Upload dokumen SOP/Manual ke knowledge base tenant.
    Proses indexing (chunking + embedding) berjalan sebagai background task.
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
            detail=f"Ukuran file melebihi batas maksimum 20 MB.",
        )

    audit_client.log(
        tenant_id=ctx.tenant_id,
        actor_id=ctx.actor_id,
        action="AI_DOCUMENT_UPLOADED",
        resource_type="KNOWLEDGE_BASE",
        resource_id=title,
        log_group="OPERATIONS",
        metadata={"filename": file.filename, "size_bytes": len(file_bytes), "category": category},
    )

    doc_id = uuid.uuid4()
    sql = text("""
        INSERT INTO ai_documents
            (id, tenant_id, title, category, file_name, file_size_bytes, mime_type,
             status, created_by)
        VALUES
            (:id, :tenant_id, :title, :category, :file_name, :file_size,
             :mime_type, 'PENDING', :created_by)
        RETURNING id, tenant_id, title, category, status, chunk_count, created_at
    """)
    async with get_db_session() as session:
        result = await session.execute(
            sql,
            {
                "id": str(doc_id),
                "tenant_id": str(ctx.tenant_id),
                "title": title,
                "category": category.upper(),
                "file_name": file.filename,
                "file_size": len(file_bytes),
                "mime_type": content_type,
                "created_by": ctx.actor_id,
            },
        )
        row = result.mappings().fetchone()

    background_tasks.add_task(
        _index_document,
        doc_id=doc_id,
        tenant_id=ctx.tenant_id,
        file_bytes=file_bytes,
        content_type=content_type,
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

    audit_client.log(
        tenant_id=ctx.tenant_id,
        actor_id=ctx.actor_id,
        action="AI_DOCUMENT_CREATED_MANUAL",
        resource_type="KNOWLEDGE_BASE",
        resource_id=payload.title,
        log_group="OPERATIONS",
        metadata={"title": payload.title, "category": payload.category, "char_count": len(payload.content)},
    )

    sql = text("""
        INSERT INTO ai_documents
            (id, tenant_id, title, category, file_name, file_size_bytes, mime_type,
             status, created_by)
        VALUES
            (:id, :tenant_id, :title, :category, 'manual-entry.md', :file_size,
             'text/markdown', 'PENDING', :created_by)
        RETURNING id, tenant_id, title, category, status, chunk_count, created_at
    """)
    async with get_db_session() as session:
        result = await session.execute(
            sql,
            {
                "id": str(doc_id),
                "tenant_id": str(ctx.tenant_id),
                "title": payload.title,
                "category": payload.category.upper(),
                "file_size": len(raw_bytes),
                "created_by": ctx.actor_id,
            },
        )
        row = result.mappings().fetchone()

    background_tasks.add_task(
        _index_document,
        doc_id=doc_id,
        tenant_id=ctx.tenant_id,
        file_bytes=raw_bytes,
        content_type="text/markdown",
    )

    return DocumentUploadResponse(**dict(row))


# ─── 5. Delete Document ───────────────────────────────────────────────────────

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


# ─── 6. 1-Click Server Docs Sync ──────────────────────────────────────────────

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
        "status": "accepted",
        "message": "Sinkronisasi folder server docs telah dimulai di latar belakang.",
    }


# ─── Internal Background Indexing Helpers ─────────────────────────────────────

async def _index_document(
    doc_id: uuid.UUID,
    tenant_id: uuid.UUID,
    file_bytes: bytes,
    content_type: str,
) -> None:
    """Ekstrak teks → chunk → embedding → simpan ke pgvector."""
    logger.info(f"Indexing started for doc_id={doc_id}, tenant={tenant_id}")
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
                    metadata={"chunk_index": i, "total_chunks": len(chunks)},
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

            doc_id = uuid.uuid4()
            async with get_db_session() as session:
                # Cek apakah judul dokumen sudah ada, jika ada skip atau update
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
                            (id, tenant_id, title, category, file_name, file_size_bytes, mime_type, status, created_by)
                        VALUES
                            (:id, :tenant_id, :title, :category, :fn, :size, 'text/markdown', 'PROCESSING', :actor)
                    """),
                    {
                        "id": str(doc_id),
                        "tenant_id": str(tenant_id),
                        "title": title,
                        "category": category,
                        "fn": rel_path,
                        "size": len(content.encode("utf-8")),
                        "actor": actor_id or "system-sync",
                    },
                )

            chunks = chunker.chunk_text(content)
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
                        metadata={"source_file": rel_path, "chunk_index": i, "total_chunks": len(chunks)},
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
