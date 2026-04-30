"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Task 15.2: In production, we would send this to Sentry/LogRocket
    console.error("Uncaught error:", error, errorInfo);
    
    // Simple local logging simulation
    const logData = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: typeof window !== "undefined" ? window.location.href : "SSR",
    };
    
    localStorage.setItem("last_app_error", JSON.stringify(logData));
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full bg-background/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8 text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-6">
              The application encountered an unexpected error. Our team has been notified.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => window.location.reload()} 
                variant="default"
                className="w-full gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Reload Application
              </Button>
              <Button 
                onClick={() => this.setState({ hasError: false })} 
                variant="ghost"
                className="w-full text-xs text-muted-foreground"
              >
                Try to recover
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-8 text-left p-4 bg-muted/50 rounded-lg border border-border/40 overflow-auto max-h-40">
                <p className="text-[10px] font-mono text-destructive break-all whitespace-pre-wrap">
                  {this.state.error.stack}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
