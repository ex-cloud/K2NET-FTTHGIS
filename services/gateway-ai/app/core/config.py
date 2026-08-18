"""
K2NET FTTH AI Gateway — Configuration Module
Pydantic Settings dengan validasi ENV variables.
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Literal


class Settings(BaseSettings):
    # ── Server ───────────────────────────────────────────────────
    PORT: int = Field(default=5012)
    LOG_LEVEL: str = Field(default="INFO")
    ENVIRONMENT: str = Field(default="production")

    # ── Database (PostgreSQL 17 + pgvector) ──────────────────────
    DATABASE_URL: str = Field(
        default="",
        description="Database connection string with pgvector (e.g. postgresql+asyncpg://user:pass@host:5432/db)"
    )
    DB_POOL_SIZE: int = Field(default=10)
    DB_MAX_OVERFLOW: int = Field(default=5)

    # ── Security & Audit (Kong Internal Gateway Token & Audit Client) ─
    GATEWAY_INTERNAL_TOKEN: str = Field(
        default="",
        description="Internal shared secret for Kong requests"
    )
    AUDIT_GATEWAY_URL: str = Field(
        default="http://ftth-audit-gateway:5009",
        description="Base URL for centralized audit gateway"
    )

    # ── LLM Provider Configuration ────────────────────────────────
    DEFAULT_LLM_PROVIDER: Literal["openai", "gemini", "ollama", "local"] = Field(default="gemini")

    OPENAI_API_KEY: str = Field(default="")
    OPENAI_EMBEDDING_MODEL: str = Field(default="text-embedding-3-small")
    OPENAI_CHAT_MODEL: str = Field(default="gpt-4o-mini")

    GEMINI_API_KEY: str = Field(default="")
    GOOGLE_API_KEY: str = Field(default="")
    GEMINI_EMBEDDING_MODEL: str = Field(default="models/gemini-embedding-001")
    GEMINI_CHAT_MODEL: str = Field(default="models/gemini-2.5-flash")

    # Local / On-Premise Ollama Engine
    OLLAMA_BASE_URL: str = Field(default="http://host.docker.internal:11434/v1")
    OLLAMA_CHAT_MODEL: str = Field(default="llama3.2")
    OLLAMA_EMBEDDING_MODEL: str = Field(default="nomic-embed-text")

    # ── RAG Configuration ─────────────────────────────────────────
    RAG_CHUNK_SIZE: int = Field(default=500)       # tokens per chunk
    RAG_CHUNK_OVERLAP: int = Field(default=50)     # overlap tokens
    RAG_RETRIEVAL_LIMIT: int = Field(default=4)    # top-K chunks per query
    EMBEDDING_DIMENSION: int = Field(default=1536)  # pgvector dimensi

    # ── CORS ──────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"]
    )

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
