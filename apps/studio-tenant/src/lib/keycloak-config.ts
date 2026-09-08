import type { KeycloakAuthConfig } from "@k2net/auth/client";

export function extractTenantSlug(): string {
  if (typeof window === "undefined") return "ftth-realm";
  
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
      return slug;
    }
  }
  if (hostname.includes("-gis.kdua.net")) {
    const slug = hostname.split("-gis")[0];
    if (slug && slug !== "system" && slug !== "api") {
      return slug;
    }
  }
  if (hostname.includes(".localhost")) {
    const slug = hostname.split(".")[0];
    if (slug && slug !== "system" && slug !== "api") {
      return slug;
    }
  }
  return import.meta.env.VITE_KEYCLOAK_REALM || "ftth-realm";
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

  // If running in development on localhost or default system realm
  if (currentSlug === "ftth-realm" || currentSlug === "system" || !currentSlug) {
    return { realm: import.meta.env.VITE_KEYCLOAK_REALM || "ftth-realm" };
  }

  try {
    const res = await fetch(`/api/v1/public/organizations/resolve?slug=${encodeURIComponent(currentSlug)}`);
    if (res.ok) {
      const data: ResolvedTenant = await res.json();
      
      // If the slug is an alias of a migrated workspace, smoothly redirect to new domain
      if (data.isAlias && data.targetSlug && data.targetSlug !== currentSlug) {
        if (typeof window !== "undefined") {
          const newHost = window.location.host.replace(`${currentSlug}-gis`, `${data.targetSlug}-gis`);
          window.location.href = `${window.location.protocol}//${newHost}${window.location.pathname}${window.location.search}`;
        }
      }

      return {
        realm: data.realmKey || currentSlug,
        resolvedTenant: data,
      };
    }
  } catch (err) {
    console.warn("⚠️ Failed to resolve organization realm, falling back to slug:", err);
  }

  return { realm: currentSlug };
}

export function getTenantKeycloakConfig(realmOverride?: string): KeycloakAuthConfig {
  const isDev = import.meta.env.DEV;
  const currentHost = typeof window !== "undefined" ? window.location.hostname : "localhost";

  // Production vs local dev URL resolution
  let authServerUrl = "https://auth-gis.kdua.net";
  if (isDev && (currentHost === "localhost" || currentHost === "127.0.0.1")) {
    authServerUrl = import.meta.env.VITE_KEYCLOAK_URL || "https://auth-gis.kdua.net";
  }

  const effectiveRealm = realmOverride || extractTenantSlug();

  return {
    url: authServerUrl,
    realm: effectiveRealm,
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "ftth-gis-frontend",
  };
}
