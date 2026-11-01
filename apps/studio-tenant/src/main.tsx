import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KeycloakProvider } from "@k2net/auth/client";
import { Toaster } from "sonner";
import { getTenantKeycloakConfig } from "./lib/keycloak-config";
import { ThemeProvider } from "@k2net/ui";
import { I18nProvider } from "@k2net/i18n";
import { getImpersonationSessionId, setApiAuthToken } from "./lib/api-client";
import { initWebVitals } from "./lib/web-vitals";
import { ImpersonationProvider } from "./lib/useImpersonationSession";
import { App } from "./App";
import "./index.css";

// Initialize Core Web Vitals telemetry
initWebVitals();

// Canonical Subdomain Enforcement (Plan Pillar 2 / Option A):
// Any request reaching the tenant SPA via legacy patterns (*-gis.kdua.net or *.gis.kdua.net)
// is immediately and smoothly redirected to the canonical clean subdomain (*.kdua.net).
// This eliminates dual-domain leakage and ensures zero visual discrepancy.
if (typeof window !== "undefined") {
  const host = window.location.hostname.toLowerCase();
  const isLegacyTenantHost =
    (host.endsWith("-gis.kdua.net") || host.endsWith(".gis.kdua.net")) &&
    host !== "system-gis.kdua.net" &&
    host !== "auth-gis.kdua.net" &&
    host !== "api-gis.kdua.net" &&
    host !== "gis.kdua.net";

  if (isLegacyTenantHost) {
    let canonicalHost = host;
    if (canonicalHost.endsWith("-gis.kdua.net")) {
      canonicalHost = canonicalHost.replace(/-gis\.kdua\.net$/, ".kdua.net");
    } else if (canonicalHost.endsWith(".gis.kdua.net")) {
      canonicalHost = canonicalHost.replace(/\.gis\.kdua\.net$/, ".kdua.net");
    }
    const targetUrl = `${window.location.protocol}//${canonicalHost}${
      window.location.port ? `:${window.location.port}` : ""
    }${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(targetUrl);
  }
}

// Auto-reload on deployment chunk update (prevents "error loading dynamically imported module")
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", () => {
    const reloadKey = "chunk_preload_reload";
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, "true");
      window.location.reload();
    }
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

const keycloakConfig = getTenantKeycloakConfig();
keycloakConfig.onTokens = (tokens) => {
  if (tokens.token) {
    setApiAuthToken(tokens.token);
  } else if (!getImpersonationSessionId()) {
    setApiAuthToken(null);
  }
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="k2net-theme" enableSystem>
      <I18nProvider>
        <KeycloakProvider config={keycloakConfig}>
          <QueryClientProvider client={queryClient}>
            <ImpersonationProvider>
              <App />
              <Toaster position="top-right" richColors />
            </ImpersonationProvider>
          </QueryClientProvider>
        </KeycloakProvider>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>
);
