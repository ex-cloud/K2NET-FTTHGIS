"""
K2NET FTTH AI Gateway — Chat SSE Streaming Route
POST /api/v1/ai/chat/stream — Server-Sent Events real-time token streaming
Fitur: Redis Semantic Cache (< 10ms) + Hybrid Search RAG (pgvector + BM25 RRF) + Agent Thinking Events
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.api.dependencies import verify_gateway_and_tenant, TenantContext
from app.models.schemas import ChatStreamRequest, SopGenerateRequest
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

            # ── 5.5. Injeksi Guardrail Keamanan & Isolasi Scope ─────────────────
            active_system_prompt = payload.system_prompt or ""
            if payload.user_scope == "TENANT":
                active_system_prompt += (
                    "\n\n[ATURAN ISOLASI TENANT & ANTI-KEBOCORAN DATA]\n"
                    "Anda adalah K2 Agent untuk Partner Tenant ISP. Anda DILARANG KERAS mengungkapkan informasi infrastruktur internal server platform K2NET "
                    "(seperti topologi Docker container, konfigurasi Kong API Gateway, MinIO S3 credentials, port internal 5001-5012, direktori server /opt/project5, atau root credentials) "
                    "maupun data milik tenant lain. Fokuskan bantuan Anda secara eksklusif pada operasional perangkat OLT lokal, peta ODP, pelanggan, dan penagihan milik tenant ini."
                )
            if payload.access_tier == "READ_ONLY":
                active_system_prompt += (
                    "\n\n[BATASAN MODE READ-ONLY]\n"
                    "Akun Anda saat ini berada dalam mode otorisasi 'Read-Only'. Anda HANYA diizinkan memberikan analisis, membaca dokumen SOP, dan menjelaskan informasi teknis. "
                    "Jika pengguna meminta Anda untuk mengeksekusi aksi modifikasi (seperti reboot port OLT, membuat tiket, atau mengubah data), tolak dengan sopan dan jelaskan "
                    "bahwa pengguna dapat mengaktifkan izin eksekusi melalui menu 'Configure permissions'."
                )

            # ── 6. Stream token dari LLM ───────────────────────────────────────
            async for token in engine.stream_chat(
                user_message=payload.message,
                history=[msg.model_dump() for msg in payload.history],
                contexts=contexts,
                system_prompt=active_system_prompt if active_system_prompt else None,
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
        try:
            target_sid = _uuid.UUID(str(session_id))
        except Exception:
            target_sid = _uuid.uuid5(_uuid.NAMESPACE_DNS, str(session_id))

        import json as _json
        async with get_db_session() as session:
            # Pastikan parent session ada di ai_chat_sessions untuk memenuhi FK constraint
            await session.execute(
                text("""
                    INSERT INTO ai_chat_sessions (id, tenant_id, user_id, title, created_at, updated_at)
                    VALUES (:sid, :tid, 'system', :title, NOW(), NOW())
                    ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
                """),
                {
                    "sid": str(target_sid),
                    "tid": str(tenant_id),
                    "title": user_message[:50],
                }
            )

            await session.execute(
                sql,
                {
                    "id1": str(_uuid.uuid4()),
                    "id2": str(_uuid.uuid4()),
                    "session_id": str(target_sid),
                    "tenant_id": str(tenant_id),
                    "user_msg": user_message,
                    "assist_msg": assistant_message,
                    "sources": _json.dumps(sources),
                    "tokens": tokens_used,
                    "latency": latency_ms,
                },
            )

            # Log to ai_query_analytics for Trending Topics aggregation
            normalized = user_message.strip()[:100]
            analytics_sql = text("""
                INSERT INTO ai_query_analytics 
                    (id, tenant_id, query_text, normalized_topic, response_time_ms, created_at)
                VALUES 
                    (:aid, :tenant_id, :query, :topic, :resp_time, NOW())
            """)
            await session.execute(
                analytics_sql,
                {
                    "aid": str(_uuid.uuid4()),
                    "tenant_id": str(tenant_id) if tenant_id else None,
                    "query": user_message,
                    "topic": normalized,
                    "resp_time": latency_ms,
                }
            )
    except Exception as e:
        logger.warning(f"Failed to save chat messages or analytics to DB (non-critical): {e}")


# ─── Domain Knowledge Context Guidelines ───────────────────────────────────────
CATEGORY_DOMAIN_CONTEXTS: dict[str, str] = {
    "GIS_MANUAL": (
        "STANDAR BAKU PEMETAAN FTTH & GIS (K2NET):\n"
        "- Konvensi Penamaan Aset (Naming Convention):\n"
        "  * OLT: OLT-<KODE_KOTA>-<SITE_NOC>-<NO_RACK> (Contoh: OLT-JKT-SBY01-01)\n"
        "  * ODC / FDT: ODC-<KAPASITAS_CORE>-<AREA_KODE>-<NO_URUT> (Contoh: ODC-144-KLG-001)\n"
        "  * ODP: ODP-<TIPE_SPLITTER>-<PARENT_ODC>-<NO_ODP> (Contoh: ODP-SOLID-KLG01-08)\n"
        "  * Joint Closure (FJC): FJC-<CORE>-<RUTE>-<NO_CLOSURE> (Contoh: FJC-24-RUT01-002)\n"
        "  * Drop Cable: DC-<PARENT_ODP>-<PORT_NO>-<ID_PELANGGAN>\n"
        "  * Tiang / Pole: POL-<PROVIDER>-<AREA>-<NO_TIANG>\n"
        "- Geospasial: Proyeksi EPSG:4326 (WGS84 Lat/Long), toleransi deviasi GPS < 3 meter.\n"
        "- Evidence & QA: Foto open-box splitter, closed-box, tagging label QR fisik, dan tracing jalur kabel optik."
    ),
    "TROUBLESHOOTING": (
        "STANDAR OPTIK & TROUBLESHOOTING GPON (ITU-T G.984):\n"
        "- Link Budget GPON:\n"
        "  * Transmit Power OLT (Class B+/C+): +1.5 dBm s/d +7.0 dBm\n"
        "  * Receiver Sensitivity ONT: -8.0 dBm s/d -28.0 dBm\n"
        "  * Redaman Ideal Operasional (Drop to ONT): -15.0 dBm s/d -22.0 dBm\n"
        "  * Batas Kritis / Redaman Drop: Maksimal -27.0 dBm (Redaman > -27 dBm = Wajib Perbaikan)\n"
        "  * Standar Redaman Splitter: 1:2 (~3.5 dB), 1:4 (~7.2 dB), 1:8 (~10.5 dB), 1:16 (~13.8 dB), 1:32 (~17.0 dB), 1:64 (~20.5 dB)\n"
        "  * Redaman Fusion Splicing: Maksimal 0.05 dB per titik sambung.\n"
        "- Alarm Kritis: LOS (Loss of Signal), Dying Gasp (Power Outage ONT), High Optical Power, Rogues ONT."
    ),
    "NETWORK_CONFIG": (
        "STANDAR KONFIGURASI PERANGKAT JARINGAN FTTH:\n"
        "- Vendor OLT: ZTE C300/C320/C600, Huawei MA5608T/MA5800, FiberHome AN5516.\n"
        "- Profiling: VLAN Management, VLAN Internet (PPPoE/IPoE), VLAN IPTV/VoIP, T-CONT & GEM Port, DBA profile, Traffic Table QoS, dan CLI ONT provisioning."
    ),
    "INFRASTRUCTURE": (
        "STANDAR INFRASTRUKTUR & DEVOPS PLATFORM K2NET:\n"
        "- Stack: Docker Compose, Traefik v3 Proxy, Kong API Gateway (DB-less), PostgreSQL 17 + PostGIS + pgvector, MinIO S3, Keycloak 26 IAM, Redis Cache, Go Gateways, Spring Boot.\n"
        "- Backup 3-Layer: Local Storage (/opt/project5/backups), MinIO S3, Offsite Nextcloud WebDAV."
    ),
    "PLANS": (
        "STANDAR PERENCANAAN JARINGAN & ROADMAP:\n"
        "- Feasibility Study, Bill of Quantity (BOQ), penentuan Homepass, rasio utilisasi port ODP, core allocation feeder & distribution, mitigasi perizinan jalur publik."
    ),
    "GENERAL": (
        "STANDAR OPERASIONAL UMUM & TIKET:\n"
        "- Manajemen Tiket Gangguan, SLA Penanganan (Critical < 2 Jam, Major < 4 Jam, Minor < 24 Jam), tata tertib teknisi, administrasi Berita Acara Serah Terima (BAST)."
    ),
}

SCOPE_DOMAIN_CONTEXTS: dict[str, str] = {
    "PLATFORM_INTERNAL": "OTORITAS: Platform Super Admin (Arsitektur platform internal K2NET, orkestrasi server, multi-tenant isolation, database PostGIS, Kong & Keycloak IAM).",
    "TENANT_INTERNAL": "OTORITAS: Mitra ISP / Tenant Internal (Operasional teknis NOC & Teknisi Lapangan ISP: konfigurasi OLT, penataan ODC/ODP, redaman drop, splicing fiber, survey lapangan).",
    "GLOBAL": "OTORITAS: Publik / Global (Panduan operasional umum, tata cara penggunaan sistem GIS, pelaporan tiket gangguan).",
}


# ─── Dedicated SOP Generator Route (RAG + Synthesis) ───────────────────────────
@router.post("/generate-sop/stream")
async def stream_sop_generation(
    payload: SopGenerateRequest,
    ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    Dedicated SOP Generator Streaming Endpoint:
    1. Melakukan RAG Retrieval dari Knowledge Base server (pgvector + BM25 FTS).
    2. Menggabungkan konteks internal K2NET dengan standar telekomunikasi FTTH internasional (ITU-T G.984/G.987, TIA/EIA-598-C).
    3. Menghilangkan redundansi dan melengkapi kekurangan data teknis.
    4. Mengalirkan draf dokumen Markdown terstruktur 7 bab via SSE real-time.
    """
    start_time = time.time()

    audit_client.log(
        tenant_id=ctx.tenant_id,
        actor_id=ctx.actor_id,
        action="AI_SOP_GENERATE",
        resource_type="AI_KNOWLEDGE_BASE",
        resource_id=payload.title,
        log_group="OPERATIONS",
        metadata={"category": payload.category, "scope": payload.scope},
    )

    provider = None
    model_override = payload.model or None
    if model_override:
        m_lower = model_override.lower()
        if "gemini" in m_lower:
            provider = "gemini"
        elif "gpt" in m_lower or "openai" in m_lower:
            provider = "openai"
        elif "deepseek" in m_lower:
            provider = "deepseek"
        else:
            provider = "ollama"

    async def sop_event_generator():
        total_tokens = 0
        try:
            # ── 1. Status: Memindai Knowledge Base Internal Server K2NET ─────────
            yield f"data: {json.dumps({'type': 'status', 'stage': 'searching', 'message': f'Memindai Knowledge Base server untuk topik: {payload.title}...' })}\n\n"

            # ── 2. Hybrid RAG Retrieval dari database pgvector + BM25 ───────────
            retriever = RAGRetriever(tenant_id=ctx.tenant_id, provider=provider)
            search_query = f"{payload.title} {payload.category} {payload.scope} FTTH GIS K2NET standard operational procedure"
            
            contexts, sources = await retriever.retrieve_context(
                query=search_query,
                limit=6,
                scope=payload.scope if payload.scope != "GLOBAL" else "GENERAL",
                category=payload.category if payload.category != "GENERAL" else "ALL",
            )

            if sources:
                yield f"data: {json.dumps({'type': 'sources', 'sources': sources, 'stage': 'retrieved', 'message': f'Ditemukan {len(sources)} dokumen referensi internal server K2NET' })}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'sources', 'sources': [], 'stage': 'synthesizing', 'message': 'Menghubungkan standar telekomunikasi FTTH internasional...' })}\n\n"

            # ── 3. Susun Konteks Domain & Instruksi Sintesis ─────────────────────
            category_guide = CATEGORY_DOMAIN_CONTEXTS.get(
                payload.category,
                CATEGORY_DOMAIN_CONTEXTS["GENERAL"]
            )
            scope_guide = SCOPE_DOMAIN_CONTEXTS.get(
                payload.scope,
                SCOPE_DOMAIN_CONTEXTS["GLOBAL"]
            )

            system_instruction = (
                "Kamu adalah Senior FTTH Network Architect, GIS Specialist & Chief Technical Documentation Officer K2NET.\n"
                "Tugasmu adalah menghasilkan dokumen SOP (Standard Operating Procedure) resmi yang sangat mendalam, akurat, dan komprehensif untuk ekosistem FTTH GIS K2NET.\n\n"
                "PRINSIP SINTESIS PENGETAHUAN:\n"
                "1. Gabungkan informasi dari Knowledge Base internal server K2NET (jika ada) dengan standar telekomunikasi FTTH internasional (ITU-T G.984 GPON, ITU-T G.987 XGS-PON, IEEE 802.3ah, TIA/EIA-598-C).\n"
                "2. Lengkapi setiap bagian yang belum ada di server dengan best practice industri telekomunikasi riil sehingga dokumen menjadi utuh, solutif, dan siap pakai.\n"
                "3. Jangan membuat data duplikat yang bertentangan dengan standar baku FTTH.\n"
                "4. JANGAN gunakan placeholder generik seperti '[isi di sini]', '...', atau kalimat mengambang. Berikan data teknis, format kode penamaan aset nyata, nilai angka threshold dBm riil, perintah CLI/sintaks konfigurasi nyata, dan alur langkah kerja konkret.\n"
                "5. DILARANG KERAS menyapa atau berbasa-basi di awal (seperti 'Berikut adalah draf...') dan dilarang menulis penutup obrolan.\n"
                "6. Mulai baris PERTAMA langsung dengan: '# " + payload.title + "'.\n"
                "7. Selesaikan seluruh 7 seksi secara lengkap dan tuntas tanpa terpotong."
            )

            generation_prompt = f"""Hasilkan dokumen SOP teknis resmi yang mendalam dan tuntas untuk:

- **Judul Dokumen**: {payload.title}
- **Kategori Bidang**: {payload.category}
- **Otoritas & Ruang Lingkup**: {payload.scope}

{category_guide}

{scope_guide}

---

SUSUNAN STRUKTUR DOKUMEN WAJIB (Seluruh 7 Seksi Harus Diisi Substansi Teknis Nyata):

# {payload.title}

## 1. Tujuan & Ringkasan Eksekutif
Jelaskan tujuan operasional dokumen ini dibuat, target SLA, dan jaminan mutu teknis yang ingin dicapai bagi jaringan K2NET.

## 2. Ruang Lingkup & Otoritas Akses
- Cakupan wilayah dan infrastruktur yang terdampak.
- Matriks peran & tanggung jawab pelaksana ({payload.scope}): RACI (Responsible, Accountable, Consulted, Informed).

## 3. Prasyarat & Alat Kerja Lapangan (Prerequisites)
- Peralatan Hardware / Instrumen Ukur Lapangan (sertakan tipe spesifik seperti OPM, OTDR, Fusion Splicer, VFL).
- Perangkat Lunak / Platform GIS / Akses Kredensial CLI perangkat.
- Standar K3 (Keselamatan dan Kesehatan Kerja) teknisi lapangan & APD wajib.

## 4. Prosedur Kerja Langkah demi Langkah
1. **Tahap 1 — Persiapan & Pra-Verifikasi**: Cek izin kerja, review topologi spasial pada GIS K2NET, dan kalibrasi alat.
2. **Tahap 2 — Eksekusi Teknis Lapangan / Konfigurasi**:
   - Jelaskan langkah teknis mendalam dan terperinci.
   - Sertakan format konvensi penamaan aset / format penomoran / sintaks konfigurasi perangkat yang relevan dengan judul.
   - Prosedur penarikan, penyambungan (splicing), labeling fisik QR code, dan tagging atribut spasial.
3. **Tahap 3 — Pengujian & Validasi Mutu (Quality Assurance)**: Prosedur pengetesan link optik / validasi konektivitas.

## 5. Batas Parameter Teknis & Threshold Kritis
Buat tabel parameter teknis standar, rentang toleransi batas kritis, dan tindakan perbaikan langsung:
| Parameter / Indikator Teknis | Nilai Standar / Ideal | Batas Toleransi Kritis | Tindakan Korektif (Troubleshooting) |
|---|---|---|---|
| (Tuliskan parameter 1 sesuai judul) | ... | ... | ... |
| (Tuliskan parameter 2 sesuai judul) | ... | ... | ... |
| (Tuliskan parameter 3 sesuai judul) | ... | ... | ... |
| (Tuliskan parameter 4 sesuai judul) | ... | ... | ... |

## 6. Penanganan Masalah & Prosedur Eskalasi (Troubleshooting)
- Identifikasi 3-4 skenario kendala/anomali yang paling sering terjadi dan solusi cepat di lapangan.
- Prosedur eskalasi berjenjang (Level 1 Teknisi -> Level 2 NOC -> Level 3 Core / Vendor).

## 7. Checklist Penyelesaian & Berita Acara (Sign-Off)
- [ ] Verifikasi fisik, kerapian instalasi, dan penutupan enclosure (ODC/ODP/FJC).
- [ ] Pengukuran redaman optik end-to-end terverifikasi dalam batas toleransi.
- [ ] Sinkronisasi dan update data atribut aset pada platform K2NET FTTH GIS.
- [ ] Upload foto dokumentasi evidence (Open-box, Closed-box, Label Tag).
- [ ] Penerbitan Berita Acara Serah Terima (BAST) pekerjaan.

Tuliskan dokumen lengkap sekarang secara mendalam:"""

            yield f"data: {json.dumps({'type': 'status', 'stage': 'generating', 'message': 'Menulis dokumen SOP teknis komprehensif...' })}\n\n"

            # ── 4. Streaming Output dari LLM Engine ──────────────────────────────
            engine = LLMEngine(provider=provider, model=model_override)
            async for token in engine.stream_chat(
                user_message=generation_prompt,
                history=[],
                contexts=contexts,
                system_prompt=system_instruction,
            ):
                total_tokens += len(token.split())
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

            latency_ms = int((time.time() - start_time) * 1000)
            yield f"data: {json.dumps({'type': 'usage', 'tokens': total_tokens, 'latency_ms': latency_ms, 'sources_count': len(sources)})}\n\n"

        except Exception as e:
            logger.error(f"SOP generation error for tenant={ctx.tenant_id}: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        finally:
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        sop_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )

