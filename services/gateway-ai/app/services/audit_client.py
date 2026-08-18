"""
K2NET FTTH AI Gateway — Centralized Audit Logger Client
Adheres to K2NET Audit Logging Standard (.agents rules):
- Fire-and-forget async HTTP request (non-blocking)
- Forwarded to gateway-audit (port 5009) via POST /api/v1/audit/events
- Graceful fallback: silently ignored on failure or when AUDIT_GATEWAY_URL is unset
"""
import asyncio
import httpx
import logging
from datetime import datetime, timezone
from typing import Optional, Any
import uuid

logger = logging.getLogger(__name__)


class AuditClient:
    """Async fire-and-forget audit event emitter for Python microservices."""

    def __init__(self, base_url: Optional[str] = None, token: Optional[str] = None):
        from app.core.config import settings
        self.base_url = base_url or settings.AUDIT_GATEWAY_URL
        self.token = token or settings.GATEWAY_INTERNAL_TOKEN
        self.service_source = "gateway-ai"
        self.disabled = not bool(self.base_url)

    def log(
        self,
        tenant_id: uuid.UUID,
        actor_id: Optional[str],
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        log_group: str = "OPERATIONS",
        metadata: Optional[dict[str, Any]] = None,
    ) -> None:
        """
        Kirim audit log secara asinkronus (background task / fire-and-forget).
        Tidak pernah memblokir eksekusi request utama.
        """
        if self.disabled:
            return

        payload = {
            "tenantSlug": str(tenant_id),
            "actorId": actor_id or "system",
            "action": action,
            "resourceType": resource_type,
            "resourceId": resource_id or "",
            "metadata": {
                **(metadata or {}),
                "logGroup": log_group,
                "serviceSource": self.service_source,
                "emittedAt": datetime.now(timezone.utc).isoformat(),
            },
        }

        # Spawn background coroutine without awaiting
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(self._send_event(payload))
            else:
                loop.run_until_complete(self._send_event(payload))
        except Exception as e:
            logger.warning(f"[auditclient] Failed to schedule audit event: {e}")

    async def _send_event(self, payload: dict) -> None:
        """Kirim event ke endpoint gateway-audit."""
        url = f"{self.base_url}/api/v1/audit/events"
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["X-Gateway-Token"] = self.token

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code >= 400:
                    logger.warning(
                        f"[auditclient] Audit event rejected: status={resp.status_code}, action={payload.get('action')}"
                    )
        except Exception as e:
            logger.warning(f"[auditclient] Failed to send audit event: {e}")


# Singleton instance
audit_client = AuditClient()
