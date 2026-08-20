"""
K2NET FTTH AI Gateway — Pydantic Request/Response Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
import uuid


# ─── Chat Request & Response ─────────────────────────────────────────────────

class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatStreamRequest(BaseModel):
    session_id: Optional[uuid.UUID] = Field(
        default=None,
        description="UUID sesi yang sudah ada. Jika None, buat sesi baru."
    )
    message: str = Field(..., min_length=1, max_length=4000)
    scope: str = Field(
        default="GENERAL",
        description="Konteks query: GENERAL | GIS_MAP | OLT_DIAGNOSTICS | TASK_COPILOT | BILLING"
    )
    model: str = Field(
        default="",
        description="Override model LLM: gpt-4o | gpt-4o-mini | gemini-1.5-flash | gemini-1.5-pro. Kosong = pakai default."
    )
    history: list[ChatHistoryMessage] = Field(
        default=[],
        description="Riwayat percakapan sebelumnya (max 10 pesan terakhir).",
        max_length=20
    )
    system_prompt: Optional[str] = Field(
        default=None,
        description="Override system prompt (hanya admin)."
    )


class SopGenerateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, description="Judul SOP / Prosedur Teknis")
    category: str = Field(default="GENERAL", description="Kategori SOP: GIS_MANUAL | TROUBLESHOOTING | NETWORK_CONFIG | INFRASTRUCTURE | PLANS | GENERAL")
    scope: str = Field(default="GLOBAL", description="Scope Otoritas: PLATFORM_INTERNAL | TENANT_INTERNAL | GLOBAL")
    model: str = Field(default="", description="Override model LLM (kosong = pakai default)")


class DocumentSource(BaseModel):
    document_id: str
    title: str
    chunk_index: int
    similarity_score: float
    content_preview: str


# ─── Document Management & Knowledge Base ────────────────────────────────────

# ─── Document Management & Knowledge Base ────────────────────────────────────

KnowledgeScopeType = Literal["PLATFORM_INTERNAL", "TENANT_INTERNAL", "GLOBAL"]
KnowledgeStatusType = Literal["PENDING_REVIEW", "DRAFT", "PROCESSING", "INDEXED", "REJECTED", "FAILED"]


class DocumentUploadResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    title: str
    category: str
    scope: str = "GLOBAL"
    status: str
    chunk_count: int
    created_at: datetime


class ManualDocumentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    category: str = Field(default="GENERAL")
    scope: KnowledgeScopeType = Field(default="GLOBAL", description="PLATFORM_INTERNAL | TENANT_INTERNAL | GLOBAL")
    content: str = Field(..., min_length=10)
    is_draft: bool = Field(default=False, description="True jika disimpan sebagai DRAFT, False jika PENDING_REVIEW")
    auto_approve: bool = Field(default=False, description="True jika Super Admin ingin langsung publish ke INDEXED")


class DocumentUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    category: Optional[str] = None
    scope: Optional[KnowledgeScopeType] = None
    content: Optional[str] = Field(None, min_length=10)
    status: Optional[KnowledgeStatusType] = None
    reindex: bool = Field(default=True, description="Apakah perlu melakukan re-chunking dan re-embedding jika konten berubah")


class DocumentApproveRequest(BaseModel):
    scope: Optional[KnowledgeScopeType] = None
    override_scope: Optional[KnowledgeScopeType] = None


class DocumentRejectRequest(BaseModel):
    reason: Optional[str] = Field(default="Dokumen ditolak oleh Super Admin.")


class DocumentItem(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    title: str
    category: str
    scope: str = "GLOBAL"
    file_name: Optional[str] = None
    file_size_bytes: int = 0
    mime_type: Optional[str] = None
    status: str
    chunk_count: int = 0
    raw_content: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class DocumentDetailResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    title: str
    category: str
    scope: str = "GLOBAL"
    file_name: Optional[str] = None
    file_size_bytes: int = 0
    mime_type: Optional[str] = None
    status: str
    chunk_count: int = 0
    raw_content: Optional[str] = None
    error_message: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    total: int
    documents: list[DocumentItem]


class AiStatsResponse(BaseModel):
    total_documents: int
    total_chunks: int
    total_size_bytes: int
    llm_provider: str
    embedding_model: str
    chat_model: str
    db_connected: bool


# ─── Chat Session ─────────────────────────────────────────────────────────────

class ChatSessionCreate(BaseModel):
    title: str = Field(default="Percakapan Baru", max_length=255)
    context_scope: str = Field(default="GENERAL")
    model_used: str = Field(default="gpt-4o-mini")


class ChatSessionResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID
    title: str
    context_scope: str
    model_used: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str
    sources: list
    tokens_used: int
    latency_ms: int
    created_at: datetime


# ─── Health ───────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    service: str = "ftth-ai-gateway"
    version: str = "1.0.0"
    port: int
    llm_provider: str
    db_connected: bool


class ReadyResponse(BaseModel):
    ready: bool
    checks: dict[str, bool]


# ─── Multi-Provider Hub & Connection Testing ──────────────────────────────────

class ProviderTestRequest(BaseModel):
    provider: Literal["gemini", "openai", "deepseek", "custom", "ollama"]
    api_key: Optional[str] = ""
    base_url: Optional[str] = ""
    model: Optional[str] = ""


class ProviderTestResponse(BaseModel):
    provider: str
    success: bool
    latency_ms: int
    message: str
    tested_at: datetime
    models_available: list[str] = []
    error_detail: Optional[str] = None


class ProviderStatusItem(BaseModel):
    id: str
    name: str
    is_active: bool
    is_fallback: bool
    is_configured: bool
    model: str
    base_url: Optional[str] = None
    last_tested: Optional[datetime] = None
    last_latency_ms: Optional[int] = None
    status: Literal["CONNECTED", "NOT_CONFIGURED", "ERROR", "OFFLINE"]


class ProviderStatusListResponse(BaseModel):
    active_primary: str
    active_fallback: str
    providers: list[ProviderStatusItem]


# ─── Knowledge Graph 2D (Obsidian-Style Semantic Graph) ──────────────────────

class GraphNode(BaseModel):
    id: str
    label: str
    title: str
    category: str
    chunk_count: int
    file_size_bytes: int
    vendor: str
    status: str
    degree: int = 0
    group: int = 1
    val: float = 5.0  # Node size for force graph


class GraphLink(BaseModel):
    source: str
    target: str
    similarity: float
    value: float
    relation: str = "semantic_cluster"


class KnowledgeGraphResponse(BaseModel):
    nodes: list[GraphNode]
    links: list[GraphLink]
    stats: dict


# ─── Server Sync & Disk Detection ──────────────────────────────────────────

class UnindexedFileItem(BaseModel):
    path: str
    title: str
    category: str
    size_bytes: int


class ServerSyncStatusResponse(BaseModel):
    total_server_files: int
    indexed_count: int
    unindexed_count: int
    unindexed_files: list[UnindexedFileItem]
    is_synced: bool


class ServerFilePreviewResponse(BaseModel):
    path: str
    title: str
    category: str
    scope: str
    content: str
    size_bytes: int
    line_count: int
    word_count: int
    char_count: int


class ServerFileRejectRequest(BaseModel):
    path: str
    title: Optional[str] = None
    category: Optional[str] = None
    reason: Optional[str] = None


class ServerFileIndexSingleRequest(BaseModel):
    path: str
    title: Optional[str] = None
    category: Optional[str] = None
    scope: Optional[str] = None


