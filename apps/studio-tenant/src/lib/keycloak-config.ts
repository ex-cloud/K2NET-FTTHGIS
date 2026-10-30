import type { KeycloakAuthConfig } from "@k2net/auth/client";

export const TENANT_SHARED_REALM = "k2net-tenants";

function getSlugFromHostname(hostname: string): string | null {
  if (hostname.endsWith(".kdua.net")) {
    const parts = hostname.split(".");
    if (parts.length === 3) {
      const sub = parts[0].toLowerCase();
      if (sub !== "system-gis" && sub !== "api-gis" && sub !== "auth-gis" && sub !== "gis") {
        return sub.endsWith("-gis") ? sub.slice(0, -4) : sub;
      }
    }
  }
  if (hostname.includes(".gis.kdua.net")) {
    const sub = hostname.split(".")[0]?.toLowerCase();
    if (sub && sub !== "system" && sub !== "api" && sub !== "gis") return sub;
  }
  if (hostname.includes("-gis.kdua.net")) {
    const sub = hostname.split("-gis")[0]?.toLowerCase();
    if (sub && sub !== "system" && sub !== "api") return sub;
  }
  if (hostname.includes(".localhost")) {
    const sub = hostname.split(".")[0]?.toLowerCase();
    if (sub && sub !== "system" && sub !== "api") return sub;
  }
  return null;
}

export function extractTenantSlug(): string {
  if (typeof window === "undefined") return "default";

  // 1. Support URL Search Params for local development / testing / preview (?tenant=slug or ?slug=slug)
  const searchParams = new URLSearchParams(window.location.search);
  const paramSlug = searchParams.get("tenant") || searchParams.get("slug");
  if (paramSlug && paramSlug !== "system" && paramSlug !== "api") {
    return paramSlug.trim().toLowerCase();
  }

  // 2. Production clean subdomain & backward-compatible hostnames
  const hostnameSlug = getSlugFromHostname(window.location.hostname);
  if (hostnameSlug) return hostnameSlug;

  return import.meta.env.VITE_DEFAULT_TENANT_SLUG || "default";
}

export interface ResolvedTenant {
  realmKey: string;
  organizationName: string;
  slug: string;
  targetSlug?: string | null;
  isAlias: boolean;
  planTier: string;
  status: string;
  logoUrl?: string | null;
}

export async function resolveTenantRealm(): Promise<{ realm: string; resolvedTenant?: ResolvedTenant }> {
  const currentSlug = extractTenantSlug();
  try {
    const res = await fetch(`/api/v1/auth/tenant-context?slug=${encodeURIComponent(currentSlug)}`);
    if (res.ok) {
      const data = await res.json();
      const resolvedTenant: ResolvedTenant = {
        realmKey: data.realmKey || TENANT_SHARED_REALM,
        organizationName: data.name || currentSlug,
        slug: data.slug || currentSlug,
        targetSlug: data.targetSlug || null,
        isAlias: Boolean(data.isAlias),
        planTier: data.plan || "FREE",
        status: data.status || "ACTIVE",
        logoUrl: data.logoUrl || null,
      };
      return {
        realm: resolvedTenant.realmKey,
        resolvedTenant,
      };
    }
  } catch {
    // Non-fatal fallback to shared tenant realm
  }
  return { realm: TENANT_SHARED_REALM };
}

export function getTenantKeycloakConfig(realmOverride?: string): KeycloakAuthConfig {
  const isDev = import.meta.env.DEV;
  const currentHost = typeof window !== "undefined" ? window.location.hostname : "localhost";

  let authServerUrl = "https://auth-gis.kdua.net";
  if (isDev && (currentHost === "localhost" || currentHost === "127.0.0.1")) {
    authServerUrl = import.meta.env.VITE_KEYCLOAK_URL || "https://auth-gis.kdua.net";
  }

  const effectiveRealm =
    realmOverride || import.meta.env.VITE_KEYCLOAK_REALM || TENANT_SHARED_REALM;

  return {
    url: authServerUrl,
    realm: effectiveRealm,
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "ftth-gis-frontend",
    plane: "TENANT",
    tenantSlug: extractTenantSlug(),
  };
}
