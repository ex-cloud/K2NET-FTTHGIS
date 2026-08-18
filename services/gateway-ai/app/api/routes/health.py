"""
K2NET FTTH AI Gateway — Health & Readiness Probes
GET /health — Liveness probe (Traefik, Docker healthcheck)
GET /ready  — Readiness probe (verifikasi koneksi DB & LLM config)
"""
from fastapi import APIRouter
from app.models.schemas import HealthResponse, ReadyResponse
from app.core.config import settings
import logging

router = APIRouter(tags=["Health"])
logger = logging.getLogger(__name__)


@router.get("/health", response_model=HealthResponse)
async def liveness_probe():
    """Liveness check — layanan berjalan dan merespons."""
    return HealthResponse(
        status="UP",
        port=settings.PORT,
        llm_provider=settings.DEFAULT_LLM_PROVIDER,
        db_connected=True,  # Liveness: tidak perlu cek DB
    )


@router.get("/ready", response_model=ReadyResponse)
async def readiness_probe():
    """
    Readiness check — verifikasi semua dependency siap menerima traffic.
    Dicek: PostgreSQL connection + LLM API key tersedia.
    """
    from app.db.session import check_db_connection

    checks = {}

    # ── Cek koneksi PostgreSQL ───────────────────────────────────────────────
    try:
        checks["postgresql"] = await check_db_connection()
    except Exception as e:
        logger.error(f"DB readiness check failed: {e}")
        checks["postgresql"] = False

    # ── Cek ketersediaan LLM API Key ─────────────────────────────────────────
    if settings.DEFAULT_LLM_PROVIDER == "openai":
        checks["llm_api_key"] = bool(settings.OPENAI_API_KEY)
    else:
        checks["llm_api_key"] = bool(settings.GEMINI_API_KEY)

    all_ready = all(checks.values())

    return ReadyResponse(ready=all_ready, checks=checks)
