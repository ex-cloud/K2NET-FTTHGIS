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

// Auto-reload on deployment chunk update (prevents "error loading dynamically imported module").
// Pattern: after each deployment, React.lazy() chunks get new hashes. If user navigates before
// refreshing, browser tries to load old chunk URLs → 404 → vite:preloadError fires.
//
// Guard logic:
//   - Set the guard KEY right before reloading to prevent infinite reload loops.
//   - CLEAR the guard on every successful startup (this module runs = app loaded fine).
//     This ensures that each new deployment's first chunk error will always trigger a reload.
if (typeof window !== "undefined") {
  const CHUNK_RELOAD_KEY = "vite_chunk_reload_guard";

  // ✅ Clear the guard on every successful app startup
  try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch { /* private mode */ }

  window.addEventListener("vite:preloadError", () => {
    try {
      if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
        // Set guard BEFORE reload to prevent infinite loop if reload itself fails
        sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
        window.location.reload();
      }
      // else: guard is set = we already reloaded once, don't loop
    } catch {
      // sessionStorage unavailable (private mode) — just reload once
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
