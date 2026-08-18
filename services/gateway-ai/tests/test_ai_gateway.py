"""
Unit Tests — K2NET FTTH AI Gateway
Testing multi-tenant isolation, header dependencies, text chunking, and schemas.
"""
import pytest
import uuid
from fastapi import HTTPException
from app.api.dependencies import verify_gateway_and_tenant, TenantContext
from app.services.rag_retriever import DocumentChunker
from app.models.schemas import ChatStreamRequest, ChatHistoryMessage
from app.core.config import settings


@pytest.mark.asyncio
async def test_tenant_dependency_missing_tenant_id():
    """Memastikan request tanpa X-Tenant-ID ditolak dengan 400 Bad Request."""
    with pytest.raises(HTTPException) as exc_info:
        await verify_gateway_and_tenant(
            x_gateway_token=settings.GATEWAY_INTERNAL_TOKEN or None,
            x_tenant_id=None,
        )
    assert exc_info.value.status_code == 400
    assert "Missing required X-Tenant-ID" in exc_info.value.detail


@pytest.mark.asyncio
async def test_tenant_dependency_malformed_uuid():
    """Memastikan X-Tenant-ID non-UUID ditolak."""
    with pytest.raises(HTTPException) as exc_info:
        await verify_gateway_and_tenant(
            x_gateway_token=settings.GATEWAY_INTERNAL_TOKEN or None,
            x_tenant_id="not-a-valid-uuid",
        )
    assert exc_info.value.status_code == 400
    assert "Malformed X-Tenant-ID" in exc_info.value.detail


@pytest.mark.asyncio
async def test_tenant_dependency_valid():
    """Memastikan X-Tenant-ID valid berhasil diekstrak."""
    tenant_id_str = str(uuid.uuid4())
    ctx = await verify_gateway_and_tenant(
        x_gateway_token=settings.GATEWAY_INTERNAL_TOKEN or None,
        x_tenant_id=tenant_id_str,
        x_actor_id="admin-123",
        x_actor_role="super_admin",
    )
    assert isinstance(ctx, TenantContext)
    assert str(ctx.tenant_id) == tenant_id_str
    assert ctx.actor_id == "admin-123"
    assert ctx.actor_role == "super_admin"


def test_document_chunker_basic():
    """Menguji pembagian teks dokumen SOP menjadi chunks dengan token limit."""
    chunker = DocumentChunker(chunk_size=10, overlap=2)
    sample_text = (
        "Langkah pertama troubleshooting OLT ZTE C320 adalah memeriksa status port PON. "
        "Jika status LOS menyala merah, periksa patch cord fiber optik pada ODF. "
        "Pastikan redaman optik berada di antara rentang -15 dBm hingga -27 dBm."
    )
    chunks = chunker.chunk_text(sample_text)
    assert len(chunks) >= 2
    for chunk in chunks:
        assert len(chunk.strip()) > 0


def test_chat_stream_request_schema():
    """Menguji validasi skema ChatStreamRequest."""
    req = ChatStreamRequest(
        message="Bagaimana cara cek OLT?",
        scope="OLT_DIAGNOSTICS",
        history=[
            ChatHistoryMessage(role="user", content="Halo"),
            ChatHistoryMessage(role="assistant", content="Halo, ada yang bisa dibantu?"),
        ],
    )
    assert req.message == "Bagaimana cara cek OLT?"
    assert req.scope == "OLT_DIAGNOSTICS"
    assert len(req.history) == 2
