import type { KeycloakAuthConfig } from "@k2net/auth/client";

export function extractTenantSlug(): string {
  if (typeof window === "undefined") return "ftth-realm";
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

export function getTenantKeycloakConfig(): KeycloakAuthConfig {
  const isDev = import.meta.env.DEV;
  const currentHost = typeof window !== "undefined" ? window.location.hostname : "localhost";

  // Production vs local dev URL resolution
  let authServerUrl = "https://auth-gis.kdua.net";
  if (isDev && (currentHost === "localhost" || currentHost === "127.0.0.1")) {
    authServerUrl = import.meta.env.VITE_KEYCLOAK_URL || "https://auth-gis.kdua.net";
  }

  const dynamicRealm = extractTenantSlug();

  return {
    url: authServerUrl,
    realm: dynamicRealm,
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "ftth-gis-frontend",
  };
}
