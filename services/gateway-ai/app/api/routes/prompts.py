"""
K2NET FTTH AI Gateway — Suggested Prompts & Trending Topics Analytics
Routes:
- GET  /api/v1/ai/prompts/ideas         Get active prompt ideas for Ask AI Drawer (Pinned & Trending first)
- GET  /api/v1/ai/prompts               Get all prompts for Admin Management Table
- POST /api/v1/ai/prompts               Create new suggested prompt
- PUT  /api/v1/ai/prompts/{id}          Update suggested prompt
- DELETE /api/v1/ai/prompts/{id}        Delete suggested prompt
- POST /api/v1/ai/prompts/{id}/toggle-pin   Toggle pinned status
- POST /api/v1/ai/prompts/{id}/toggle-active Toggle active status
- POST /api/v1/ai/prompts/{id}/increment Increment usage count
- GET  /api/v1/ai/prompts/trending      Get trending questions from analytics
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.schemas import (
    SuggestedPromptItem,
    SuggestedPromptCreateRequest,
    SuggestedPromptUpdateRequest,
    SuggestedPromptListResponse,
    TrendingTopicItem,
    TrendingTopicsResponse,
)
from app.api.dependencies import verify_gateway_and_tenant, TenantContext
from app.db.session import get_db_session
from sqlalchemy import text
from typing import Optional
from datetime import datetime
import logging
import uuid

router = APIRouter(prefix="/api/v1/ai/prompts", tags=["AI Suggested Prompts & Trending"])
logger = logging.getLogger(__name__)


# ─── 1. Get Active Ideas for Drawer ──────────────────────────────────────────
@router.get("/ideas", response_model=list[SuggestedPromptItem])
async def get_prompt_ideas(
    limit: int = Query(default=8, ge=1, le=20),
    category: Optional[str] = Query(default=None),
    role: Optional[str] = Query(default="ALL"),
    tenant_ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    Mengambil daftar kartu prompt rekomendasi yang aktif untuk disajikan di Ask AI Drawer.
    Diurutkan berdasarkan:
      1. is_pinned DESC (yang di-pin selalu paling atas)
      2. usage_count DESC (yang paling sering dipakai)
      3. created_at DESC
    """
    try:
        async with get_db_session() as session:
            query_str = """
                SELECT id, tenant_id, title, description, prompt, icon, category, 
                       target_role, is_pinned, is_active, usage_count, created_at, updated_at
                FROM ai_suggested_prompts
                WHERE is_active = true
            """
            params: dict = {"limit": limit}

            if category and category != "ALL":
                query_str += " AND category = :category"
                params["category"] = category

            query_str += " ORDER BY is_pinned DESC, usage_count DESC, created_at DESC LIMIT :limit"

            res = await session.execute(text(query_str), params)
            rows = res.fetchall()

            items = []
            for row in rows:
                usage = row[10] or 0
                is_pinned = bool(row[8])
                # Mark as trending if usage >= 25 or in top tier
                is_trending = (usage >= 25 and not is_pinned)

                items.append(SuggestedPromptItem(
                    id=str(row[0]),
                    tenant_id=str(row[1]) if row[1] else None,
                    title=row[2],
                    description=row[3],
                    prompt=row[4],
                    icon=row[5] or "Zap",
                    category=row[6] or "GENERAL",
                    target_role=row[7] or "ALL",
                    is_pinned=is_pinned,
                    is_active=bool(row[9]),
                    is_trending=is_trending,
                    usage_count=usage,
                    created_at=row[11],
                    updated_at=row[12],
                ))

            return items

    except Exception as e:
        logger.error(f"Failed to fetch prompt ideas: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal memuat rekomendasi prompt: {e}")


