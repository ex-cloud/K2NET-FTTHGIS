import type { KeycloakAuthConfig } from "@k2net/auth/client";

export const TENANT_SHARED_REALM = "k2net-tenants";

export function extractTenantSlug(): string {
  if (typeof window === "undefined") return "default";

  // 1. Support URL Search Params for local development / testing / preview (?tenant=slug or ?slug=slug)
  const searchParams = new URLSearchParams(window.location.search);
  const paramSlug = searchParams.get("tenant") || searchParams.get("slug");
  if (paramSlug && paramSlug !== "system" && paramSlug !== "api") {
    return paramSlug.trim().toLowerCase();
  }

  const hostname = window.location.hostname;

  if (hostname.includes(".gis.kdua.net")) {
    const slug = hostname.split(".")[0];
    if (slug && slug !== "system" && slug !== "api" && slug !== "gis") {
      return slug.toLowerCase();
    }
  }
  if (hostname.includes("-gis.kdua.net")) {
    const slug = hostname.split("-gis")[0];
    if (slug && slug !== "system" && slug !== "api") {
      return slug.toLowerCase();
    }
  }
  if (hostname.includes(".localhost")) {
    const slug = hostname.split(".")[0];
    if (slug && slug !== "system" && slug !== "api") {
      return slug.toLowerCase();
    }
  }

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
