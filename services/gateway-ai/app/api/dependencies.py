"""
K2NET FTTH AI Gateway — FastAPI Dependencies
Multi-Tenant ABAC: Validasi X-Gateway-Token + Ekstraksi X-Tenant-ID
"""
from fastapi import Header, HTTPException, status
from typing import NamedTuple, Optional
import uuid


class TenantContext(NamedTuple):
    tenant_id: uuid.UUID
    actor_id: Optional[str]
    actor_role: Optional[str]


async def verify_gateway_and_tenant(
    x_gateway_token: Optional[str] = Header(None, alias="X-Gateway-Token"),
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    x_actor_id: Optional[str] = Header(None, alias="X-Actor-ID"),
    x_actor_role: Optional[str] = Header(None, alias="X-Actor-Role"),
) -> TenantContext:
    """
    Dependency utama untuk semua endpoint terproteksi.
    Kong API Gateway meng-inject header ini setelah memvalidasi JWT Keycloak.
    
    Alur Validasi:
    1. Cek X-Gateway-Token match dengan GATEWAY_INTERNAL_TOKEN
    2. Cek keberadaan X-Tenant-ID
    3. Validasi format UUID dari X-Tenant-ID
    """
    from app.core.config import settings

    # 1. Validasi Token Internal Gateway (dari Kong)
    if settings.GATEWAY_INTERNAL_TOKEN and x_gateway_token != settings.GATEWAY_INTERNAL_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid or missing internal gateway token",
        )

    # 2. Validasi keberadaan Tenant ID (fallback ke Global Platform Scope jika kosong)
    if not x_tenant_id or x_tenant_id.strip() == "" or x_tenant_id == "null":
        tenant_uuid = uuid.UUID("00000000-0000-0000-0000-000000000000")
    else:
        try:
            tenant_uuid = uuid.UUID(x_tenant_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Bad Request: Malformed X-Tenant-ID — not a valid UUID: '{x_tenant_id}'",
            )

    return TenantContext(
        tenant_id=tenant_uuid,
        actor_id=x_actor_id,
        actor_role=x_actor_role,
    )