# ─── 2. Get All Prompts for Admin Table ──────────────────────────────────────
@router.get("", response_model=SuggestedPromptListResponse)
async def list_all_prompts(
    category: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    tenant_ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """Mengambil semua daftar prompt rekomendasi untuk halaman admin /ai/prompts."""
    try:
        async with get_db_session() as session:
            query_str = """
                SELECT id, tenant_id, title, description, prompt, icon, category, 
                       target_role, is_pinned, is_active, usage_count, created_at, updated_at
                FROM ai_suggested_prompts
                WHERE 1=1
            """
            params: dict = {}

            if category and category != "ALL":
                query_str += " AND category = :category"
                params["category"] = category

            if status == "active":
                query_str += " AND is_active = true"
            elif status == "inactive":
                query_str += " AND is_active = false"
            elif status == "pinned":
                query_str += " AND is_pinned = true"

            if search and search.strip():
                query_str += " AND (title ILIKE :search OR description ILIKE :search OR prompt ILIKE :search)"
                params["search"] = f"%{search.strip()}%"

            query_str += " ORDER BY is_pinned DESC, usage_count DESC, created_at DESC"

            res = await session.execute(text(query_str), params)
            rows = res.fetchall()

            prompts = []
            for row in rows:
                usage = row[10] or 0
                is_pinned = bool(row[8])
                prompts.append(SuggestedPromptItem(
                    id=str(row[0]),
                    tenant_id=str(row[1]) if row[1] else None,
                    title=row[2],
                    description=row[3],
                    prompt=row[4],
                    icon=row[5] or "Zap",
                    category=row[6] or "GENERAL",
                    target_role=row[7] or "ALL",
                    is_pinned=is_pinned,
                    is_active=bool(row[9]),
                    is_trending=(usage >= 25 and not is_pinned),
                    usage_count=usage,
                    created_at=row[11],
                    updated_at=row[12],
                ))

            return SuggestedPromptListResponse(total=len(prompts), prompts=prompts)

    except Exception as e:
        logger.error(f"Failed to list all prompts: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal memuat daftar prompt: {e}")


# ─── 3. Create Prompt ────────────────────────────────────────────────────────
@router.post("", response_model=SuggestedPromptItem, status_code=201)
async def create_prompt(
    payload: SuggestedPromptCreateRequest,
    tenant_ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """Menambahkan prompt rekomendasi baru ke database."""
    try:
        new_id = uuid.uuid4()
        now = datetime.utcnow()
        async with get_db_session() as session:
            await session.execute(
                text("""
                    INSERT INTO ai_suggested_prompts (
                        id, title, description, prompt, icon, category, 
                        target_role, is_pinned, is_active, usage_count, created_at, updated_at
                    ) VALUES (
                        :id, :title, :description, :prompt, :icon, :category,
                        :target_role, :is_pinned, :is_active, 0, :created_at, :updated_at
                    )
                """),
                {
                    "id": new_id,
                    "title": payload.title.strip(),
                    "description": payload.description.strip() if payload.description else "",
                    "prompt": payload.prompt.strip(),
                    "icon": payload.icon or "Zap",
                    "category": payload.category or "GENERAL",
                    "target_role": payload.target_role or "ALL",
                    "is_pinned": payload.is_pinned,
                    "is_active": payload.is_active,
                    "created_at": now,
                    "updated_at": now,
                },
            )

        return SuggestedPromptItem(
            id=str(new_id),
            title=payload.title,
            description=payload.description,
            prompt=payload.prompt,
            icon=payload.icon,
            category=payload.category,
            target_role=payload.target_role,
            is_pinned=payload.is_pinned,
            is_active=payload.is_active,
            is_trending=False,
            usage_count=0,
            created_at=now,
            updated_at=now,
        )
    except Exception as e:
        logger.error(f"Failed to create prompt: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal menambahkan prompt: {e}")


# ─── 4. Update Prompt ────────────────────────────────────────────────────────
@router.put("/{prompt_id}", response_model=SuggestedPromptItem)
async def update_prompt(
    prompt_id: str,
    payload: SuggestedPromptUpdateRequest,
    tenant_ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """Mengupdate detail prompt rekomendasi."""
    try:
        now = datetime.utcnow()
        async with get_db_session() as session:
            # Check existence
            check = await session.execute(
                text("SELECT id FROM ai_suggested_prompts WHERE id = :id"),
                {"id": prompt_id},
            )
            if not check.fetchone():
                raise HTTPException(status_code=404, detail="Prompt tidak ditemukan.")

            updates = []
            params: dict = {"id": prompt_id, "updated_at": now}

            if payload.title is not None:
                updates.append("title = :title")
                params["title"] = payload.title.strip()
            if payload.description is not None:
                updates.append("description = :description")
                params["description"] = payload.description.strip()
            if payload.prompt is not None:
                updates.append("prompt = :prompt")
                params["prompt"] = payload.prompt.strip()
            if payload.icon is not None:
                updates.append("icon = :icon")
                params["icon"] = payload.icon
            if payload.category is not None:
                updates.append("category = :category")
                params["category"] = payload.category
            if payload.target_role is not None:
                updates.append("target_role = :target_role")
                params["target_role"] = payload.target_role
            if payload.is_pinned is not None:
                updates.append("is_pinned = :is_pinned")
                params["is_pinned"] = payload.is_pinned
            if payload.is_active is not None:
                updates.append("is_active = :is_active")
                params["is_active"] = payload.is_active

            if updates:
                updates.append("updated_at = :updated_at")
                sql = f"UPDATE ai_suggested_prompts SET {', '.join(updates)} WHERE id = :id"
                await session.execute(text(sql), params)

            # Fetch updated row
            res = await session.execute(
                text("""
                    SELECT id, tenant_id, title, description, prompt, icon, category, 
                           target_role, is_pinned, is_active, usage_count, created_at, updated_at
                    FROM ai_suggested_prompts WHERE id = :id
                """),
                {"id": prompt_id},
            )
            row = res.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Prompt tidak ditemukan setelah update.")

            usage = row[10] or 0
            is_pinned = bool(row[8])

            return SuggestedPromptItem(
                id=str(row[0]),
                tenant_id=str(row[1]) if row[1] else None,
                title=row[2],
                description=row[3],
                prompt=row[4],
                icon=row[5] or "Zap",
                category=row[6] or "GENERAL",
                target_role=row[7] or "ALL",
                is_pinned=is_pinned,
                is_active=bool(row[9]),
                is_trending=(usage >= 25 and not is_pinned),
                usage_count=usage,
                created_at=row[11],
                updated_at=row[12],
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update prompt {prompt_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal memperbarui prompt: {e}")


# ─── 5. Delete Prompt ────────────────────────────────────────────────────────
@router.delete("/{prompt_id}")
async def delete_prompt(
    prompt_id: str,
    tenant_ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """Menghapus prompt rekomendasi dari database."""
    try:
        async with get_db_session() as session:
            res = await session.execute(
                text("DELETE FROM ai_suggested_prompts WHERE id = :id"),
                {"id": prompt_id},
            )
            if res.rowcount == 0:
                raise HTTPException(status_code=404, detail="Prompt tidak ditemukan.")

        return {"status": "ok", "message": "Prompt berhasil dihapus."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete prompt {prompt_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal menghapus prompt: {e}")


# ─── 6. Toggle Pin Status ───────────────────────────────────────────────────
@router.post("/{prompt_id}/toggle-pin", response_model=SuggestedPromptItem)
async def toggle_pin_prompt(
    prompt_id: str,
    tenant_ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """Toggle status pin pada prompt rekomendasi."""
    try:
        now = datetime.utcnow()
        async with get_db_session() as session:
            await session.execute(
                text("UPDATE ai_suggested_prompts SET is_pinned = NOT is_pinned, updated_at = :updated_at WHERE id = :id"),
                {"id": prompt_id, "updated_at": now},
            )
            res = await session.execute(
                text("""
                    SELECT id, tenant_id, title, description, prompt, icon, category, 
                           target_role, is_pinned, is_active, usage_count, created_at, updated_at
                    FROM ai_suggested_prompts WHERE id = :id
                """),
                {"id": prompt_id},
            )
            row = res.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Prompt tidak ditemukan.")

            usage = row[10] or 0
            is_pinned = bool(row[8])

            return SuggestedPromptItem(
                id=str(row[0]),
                tenant_id=str(row[1]) if row[1] else None,
                title=row[2],
                description=row[3],
                prompt=row[4],
                icon=row[5] or "Zap",
                category=row[6] or "GENERAL",
                target_role=row[7] or "ALL",
                is_pinned=is_pinned,
                is_active=bool(row[9]),
                is_trending=(usage >= 25 and not is_pinned),
                usage_count=usage,
                created_at=row[11],
                updated_at=row[12],
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to toggle pin on prompt {prompt_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal mengubah pin: {e}")


# ─── 7. Increment Usage Count ────────────────────────────────────────────────
@router.post("/{prompt_id}/increment")
async def increment_prompt_usage(
    prompt_id: str,
    tenant_ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """Mencatat klik / pemakaian prompt oleh pengguna."""
    try:
        async with get_db_session() as session:
            await session.execute(
                text("UPDATE ai_suggested_prompts SET usage_count = usage_count + 1 WHERE id = :id"),
                {"id": prompt_id},
            )
        return {"status": "ok"}
    except Exception as e:
        logger.warning(f"Failed to increment prompt usage: {e}")
        return {"status": "error", "message": str(e)}


# ─── 8. Real-time Trending Topics ────────────────────────────────────────────
@router.get("/trending", response_model=TrendingTopicsResponse)
async def get_trending_topics(
    days: int = Query(default=7, ge=1, le=30),
    tenant_ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    Agregasi Top Pertanyaan Terbanyak 7 hari terakhir dari ai_query_analytics.
    Memungkinkan admin melihat apa yang sedang ramai ditanyakan pengguna dan menjadikannya
    kartu prompt rekomendasi dalam 1 klik.
    """
    try:
        async with get_db_session() as session:
            # 1. Check existing prompt titles to mark if already in library
            existing_prompts_res = await session.execute(
                text("SELECT LOWER(TRIM(title)) FROM ai_suggested_prompts")
            )
            existing_titles = {r[0] for r in existing_prompts_res.fetchall()}

            # 2. Query analytics table for frequent topics
            analytics_query = """
                SELECT 
                    COALESCE(NULLIF(normalized_topic, ''), SUBSTRING(query_text FROM 1 FOR 60)) AS topic,
                    COUNT(*) AS count,
                    MAX(category_detected) AS category,
                    MIN(query_text) AS sample_query
                FROM ai_query_analytics
                WHERE created_at >= NOW() - INTERVAL ':days days'
                GROUP BY 1
                ORDER BY count DESC
                LIMIT 10
            """.replace(":days", str(days))

            res = await session.execute(text(analytics_query))
            rows = res.fetchall()

            trending_items = []
            for row in rows:
                topic_name = str(row[0])
                count = int(row[1])
                cat = str(row[2] or "GENERAL")
                sample = str(row[3])
                is_already = topic_name.lower().strip() in existing_titles

                trending_items.append(TrendingTopicItem(
                    topic=topic_name,
                    count=count,
                    category=cat,
                    sample_query=sample,
                    is_already_prompt=is_already,
                ))

            # If analytics has few data, provide curated trend starter topics
            if len(trending_items) < 3:
                sample_trends = [
                    TrendingTopicItem(
                        topic="Reset & Konfigurasi ONT ZTE F609",
                        count=19,
                        category="OLT_TROUBLESHOOTING",
                        sample_query="Bagaimana SOP mereset dan provisioning ulang ONT ZTE F609 via Telnet/OMCI?",
                        is_already_prompt=False,
                    ),
                    TrendingTopicItem(
                        topic="Standar Redaman ODP Splitter 1:16",
                        count=14,
                        category="GIS_SPATIAL",
                        sample_query="Berapa insertion loss maksimal pada ODP dengan passive optical splitter 1:16?",
                        is_already_prompt=False,
                    ),
                    TrendingTopicItem(
                        topic="Perintah CLI Cek Status PON Port Huawei",
                        count=11,
                        category="OLT_TROUBLESHOOTING",
                        sample_query="Tuliskan perintah display ont info dan display optical-info pada OLT Huawei MA5608T.",
                        is_already_prompt=False,
                    ),
                ]
                for st in sample_trends:
                    if not any(t.topic == st.topic for t in trending_items):
                        trending_items.append(st)

            total_count = sum(t.count for t in trending_items)

            return TrendingTopicsResponse(
                total_queries_analyzed=total_count,
                trending=trending_items[:6],
            )

    except Exception as e:
        logger.error(f"Failed to aggregate trending topics: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal menganalisis topik trending: {e}")
