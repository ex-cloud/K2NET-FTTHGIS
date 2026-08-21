"""
K2NET FTTH AI Gateway — Gateway Configuration CRUD Handler
Provides GET /api/v1/config and POST /api/v1/config compatible with K2NET Monorepo Standard.
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from app.models.schemas import (
    ConfigResponse,
    ConfigEntry,
    ConfigUpdateRequest,
    ConfigUpdateResponse,
)
from app.api.dependencies import verify_gateway_and_tenant, TenantContext
from app.core.config import settings
import logging
import os
import re

router = APIRouter(prefix="/api/v1/config", tags=["AI Gateway Configuration"])
logger = logging.getLogger(__name__)


def _censor_value(key: str, value: str) -> str:
    """Mask sensitive credential values for safe display in UI."""
    if not value:
        return ""
    
    upper_key = key.upper()
    sensitive_markers = ["API_KEY", "TOKEN", "SECRET", "PASSWORD", "AUTH_TOKEN"]
    
    if any(m in upper_key for m in sensitive_markers):
        if value.startswith("AIzaSy") and len(value) > 10:
            return f"AIzaSy••••••••{value[-4:]}"
        if value.startswith("sk-") and len(value) > 8:
            return f"{value[:5]}••••••••{value[-4:]}"
        if len(value) > 8:
            return f"{value[:3]}••••••••{value[-3:]}"
        return "••••••••"
        
    return value


def _get_env_path() -> str:
    candidates = [
        os.getenv("ENV_FILE_PATH", ""),
        "/opt/project5/services/.env",
        "/opt/project5/.env",
        ".env",
    ]
    for p in candidates:
        if p and os.path.exists(p):
            return p
    return "/opt/project5/services/.env"


def _parse_env_file(env_path: str) -> list[ConfigEntry]:
    """Parse .env file into structured config entries grouped by section."""
    entries: list[ConfigEntry] = []
    
    # Standard AI Gateway settings default mapping
    key_sections = {
        "DEFAULT_LLM_PROVIDER": "Engine Router & Fallback",
        "FALLBACK_LLM_PROVIDER": "Engine Router & Fallback",
        "GEMINI_API_KEY": "Google Gemini",
        "GOOGLE_API_KEY": "Google Gemini",
        "GEMINI_CHAT_MODEL": "Google Gemini",
        "GEMINI_EMBEDDING_MODEL": "Google Gemini",
        "OPENAI_API_KEY": "OpenAI",
        "OPENAI_CHAT_MODEL": "OpenAI",
        "OPENAI_EMBEDDING_MODEL": "OpenAI",
        "DEEPSEEK_API_KEY": "DeepSeek / Custom",
        "DEEPSEEK_BASE_URL": "DeepSeek / Custom",
        "DEEPSEEK_CHAT_MODEL": "DeepSeek / Custom",
        "OLLAMA_BASE_URL": "Local Ollama Engine",
        "OLLAMA_CHAT_MODEL": "Local Ollama Engine",
        "OLLAMA_EMBEDDING_MODEL": "Local Ollama Engine",
        "RAG_CHUNK_SIZE": "RAG & Vector Parameters",
        "RAG_CHUNK_OVERLAP": "RAG & Vector Parameters",
        "RAG_RETRIEVAL_LIMIT": "RAG & Vector Parameters",
        "EMBEDDING_DIMENSION": "RAG & Vector Parameters",
    }
    
    found_keys = set()
    
    if os.path.exists(env_path):
        current_section = "General"
        try:
            with open(env_path, "r", encoding="utf-8", errors="replace") as f:
                for raw_line in f:
                    line = raw_line.strip()
                    if line.startswith("# ---") and line.endswith("---"):
                        sec = line.strip("# -").strip()
                        if sec:
                            current_section = sec
                        continue
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                        
                    parts = line.split("=", 1)
                    k = parts[0].strip()
                    v = parts[1].strip().strip('"').strip("'")
                    
                    if k in key_sections:
                        sec = key_sections[k]
                        entries.append(ConfigEntry(
                            key=k,
                            value=v,
                            censored=_censor_value(k, v),
                            section=sec,
                        ))
                        found_keys.add(k)
        except Exception as e:
            logger.warning(f"Error reading env file {env_path}: {e}")

    # Ensure all AI Gateway settings exist in the response
    defaults = [
        ("DEFAULT_LLM_PROVIDER", settings.DEFAULT_LLM_PROVIDER, "Engine Router & Fallback"),
        ("FALLBACK_LLM_PROVIDER", settings.FALLBACK_LLM_PROVIDER, "Engine Router & Fallback"),
        ("GEMINI_API_KEY", settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY, "Google Gemini"),
        ("GEMINI_CHAT_MODEL", settings.GEMINI_CHAT_MODEL, "Google Gemini"),
        ("GEMINI_EMBEDDING_MODEL", settings.GEMINI_EMBEDDING_MODEL, "Google Gemini"),
        ("OPENAI_API_KEY", settings.OPENAI_API_KEY, "OpenAI"),
        ("OPENAI_CHAT_MODEL", settings.OPENAI_CHAT_MODEL, "OpenAI"),
        ("OPENAI_EMBEDDING_MODEL", settings.OPENAI_EMBEDDING_MODEL, "OpenAI"),
        ("DEEPSEEK_API_KEY", settings.DEEPSEEK_API_KEY, "DeepSeek / Custom"),
        ("DEEPSEEK_BASE_URL", settings.DEEPSEEK_BASE_URL, "DeepSeek / Custom"),
        ("DEEPSEEK_CHAT_MODEL", settings.DEEPSEEK_CHAT_MODEL, "DeepSeek / Custom"),
        ("OLLAMA_BASE_URL", settings.OLLAMA_BASE_URL, "Local Ollama Engine"),
        ("OLLAMA_CHAT_MODEL", settings.OLLAMA_CHAT_MODEL, "Local Ollama Engine"),
        ("OLLAMA_EMBEDDING_MODEL", settings.OLLAMA_EMBEDDING_MODEL, "Local Ollama Engine"),
        ("RAG_CHUNK_SIZE", str(settings.RAG_CHUNK_SIZE), "RAG & Vector Parameters"),
        ("RAG_CHUNK_OVERLAP", str(settings.RAG_CHUNK_OVERLAP), "RAG & Vector Parameters"),
        ("RAG_RETRIEVAL_LIMIT", str(settings.RAG_RETRIEVAL_LIMIT), "RAG & Vector Parameters"),
        ("EMBEDDING_DIMENSION", str(settings.EMBEDDING_DIMENSION), "RAG & Vector Parameters"),
    ]
    
    for k, v, sec in defaults:
        if k not in found_keys and v:
            entries.append(ConfigEntry(
                key=k,
                value=str(v),
                censored=_censor_value(k, str(v)),
                section=sec,
            ))

    return entries


def _write_env_file(env_path: str, updates: dict[str, str]) -> int:
    """Write updated configuration values back to .env file."""
    if not updates:
        return 0
        
    lines = []
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
            
    updated_lines = []
    remaining_updates = dict(updates)
    
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            updated_lines.append(line)
            continue
            
        k, _ = stripped.split("=", 1)
        k = k.strip()
        if k in remaining_updates:
            new_val = remaining_updates.pop(k)
            # If value is masked or empty, don't overwrite if it was a censored placeholder
            if "••••" in new_val:
                updated_lines.append(line)
            else:
                updated_lines.append(f"{k}={new_val}\n")
        else:
            updated_lines.append(line)
            
    # Append any new keys
    for k, v in remaining_updates.items():
        if "••••" not in v:
            updated_lines.append(f"{k}={v}\n")
            
    try:
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(updated_lines)
    except Exception as e:
        logger.warning(f"Could not persist config to disk {env_path}: {e}. Applying to runtime settings only.")
        
    # Hot-reload in runtime settings
    for k, v in updates.items():
        if "••••" in v:
            continue
        if hasattr(settings, k):
            try:
                setattr(settings, k, int(v) if k in ("RAG_CHUNK_SIZE", "RAG_CHUNK_OVERLAP", "RAG_RETRIEVAL_LIMIT", "EMBEDDING_DIMENSION", "PORT") else v)
                os.environ[k] = v
            except Exception:
                pass
                
    return len(updates)


@router.get("", response_model=ConfigResponse)
async def get_ai_gateway_config(
    x_gateway_token: str = Header(None, alias="X-Gateway-Token"),
):
    """
    Mengambil konfigurasi aktif AI Gateway dengan API Key yang disensor secara aman.
    """
    env_path = _get_env_path()
    entries = _parse_env_file(env_path)
    
    grouped: dict[str, list[ConfigEntry]] = {}
    for entry in entries:
        if entry.section not in grouped:
            grouped[entry.section] = []
        grouped[entry.section].append(entry)
        
    return ConfigResponse(status="ok", sections=grouped)


@router.post("", response_model=ConfigUpdateResponse)
async def update_ai_gateway_config(
    payload: ConfigUpdateRequest,
    x_gateway_token: str = Header(None, alias="X-Gateway-Token"),
):
    """
    Menyimpan pembaruan konfigurasi AI Provider, Model, dan Parameter RAG ke file .env dan runtime.
    """
    env_path = _get_env_path()
    keys_count = _write_env_file(env_path, payload.updates)
    
    logger.info(f"AI Gateway configuration updated ({keys_count} keys).")
    return ConfigUpdateResponse(
        status="ok",
        message=f"Berhasil memperbarui {keys_count} parameter konfigurasi AI.",
        keys_updated=keys_count,
    )
