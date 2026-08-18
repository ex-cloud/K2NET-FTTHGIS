"""
K2NET FTTH AI Gateway — Document Upload & Indexing Route
POST /api/v1/ai/documents — Upload PDF/TXT/MD → Chunking → Embedding → pgvector
"""
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy import text
from app.api.dependencies import verify_gateway_and_tenant, TenantContext
from app.models.schemas import DocumentUploadResponse
from app.db.session import get_db_session
from app.db.vector_store import vector_store
from app.services.rag_retriever import DocumentChunker
from app.services.llm_engine import LLMEngine
from app.services.audit_client import audit_client
import uuid
import logging

router = APIRouter(prefix="/api/v1/ai/documents", tags=["AI Documents"])
logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/x-markdown",
}
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


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
    # ── Validasi file ────────────────────────────────────────────────────────
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

    # ── Log audit event (fire-and-forget) ────────────────────────────────────
    audit_client.log(
        tenant_id=ctx.tenant_id,
        actor_id=ctx.actor_id,
        action="AI_DOCUMENT_UPLOADED",
        resource_type="KNOWLEDGE_BASE",
        resource_id=title,
        log_group="OPERATIONS",
        metadata={"filename": file.filename, "size_bytes": len(file_bytes), "category": category},
    )

    # ── Simpan record dokumen ke DB dengan status PENDING ────────────────────
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

    # ── Jalankan proses indexing di background ───────────────────────────────
    background_tasks.add_task(
        _index_document,
        doc_id=doc_id,
        tenant_id=ctx.tenant_id,
        file_bytes=file_bytes,
        content_type=content_type,
    )

    return DocumentUploadResponse(**dict(row))


async def _index_document(
    doc_id: uuid.UUID,
    tenant_id: uuid.UUID,
    file_bytes: bytes,
    content_type: str,
) -> None:
    """
    Background task: Extract teks → chunk → generate embedding → simpan ke pgvector.
    """
    from app.core.config import settings

    logger.info(f"Starting indexing for doc_id={doc_id}, tenant={tenant_id}")

    try:
        # ── Update status ke PROCESSING ──────────────────────────────────────
        await vector_store.update_document_status(doc_id, tenant_id, "PROCESSING")

        # ── Ekstrak teks dari file ────────────────────────────────────────────
        raw_text = _extract_text(file_bytes, content_type)
        if not raw_text.strip():
            raise ValueError("Dokumen kosong atau tidak dapat dibaca.")

        # ── Chunking teks ─────────────────────────────────────────────────────
        chunker = DocumentChunker(
            chunk_size=settings.RAG_CHUNK_SIZE,
            overlap=settings.RAG_CHUNK_OVERLAP,
        )
        chunks = chunker.chunk_text(raw_text)
        logger.info(f"doc_id={doc_id}: {len(chunks)} chunks generated.")

        # ── Generate embedding & simpan ke pgvector ───────────────────────────
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

        # ── Update status ke INDEXED ──────────────────────────────────────────
        await vector_store.update_document_status(
            doc_id, tenant_id, "INDEXED", chunk_count=stored_count
        )
        logger.info(f"doc_id={doc_id}: Indexing complete ({stored_count}/{len(chunks)} chunks).")

    except Exception as e:
        logger.error(f"Indexing failed for doc_id={doc_id}: {e}")
        await vector_store.update_document_status(
            doc_id, tenant_id, "FAILED", error_message=str(e)
        )


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
        # TXT / Markdown
        for encoding in ["utf-8", "utf-16", "latin-1"]:
            try:
                return file_bytes.decode(encoding)
            except UnicodeDecodeError:
                continue
        return file_bytes.decode("utf-8", errors="replace")
