

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { ServerError } from "@k2net/ui";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const message = error?.message || "";
    const isChunkError =
      message.includes("dynamically imported module") ||
      message.includes("Loading chunk") ||
      message.includes("Failed to fetch dynamically imported module");

    if (isChunkError && typeof window !== "undefined") {
      const reloadKey = "chunk_load_error_reload";
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "true");
        window.location.reload();
        return;
      }
    }

    // Task 15.2: In production, we would send this to Sentry/LogRocket
    console.error("Uncaught error:", error, errorInfo);
    
    // Security: Only store minimal, non-sensitive error info in localStorage.
    // Stack traces and componentStack are EXCLUDED to prevent information disclosure
    // (sensitive file paths, library internals, component tree structure).
    const logData = {
      timestamp: new Date().toISOString(),
      message: error.message,
      // Sanitized: no stack, no componentStack
      url: typeof window !== "undefined" ? window.location.pathname : "unknown",
      errorCode: error.name || "UnknownError",
    };
    
    localStorage.setItem("last_app_error", JSON.stringify(logData));
  }

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ServerError
          statusCode={500}
          error={this.state.error}
          onRetry={() => {
            this.setState({ hasError: false, error: null });
            window.location.reload();
          }}
        />
      );
    }

    return this.props.children;
  }
}
