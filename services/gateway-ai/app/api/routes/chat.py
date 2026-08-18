"""
K2NET FTTH AI Gateway — Chat SSE Streaming Route
POST /api/v1/ai/chat/stream — Server-Sent Events real-time token streaming
Fitur: Redis Semantic Cache (< 10ms) + Hybrid Search RAG (pgvector + BM25 RRF) + Agent Thinking Events
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.api.dependencies import verify_gateway_and_tenant, TenantContext
from app.models.schemas import ChatStreamRequest
from app.services.llm_engine import LLMEngine
from app.services.rag_retriever import RAGRetriever
from app.services.semantic_cache import semantic_cache
from app.services.audit_client import audit_client
from sqlalchemy import text
import asyncio
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
    Pipeline:
      1. Redis Semantic Cache check (< 10ms jika cache HIT)
      2. Hybrid RAG Retrieval: pgvector Cosine + PostgreSQL BM25 FTS via RRF
      3. Agent Thinking Status Events (searching → retrieved → reasoning)
      4. LLM Token Streaming (Gemini / OpenAI / Local Ollama)
      5. Background: Store ke Semantic Cache + DB Session Log
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
        query_embedding = None

        try:
            # ── 1. Status: Generating embedding untuk cache check ──────────────
            yield f"data: {json.dumps({'type': 'status', 'stage': 'searching', 'message': 'Memindai basis pengetahuan & Redis cache...'})}\n\n"

            # ── 2. Generate embedding untuk query (digunakan ulang untuk cache + search) ──
            engine = LLMEngine(provider=provider, model=model_override)
            try:
                query_embedding = await engine.generate_embedding(payload.message)
            except Exception as emb_err:
                logger.warning(f"Embedding generation failed (cache check skip): {emb_err}")

            # ── 3. Cek Redis Semantic Cache ────────────────────────────────────
            if query_embedding:
                cached = await semantic_cache.get_cached_answer(
                    query_embedding=query_embedding,
                    tenant_id=str(ctx.tenant_id),
                    threshold=0.96,
                )
                if cached:
                    cached_content = cached["content"]
                    cached_sources = cached.get("sources", [])
                    similarity_pct = round(cached["similarity"] * 100, 1)
                    cache_age_s = int(time.time() - cached.get("cached_at", time.time()))

                    # Kirim sources dari cache
                    if cached_sources:
                        yield f"data: {json.dumps({'type': 'sources', 'sources': cached_sources, 'stage': 'cache_hit', 'message': f'Cache HIT ⚡ (similarity={similarity_pct}%)'})}\n\n"

                    yield f"data: {json.dumps({'type': 'status', 'stage': 'cached', 'message': f'Jawaban ditemukan di Redis Cache ⚡ (kesamaan={similarity_pct}%, usia={cache_age_s}s)'})}\n\n"

                    # Stream konten cache kata-per-kata untuk efek streaming alami
                    words = cached_content.split(" ")
                    for i, word in enumerate(words):
                        token = word + (" " if i < len(words) - 1 else "")
                        yield f"data: {json.dumps({'type': 'token', 'content': token, 'cached': True})}\n\n"
                        accumulated_content += token
                        if i % 8 == 0:  # Simulasi stream delay alami
                            await asyncio.sleep(0.003)

                    latency_ms = int((time.time() - start_time) * 1000)
                    yield f"data: {json.dumps({'type': 'usage', 'tokens': cached.get('tokens', 0), 'latency_ms': latency_ms, 'cache_hit': True})}\n\n"
                    yield f"data: {json.dumps({'type': 'done'})}\n\n"
                    return  # Selesai, tanpa memanggil LLM cloud

            # ── 4. Hybrid RAG Retrieval (Cache MISS – panggil pgvector + BM25 FTS) ─
            retriever = RAGRetriever(tenant_id=ctx.tenant_id, provider=provider)

            if query_embedding:
                # Gunakan embedding yang sudah di-generate (hemat 1 API call)
                contexts, sources, query_embedding = await retriever.retrieve_context_with_embedding(
                    query=payload.message,
                    query_embedding=query_embedding,
                    limit=4,
                    scope=payload.scope,
                )
            else:
                contexts, sources = await retriever.retrieve_context(
                    query=payload.message,
                    limit=4,
                    scope=payload.scope,
                )

            # ── 5. Kirim sources dan status ────────────────────────────────────
            if sources:
                # Deteksi metode pencarian untuk UI info
                methods = {s.get("search_method", "vector") for s in sources}
                method_label = "Hybrid RRF 🔀" if "hybrid" in methods else ("BM25 🔑" if "keyword" in methods else "pgvector 🧠")
                yield f"data: {json.dumps({'type': 'sources', 'sources': sources, 'stage': 'retrieved', 'message': f'Ditemukan {len(sources)} dokumen relevan [{method_label}]'})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'sources', 'sources': [], 'stage': 'general', 'message': 'Menggunakan penalaran internal model'})}\n\n"

            yield f"data: {json.dumps({'type': 'status', 'stage': 'reasoning', 'message': 'Menganalisis konteks & merumuskan solusi teknis...'})}\n\n"

            # ── 6. Stream token dari LLM ───────────────────────────────────────
            async for token in engine.stream_chat(
                user_message=payload.message,
                history=[msg.model_dump() for msg in payload.history],
                contexts=contexts,
                system_prompt=payload.system_prompt,
            ):
                accumulated_content += token
                total_tokens += len(token.split())
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

            # ── 7. Kirim usage metrics ─────────────────────────────────────────
            latency_ms = int((time.time() - start_time) * 1000)
            yield f"data: {json.dumps({'type': 'usage', 'tokens': total_tokens, 'latency_ms': latency_ms, 'cache_hit': False})}\n\n"

            # ── 8. Background: Simpan ke Redis Semantic Cache + DB session log ──
            if accumulated_content and query_embedding:
                asyncio.create_task(semantic_cache.store_answer(
                    query=payload.message,
                    query_embedding=query_embedding,
                    response=accumulated_content,
                    sources=sources,
                    tenant_id=str(ctx.tenant_id),
                    tokens=total_tokens,
                ))

            if payload.session_id:
                asyncio.create_task(_save_messages(
                    session_id=payload.session_id,
                    tenant_id=ctx.tenant_id,
                    user_message=payload.message,
                    assistant_message=accumulated_content,
                    sources=sources,
                    tokens_used=total_tokens,
                    latency_ms=latency_ms,
                ))

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
            "X-Accel-Buffering": "no",
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
                (:id1, :session_id, :tenant_id, 'user',      :user_msg,   '[]'::jsonb,     0,       0),
                (:id2, :session_id, :tenant_id, 'assistant', :assist_msg, :sources::jsonb, :tokens, :latency)
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
