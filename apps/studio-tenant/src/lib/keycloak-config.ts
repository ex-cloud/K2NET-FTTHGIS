import type { KeycloakAuthConfig } from "@k2net/auth/client";

export function getTenantKeycloakConfig(): KeycloakAuthConfig {
  const isDev = import.meta.env.DEV;
  const currentHost = typeof window !== "undefined" ? window.location.hostname : "localhost";

  // Production vs local dev URL resolution
  let authServerUrl = "https://auth-gis.kdua.net";
  if (isDev && (currentHost === "localhost" || currentHost === "127.0.0.1")) {
    authServerUrl = import.meta.env.VITE_KEYCLOAK_URL || "https://auth-gis.kdua.net";
  }

  return {
    url: authServerUrl,
    realm: import.meta.env.VITE_KEYCLOAK_REALM || "ftth-realm",
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "ftth-gis-frontend",
  };
}
