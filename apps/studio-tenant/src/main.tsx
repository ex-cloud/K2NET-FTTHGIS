import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KeycloakProvider } from "@k2net/auth/client";
import { Toaster } from "sonner";
import { getTenantKeycloakConfig } from "./lib/keycloak-config";
import { setApiAuthToken } from "./lib/api-client";
import { App } from "./App";
import "./index.css";

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
  }
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <KeycloakProvider config={keycloakConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </KeycloakProvider>
  </React.StrictMode>
);
