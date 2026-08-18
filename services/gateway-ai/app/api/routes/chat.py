"""
K2NET FTTH AI Gateway — Chat SSE Streaming Route
POST /api/v1/ai/chat/stream — Server-Sent Events real-time token streaming
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.api.dependencies import verify_gateway_and_tenant, TenantContext
from app.models.schemas import ChatStreamRequest
from app.services.llm_engine import LLMEngine
from app.services.rag_retriever import RAGRetriever
from app.services.audit_client import audit_client
from sqlalchemy import text
import json
import logging
import time

router = APIRouter(prefix="/api/v1/ai", tags=["AI Chat"])
logger = logging.getLogger(__name__)


@router.post("/chat/stream")
async def stream_chat_response(
    payload: ChatStreamRequest,
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    SSE Streaming endpoint — mengalirkan token LLM kata-demi-kata ke browser.
    """
    start_time = time.time()

    # Log audit event (fire-and-forget)
    audit_client.log(
        tenant_id=ctx.tenant_id,
        actor_id=ctx.actor_id,
        action="AI_CHAT_QUERY",
        resource_type="AI_ASSISTANT",
        resource_id=str(payload.session_id) if payload.session_id else None,
        log_group="OPERATIONS",
        metadata={"scope": payload.scope, "model": payload.model or "default"},
    )

    # Tentukan model override jika ada
    provider = None
    model_override = payload.model or None
    if model_override:
        m_lower = model_override.lower()
        if "gemini" in m_lower:
            provider = "gemini"
        elif "llama" in m_lower or "deepseek" in m_lower or "ollama" in m_lower or "qwen" in m_lower:
            provider = "ollama"
        elif "gpt" in m_lower or "openai" in m_lower or "o1" in m_lower or "o3" in m_lower:
            provider = "openai"
        else:
            provider = "ollama"

    async def event_generator():
        total_tokens = 0
        accumulated_content = ""

        try:
            # ── 1. RAG Retrieval (Konteks Knowledge Base, Terisolasi per Tenant) ──
            retriever = RAGRetriever(tenant_id=ctx.tenant_id, provider=provider)
            contexts, sources = await retriever.retrieve_context(
                query=payload.message,
                limit=4,
                scope=payload.scope,
            )

            # ── 2. Kirim metadata sumber sitasi ke client ──────────────────────
            if sources:
                yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

            # ── 3. Stream token dari LLM ───────────────────────────────────────
            engine = LLMEngine(provider=provider, model=model_override)
            async for token in engine.stream_chat(
                user_message=payload.message,
                history=[msg.model_dump() for msg in payload.history],
                contexts=contexts,
                system_prompt=payload.system_prompt,
            ):
                accumulated_content += token
                total_tokens += len(token.split())
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

            # ── 4. Kirim usage metrics ─────────────────────────────────────────
            latency_ms = int((time.time() - start_time) * 1000)
            yield f"data: {json.dumps({'type': 'usage', 'tokens': total_tokens, 'latency_ms': latency_ms})}\n\n"

            # ── 5. Simpan pesan ke database (session history) ──────────────────
            if payload.session_id:
                await _save_messages(
                    session_id=payload.session_id,
                    tenant_id=ctx.tenant_id,
                    user_message=payload.message,
                    assistant_message=accumulated_content,
                    sources=sources,
                    tokens_used=total_tokens,
                    latency_ms=latency_ms,
                )

        except Exception as e:
            logger.error(f"SSE stream error for tenant={ctx.tenant_id}: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        finally:
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Mencegah buffering di Traefik/Nginx
            "Access-Control-Allow-Origin": "*",
        },
    )


async def _save_messages(
    session_id,
    tenant_id,
    user_message: str,
    assistant_message: str,
    sources: list,
    tokens_used: int,
    latency_ms: int,
) -> None:
    """Simpan pasangan pesan user + assistant ke database secara async."""
    from app.db.session import get_db_session
    import uuid as _uuid

    try:
        sql = text("""
            INSERT INTO ai_chat_messages
                (id, session_id, tenant_id, role, content, sources, tokens_used, latency_ms)
            VALUES
                (:id1, :session_id, :tenant_id, 'user',      :user_msg,      '[]'::jsonb,    0, 0),
                (:id2, :session_id, :tenant_id, 'assistant', :assist_msg,    :sources::jsonb, :tokens, :latency)
        """)
        import json as _json
        async with get_db_session() as session:
            await session.execute(
                sql,
                {
                    "id1": str(_uuid.uuid4()),
                    "id2": str(_uuid.uuid4()),
                    "session_id": str(session_id),
                    "tenant_id": str(tenant_id),
                    "user_msg": user_message,
                    "assist_msg": assistant_message,
                    "sources": _json.dumps(sources),
                    "tokens": tokens_used,
                    "latency": latency_ms,
                },
            )
    except Exception as e:
        logger.warning(f"Failed to save chat messages to DB (non-critical): {e}")
