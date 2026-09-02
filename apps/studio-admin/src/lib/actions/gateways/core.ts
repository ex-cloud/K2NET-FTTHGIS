/**
 * Gateway Action Client — studio-admin
 *
 * Security Architecture:
 *  - Browser SPA authenticates ONLY via Keycloak JWT (Authorization: Bearer).
 *  - GATEWAY_TOKEN is strictly internal to the gateway mesh (env var on each Go service).
 *  - GATEWAY_TOKEN MUST NEVER be sent to or read by the browser.
 *  - All gateway-to-gateway calls requiring X-Gateway-Token are proxied through
 *    Spring Boot (/api/v1/system/gateway-*), which injects the token server-side.
 *
 * Data flow:
 *  Browser (JWT) → Nginx → Kong (JWT verify) → Spring Boot (X-Gateway-Token injection) → Go Gateway
 *
 * Reference: /opt/project5/docs/.../frontend-architecture-summary(1).md §8
 *   "GATEWAY_TOKEN hanya pernah hidup di dalam gateway mesh, tidak pernah menyentuh browser."
 */

import { verifySuperAdmin } from "./common";

export type ConfigEntry = {
  key: string;
  value: string;
  censored: string;
  section: string;
};

export type ConfigResponse = {
  status: string;
  sections: Record<string, ConfigEntry[]>;
};

export type GatewayServiceStatus = {
  name: string;
  port: number;
  active: boolean;
  status: string;
  latency?: number;
  throughput?: number;
};

export type StatusResponse = {
  status: string;
  services: GatewayServiceStatus[];
};

// ─── Shared: resolve Keycloak JWT from in-memory store ───────────────────────
function getBearerHeaders(): Record<string, string> {
  const jwtToken =
    typeof window !== "undefined" ? window.__K2NET_AUTH__?.token : undefined;
  const headers: Record<string, string> = {};
  if (jwtToken) {
    headers["Authorization"] = `Bearer ${jwtToken}`;
  }
  return headers;
}

// ─── Gateway Status ───────────────────────────────────────────────────────────

/**
 * Returns health status of all Go gateway services.
 *
 * Flow: Browser (JWT) → Kong → Spring Boot GatewayStatusController
 *       → notification-gateway:5001 (X-Gateway-Token, internal TCP dial to all peers)
 */
export async function getGatewayStatus(): Promise<StatusResponse> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/system/gateway-status`, {
    headers: getBearerHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch gateway status: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    status: data.status || "ok",
    services: (data.services || []).map((svc: GatewayServiceStatus) => ({
      ...svc,
      latency: svc.latency ?? 0,
      throughput: svc.throughput ?? 0,
    })),
  };
}

// ─── Gateway Config (Read) ────────────────────────────────────────────────────

/**
 * Fetches the (censored) .env config from any gateway by key.
 *
 * Flow: Browser (JWT) → Kong → Spring Boot GatewayConfigController
 *       → {gateway}:500x/api/v1/config (X-Gateway-Token, internal Docker)
 *
 * Valid keys: notification, payment, map, storage, whatsapp, scheduler, export, olt, audit
 */
export async function getGatewayConfigByKey(
  gatewayKey: string
): Promise<ConfigResponse> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/system/gateway-config/${encodeURIComponent(gatewayKey)}`, {
    headers: getBearerHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `[${gatewayKey}] Failed to fetch config: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}

/**
 * Updates config keys in any gateway by key.
 *
 * Flow: Browser (JWT) → Kong → Spring Boot GatewayConfigController
 *       → {gateway}:500x/api/v1/config (X-Gateway-Token, internal Docker)
 */
export async function updateGatewayConfigByKey(
  gatewayKey: string,
  updates: Record<string, string>
): Promise<{ status: string; message: string; keys_updated: number }> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/system/gateway-config/${encodeURIComponent(gatewayKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getBearerHeaders(),
    },
    body: JSON.stringify({ updates }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      errText ||
        `[${gatewayKey}] Failed to update config: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}

// ─── Legacy aliases (notification gateway only) ───────────────────────────────
// Kept for backward compatibility. Prefer getGatewayConfigByKey("notification").

/** @deprecated Use getGatewayConfigByKey("notification") instead */
export async function getGatewayConfig(): Promise<ConfigResponse> {
  return getGatewayConfigByKey("notification");
}

/** @deprecated Use updateGatewayConfigByKey("notification", updates) instead */
export async function updateGatewayConfig(
  updates: Record<string, string>
): Promise<{ status: string; message: string; keys_updated: number }> {
  return updateGatewayConfigByKey("notification", updates);
}
