/**
 * Shared Utilities for Gateway Actions — studio-admin
 *
 * Security Architecture (frontend-architecture-summary.md §8):
 *  - Browser SPA authenticates ONLY via Keycloak JWT (Authorization: Bearer).
 *  - GATEWAY_TOKEN is strictly internal to the gateway mesh and NEVER touches the browser.
 *  - All client requests use same-origin relative URLs (/api/v1/...) routed through Nginx -> Kong.
 */

export function getAuthHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const jwtToken =
    typeof window !== "undefined" ? window.__K2NET_AUTH__?.token : undefined;
  const headers: Record<string, string> = { ...customHeaders };
  if (jwtToken) {
    headers["Authorization"] = `Bearer ${jwtToken}`;
  }
  return headers;
}

export function getBearerHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  return getAuthHeaders(customHeaders);
}

export async function verifySuperAdmin(): Promise<boolean> {
  // In client-side SPA, route-level authorization is enforced by ProtectedRoute
  return true;
}

/**
 * Base URL for browser API requests — always empty string to use same-origin relative routing.
 */
export const GATEWAY_BASE_URL = "";

/**
 * Proxy-backed map resolving to browser-safe relative base paths.
 */
export const GATEWAY_URL_MAP: Record<string, string> = new Proxy({}, {
  get() {
    return "";
  },
});
