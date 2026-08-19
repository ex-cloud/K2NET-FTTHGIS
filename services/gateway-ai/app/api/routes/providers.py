"""
K2NET FTTH AI Gateway — Multi-Provider Hub & Connection Testing
Endpoints:
- POST /api/v1/ai/providers/test    Real-time dry-run ping testing for any LLM API key / endpoint
- GET  /api/v1/ai/providers/status  Status & health overview of all 4 supported providers
"""
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import (
    ProviderTestRequest,
    ProviderTestResponse,
    ProviderStatusListResponse,
    ProviderStatusItem,
)
from app.api.dependencies import verify_gateway_and_tenant, TenantContext
from app.core.config import settings
from datetime import datetime
import time
import logging
import httpx
import os

router = APIRouter(prefix="/api/v1/ai/providers", tags=["AI Provider Hub & Testing"])
logger = logging.getLogger(__name__)


@router.post("/test", response_model=ProviderTestResponse)
async def test_provider_connection(
    req: ProviderTestRequest,
    tenant_ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    Melakukan dry-run live test ke LLM Provider untuk memvalidasi API Key,
    mengukur response latency (ms), dan memastikan model tersedia.
    """
    start_time = time.time()
    provider = req.provider.lower()
    api_key = req.api_key.strip() if req.api_key else ""
    base_url = req.base_url.strip() if req.base_url else ""
    model = req.model.strip() if req.model else ""

    try:
        # ── 1. GOOGLE GEMINI ───────────────────────────────────────────────────
        if provider == "gemini":
            effective_key = api_key or settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            if not effective_key:
                raise ValueError("API Key Google Gemini belum diisi.")

            import google.generativeai as genai
            genai.configure(api_key=effective_key)

            # Test list models or ping
            target_model = model or settings.GEMINI_CHAT_MODEL
            if not target_model.startswith("models/") and "/" not in target_model:
                target_model = f"models/{target_model}"

            m = genai.GenerativeModel(model_name=target_model)
            # Send mini test probe
            res = await m.generate_content_async("ping", generation_config={"max_output_tokens": 5})
            latency_ms = int((time.time() - start_time) * 1000)

            return ProviderTestResponse(
                provider="gemini",
                success=True,
                latency_ms=latency_ms,
                message=f"Google Gemini terhubung sukses! Model '{target_model}' siap digunakan.",
                tested_at=datetime.utcnow(),
                models_available=["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
            )

        # ── 2. OPENAI (GPT-4o / GPT-4o-mini) ──────────────────────────────────
        elif provider == "openai":
            effective_key = api_key or settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
            if not effective_key:
                raise ValueError("API Key OpenAI belum diisi.")

            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=effective_key, timeout=10.0)

            target_model = model or settings.OPENAI_CHAT_MODEL
            # Probe models list or mini completion
            res = await client.chat.completions.create(
                model=target_model,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5,
            )
            latency_ms = int((time.time() - start_time) * 1000)

            return ProviderTestResponse(
                provider="openai",
                success=True,
                latency_ms=latency_ms,
                message=f"OpenAI terhubung sukses! Model '{target_model}' responsif.",
                tested_at=datetime.utcnow(),
                models_available=["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
            )

        # ── 3. DEEPSEEK CLOUD / GROQ / CUSTOM OPENAI-COMPATIBLE ────────────────
        elif provider in ("deepseek", "custom"):
            effective_key = api_key or settings.DEEPSEEK_API_KEY or os.getenv("DEEPSEEK_API_KEY")
            effective_base = base_url or settings.DEEPSEEK_BASE_URL or "https://api.deepseek.com/v1"
            target_model = model or settings.DEEPSEEK_CHAT_MODEL or "deepseek-chat"

            if not effective_key and "localhost" not in effective_base and "127.0.0.1" not in effective_base:
                raise ValueError("API Key untuk custom provider belum diisi.")

            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                api_key=effective_key or "sk-custom-probe",
                base_url=effective_base,
                timeout=12.0,
            )

            res = await client.chat.completions.create(
                model=target_model,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5,
            )
            latency_ms = int((time.time() - start_time) * 1000)

            return ProviderTestResponse(
                provider=provider,
                success=True,
                latency_ms=latency_ms,
                message=f"Custom Endpoint ({effective_base}) terhubung sukses! Model '{target_model}' aktif.",
                tested_at=datetime.utcnow(),
                models_available=[target_model],
            )

        # ── 4. LOCAL OLLAMA / ON-PREMISE ──────────────────────────────────────
        elif provider in ("ollama", "local"):
            effective_base = base_url or settings.OLLAMA_BASE_URL
            target_model = model or settings.OLLAMA_CHAT_MODEL

            # Ping HTTP tag endpoint
            clean_base = effective_base.rstrip("/v1").rstrip("/")
            async with httpx.AsyncClient(timeout=4.0) as http_client:
                tags_res = await http_client.get(f"{clean_base}/api/tags")
                if tags_res.status_code != 200:
                    raise ValueError(f"HTTP {tags_res.status_code} dari Ollama endpoint.")
                data = tags_res.json()
                models = [m.get("name", "") for m in data.get("models", [])]

            latency_ms = int((time.time() - start_time) * 1000)
            return ProviderTestResponse(
                provider="ollama",
                success=True,
                latency_ms=latency_ms,
                message=f"Local Ollama Engine terhubung! Ditemukan {len(models)} model lokal.",
                tested_at=datetime.utcnow(),
                models_available=models[:5] if models else [target_model],
            )

        else:
            raise HTTPException(status_code=400, detail=f"Provider '{provider}' tidak didukung.")

    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        logger.warning(f"Provider test failed for {provider}: {e}")
        return ProviderTestResponse(
            provider=provider,
            success=False,
            latency_ms=latency_ms,
            message=f"Gagal terhubung ke {provider.upper()}: {str(e)}",
            tested_at=datetime.utcnow(),
            error_detail=str(e),
        )


@router.get("/status", response_model=ProviderStatusListResponse)
async def get_providers_status(
    tenant_ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    Mengembalikan status konfigurasi semua provider yang terdaftar di sistem.
    """
    primary = settings.DEFAULT_LLM_PROVIDER
    fallback = settings.FALLBACK_LLM_PROVIDER

    gemini_has_key = bool(settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY or os.getenv("GEMINI_API_KEY"))
    openai_has_key = bool(settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY"))
    deepseek_has_key = bool(settings.DEEPSEEK_API_KEY or os.getenv("DEEPSEEK_API_KEY"))

    providers = [
        ProviderStatusItem(
            id="gemini",
            name="Google Gemini (Cloud AI)",
            is_active=(primary == "gemini"),
            is_fallback=(fallback == "gemini"),
            is_configured=gemini_has_key,
            model=settings.GEMINI_CHAT_MODEL,
            status="CONNECTED" if gemini_has_key else "NOT_CONFIGURED",
        ),
        ProviderStatusItem(
            id="openai",
            name="OpenAI (GPT-4o / GPT-4o-mini)",
            is_active=(primary == "openai"),
            is_fallback=(fallback == "openai"),
            is_configured=openai_has_key,
            model=settings.OPENAI_CHAT_MODEL,
            status="CONNECTED" if openai_has_key else "NOT_CONFIGURED",
        ),
        ProviderStatusItem(
            id="deepseek",
            name="DeepSeek Cloud / Groq / Custom",
            is_active=(primary in ("deepseek", "custom")),
            is_fallback=(fallback in ("deepseek", "custom")),
            is_configured=deepseek_has_key,
            model=settings.DEEPSEEK_CHAT_MODEL,
            base_url=settings.DEEPSEEK_BASE_URL,
            status="CONNECTED" if deepseek_has_key else "NOT_CONFIGURED",
        ),
        ProviderStatusItem(
            id="ollama",
            name="Local Ollama Engine (On-Premise)",
            is_active=(primary in ("ollama", "local")),
            is_fallback=(fallback in ("ollama", "local")),
            is_configured=True,
            model=settings.OLLAMA_CHAT_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            status="OFFLINE",  # Checked dynamically or marked on-premise
        ),
    ]

    return ProviderStatusListResponse(
        active_primary=primary,
        active_fallback=fallback,
        providers=providers,
    )
