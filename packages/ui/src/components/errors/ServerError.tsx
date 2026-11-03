"use client";

import React, { useState } from "react";
import { ServerCrash, RefreshCw, Copy, Check, Send } from "lucide-react";
import { Button } from "../button";
import { resolveErrorCopy, type ErrorLocale } from "./error-i18n";

export interface ServerErrorProps {
  statusCode?: number;
  error?: (Error & { digest?: string }) | null;
  reset?: () => void;
  onRetry?: () => void;
  title?: string;
  description?: string;
  retryLabel?: string;
  accessToken?: string;
  supportTicketUrl?: string;
  locale?: ErrorLocale;
}

export function ServerError({
  statusCode = 500,
  error,
  reset,
  onRetry,
  title,
  description,
  retryLabel,
  accessToken,
  supportTicketUrl = "/api/v1/tasks",
  locale,
}: ServerErrorProps) {
  const copy = resolveErrorCopy(locale);
  const [copied, setCopied] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const traceId = error?.digest || "unknown-trace";
  const handleRetryAction = onRetry || reset || (() => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  });

  const handleCopyTrace = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(traceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAutoReport = async () => {
    setIsReporting(true);
    setReportError(null);
    try {
      const payload = {
        type: "TICKET",
        scope: "TENANT_TO_PLATFORM",
        priority: "HIGH",
        title: `Auto-Report: ${statusCode} Internal Server Error`,
        description: `### Auto-Report ${statusCode}

**Trace ID / Digest:** \`${traceId}\`
**Message:** \`${error?.message || "No error message provided"}\`
**Path URL:** \`${typeof window !== "undefined" ? window.location.pathname : "N/A"}\`
**User Agent:** \`${typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}\`
**Timestamp:** \`${new Date().toISOString()}\``,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch(supportTicketUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setReported(true);
      } else {
        setReportError(copy.error500ReportFailed);
      }
    } catch {
      setReportError(copy.error500ReportNetworkError);
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-background via-muted/20 to-background z-0" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl z-0 pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-6 backdrop-blur-md bg-card/40 border border-border/80 p-8 rounded-2xl shadow-lg">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive shadow-inner mb-2 animate-pulse">
          <ServerCrash className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted border border-border text-[11px] font-mono text-muted-foreground">
            {copy.statusCodeLabel(statusCode)}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-destructive">{statusCode}</h1>
          <h2 className="text-xl font-bold tracking-tight text-foreground/90">{title || copy.error500Title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{description || copy.error500Desc}</p>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-muted border border-border text-xs text-foreground font-mono text-left">
          <div className="truncate flex-1">
            <span className="text-muted-foreground select-none">{copy.error500TraceLabel} </span>
            <code className="text-primary font-bold">{traceId}</code>
          </div>
          <button
            onClick={handleCopyTrace}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors shrink-0"
            title={copy.error500CopyTrace}
          >
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        {reportError && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-left">
            {reportError}
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleRetryAction}>
            <RefreshCw className="size-3.5" />
            {retryLabel || copy.error500RetryButton}
          </Button>

          <Button
            variant="default"
            size="sm"
            className="flex-1 gap-2"
            onClick={handleAutoReport}
            disabled={isReporting || reported}
          >
            {reported ? (
              <>
                <Check className="size-3.5 text-primary-foreground" />
                {copy.error500Reported}
              </>
            ) : isReporting ? (
              <>
                <RefreshCw className="size-3.5 animate-spin" />
                {copy.error500Reporting}
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                {copy.error500ReportButton}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
