"use client";

import React from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "../button";

interface ForbiddenErrorProps {
  description?: string;
  backUrl?: string;
}

export function ForbiddenError({
  description = "Anda tidak memiliki hak akses atau izin yang diperlukan untuk melihat halaman ini.",
  backUrl = "/dashboard",
}: ForbiddenErrorProps) {
  const handleBack = () => {
    if (typeof window !== "undefined") {
      window.location.href = backUrl;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 relative overflow-hidden">
      {/* Background Gradient & Glow */}
      <div className="absolute inset-0 bg-linear-to-br from-background via-muted/20 to-background z-0" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-3xl z-0 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6 backdrop-blur-md bg-card/40 border border-border/80 p-8 rounded-2xl shadow-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 shadow-inner mb-2 animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-rose-500">403</h1>
          <h2 className="text-xl font-bold tracking-tight text-foreground/90">Akses Terbatas</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>

        {/* Audit Compliance Alert Banner */}
        <div className="text-[10px] bg-rose-500/5 border border-rose-500/20 text-rose-400 p-2.5 rounded-lg font-mono text-center">
          ⚠️ Insiden akses tidak sah ini dicatat di sistem audit trail pusat.
        </div>

        <div className="pt-4">
          <Button variant="outline" className="w-full gap-2" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
        </div>
      </div>
    </div>
  );
}
