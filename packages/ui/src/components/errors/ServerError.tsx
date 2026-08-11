"use client";

import React, { useState } from "react";
import { ServerCrash, RefreshCw, Copy, Check, Send } from "lucide-react";
import { Button } from "../button";

interface ServerErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  accessToken?: string;
  supportTicketUrl?: string;
}

export function ServerError({
  error,
  reset,
  accessToken,
  supportTicketUrl = "/api/v1/tasks",
}: ServerErrorProps) {
  const [copied, setCopied] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const traceId = error.digest || "unknown-trace";

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
        title: "Auto-Report: 500 Internal Server Error",
        description: `### 🚨 Laporan Gangguan Otomatis (Auto-Report 500)

**Trace ID / Digest:** \`${traceId}\`
**Pesan Error:** \`${error.message || "No error message provided"}\`
**Path URL:** \`${typeof window !== "undefined" ? window.location.pathname : "N/A"}\`
**Browser / User Agent:** \`${typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}\`
**Waktu Kejadian:** \`${new Date().toISOString()}\`

*Mohon segera ditindaklanjuti. Kendala ini memicu error boundary di sisi klien.*`,
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
        const errText = await res.text();
        console.error("Gagal mengirim tiket otomatis:", errText);
        setReportError("Gagal mengirim laporan otomatis ke pusat. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Kesalahan jaringan saat mengirim laporan:", err);
      setReportError("Kesalahan jaringan saat menghubungi pusat support.");
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-linear-to-br from-background via-muted/20 to-background z-0" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl z-0 pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-6 backdrop-blur-md bg-card/40 border border-border/80 p-8 rounded-2xl shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive shadow-inner mb-2 animate-pulse">
          <ServerCrash className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-destructive">500</h1>
          <h2 className="text-xl font-bold tracking-tight text-foreground/90">Koneksi Server Terputus</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Terjadi kesalahan internal pada server pusat saat memproses permintaan Anda. Sistem telah membatasi dampak kesalahan ini demi keamanan data Anda.
          </p>
        </div>

        {/* Trace ID box */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-muted border border-border text-xs text-foreground font-mono text-left">
          <div className="truncate flex-1">
            <span className="text-muted-foreground select-none">Trace ID: </span>
            <code className="text-primary font-bold">{traceId}</code>
          </div>
          <button
            onClick={handleCopyTrace}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors shrink-0"
            title="Salin Trace ID"
          >
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        {reportError && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-left">
            ⚠️ {reportError}
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={reset}>
            <RefreshCw className="w-4 h-4" />
            Coba Ulang Halaman
          </Button>

          <Button
            variant="default"
            className="flex-1 gap-2"
            onClick={handleAutoReport}
            disabled={isReporting || reported}
          >
            {reported ? (
              <>
                <Check className="w-4 h-4 text-primary-foreground" />
                Laporan Terkirim
              </>
            ) : isReporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Laporkan ke Pusat
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
