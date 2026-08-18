"""
K2NET FTTH AI Gateway — Chat Session CRUD Routes
GET/POST/DELETE /api/v1/ai/sessions
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from app.api.dependencies import verify_gateway_and_tenant, TenantContext
from app.models.schemas import ChatSessionCreate, ChatSessionResponse, ChatMessageResponse
from app.db.session import get_db_session
import uuid
import logging

router = APIRouter(prefix="/api/v1/ai/sessions", tags=["AI Sessions"])
logger = logging.getLogger(__name__)


@router.get("", response_model=list[ChatSessionResponse])
async def list_sessions(
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """Ambil daftar sesi aktif (non-archived) milik user & tenant saat ini."""
    sql = text("""
        SELECT id, tenant_id, user_id, title, context_scope, model_used,
               is_archived, created_at, updated_at
        FROM ai_chat_sessions
        WHERE tenant_id = :tenant_id
          AND user_id   = :actor_id::uuid
          AND is_archived = FALSE
        ORDER BY updated_at DESC
        LIMIT 50
    """)
    try:
        actor_uuid = uuid.UUID(ctx.actor_id) if ctx.actor_id else None
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid actor_id UUID")

    async with get_db_session() as session:
        result = await session.execute(
            sql,
            {"tenant_id": str(ctx.tenant_id), "actor_id": str(actor_uuid)},
        )
        rows = result.mappings().all()

    return [ChatSessionResponse(**dict(row)) for row in rows]


@router.post("", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: ChatSessionCreate,
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """Buat sesi percakapan baru untuk user & tenant saat ini."""
    try:
        actor_uuid = uuid.UUID(ctx.actor_id) if ctx.actor_id else uuid.uuid4()
    except (ValueError, TypeError):
        actor_uuid = uuid.uuid4()

    session_id = uuid.uuid4()
    sql = text("""
        INSERT INTO ai_chat_sessions
            (id, tenant_id, user_id, title, context_scope, model_used)
        VALUES
            (:id, :tenant_id, :user_id, :title, :context_scope, :model_used)
        RETURNING id, tenant_id, user_id, title, context_scope, model_used,
                  is_archived, created_at, updated_at
    """)
    async with get_db_session() as session:
        result = await session.execute(
            sql,
            {
                "id": str(session_id),
                "tenant_id": str(ctx.tenant_id),
                "user_id": str(actor_uuid),
                "title": payload.title,
                "context_scope": payload.context_scope,
                "model_used": payload.model_used,
            },
        )
        row = result.mappings().fetchone()

    return ChatSessionResponse(**dict(row))


@router.get("/{session_id}/messages", response_model=list[ChatMessageResponse])
async def get_session_messages(
    session_id: uuid.UUID,
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """Ambil semua pesan dalam sesi (tenant-scoped)."""
    sql = text("""
        SELECT m.id, m.session_id, m.tenant_id, m.role, m.content,
               m.sources, m.tokens_used, m.latency_ms, m.created_at
        FROM ai_chat_messages m
        JOIN ai_chat_sessions s ON s.id = m.session_id
        WHERE m.session_id  = :session_id
          AND m.tenant_id   = :tenant_id    -- Isolasi mutlak
          AND s.tenant_id   = :tenant_id
        ORDER BY m.created_at ASC
        LIMIT 200
    """)
    async with get_db_session() as session:
        result = await session.execute(
            sql,
            {"session_id": str(session_id), "tenant_id": str(ctx.tenant_id)},
        )
        rows = result.mappings().all()

    return [ChatMessageResponse(**dict(row)) for row in rows]


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_session(
    session_id: uuid.UUID,
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """Archive (soft-delete) sesi percakapan (tenant-scoped)."""
    sql = text("""
        UPDATE ai_chat_sessions
        SET is_archived = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE id = :session_id AND tenant_id = :tenant_id
    """)
    async with get_db_session() as session:
        await session.execute(
            sql,
            {"session_id": str(session_id), "tenant_id": str(ctx.tenant_id)},
        )
