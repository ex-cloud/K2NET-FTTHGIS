import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { KeycloakProvider } from "@k2net/auth/client";
import { ThemeProvider } from "@k2net/ui";
import { NetworkStatusIndicator } from "./components/NetworkStatusIndicator";
import { ErrorBoundary } from "./components/error-boundary";
import { Toaster } from "sonner";
import { getAdminKeycloakConfig } from "./lib/keycloak-config";
import { router } from "./router";
import "./index.css";

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

const keycloakConfig = getAdminKeycloakConfig();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <KeycloakProvider config={keycloakConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="k2net-admin-theme">
          <ErrorBoundary>
            <RouterProvider router={router} />
          </ErrorBoundary>
          <NetworkStatusIndicator />
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </QueryClientProvider>
    </KeycloakProvider>
  </React.StrictMode>
);
