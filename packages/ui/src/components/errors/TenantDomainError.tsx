"use client";

import React from "react";
import { Globe, ShieldAlert } from "lucide-react";
import { Button } from "../button";

interface TenantDomainErrorProps {
  subdomain?: string;
  supportEmail?: string;
}

export function TenantDomainError({
  subdomain,
  supportEmail = "support@kdua.net",
}: TenantDomainErrorProps) {
  const handleSupport = () => {
    if (typeof window !== "undefined") {
      window.location.href = `mailto:${supportEmail}?subject=Domain%20Resolution%20Issue%20-%20${subdomain || ""}`;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 relative overflow-hidden">
      {/* Background Gradient & Glow */}
      <div className="absolute inset-0 bg-linear-to-br from-background via-muted/20 to-background z-0" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-3xl z-0 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6 backdrop-blur-md bg-card/40 border border-border/80 p-8 rounded-2xl shadow-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted border border-border/50 text-destructive shadow-inner mb-2">
          <Globe className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
            Portal Tenant Tidak Ditemukan <ShieldAlert className="h-5 w-5 text-destructive animate-pulse" />
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Maaf, subdomain <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs">{subdomain || "yang Anda akses"}</code> tidak terdaftar, ditangguhkan, atau belum terkonfigurasi di sistem K2NET FTTH GIS.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <Button variant="default" className="w-full gap-2" onClick={handleSupport}>
            Hubungi Dukungan Platform
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => { if (typeof window !== "undefined") window.location.href = "https://kdua.net"; }}
          >
            Kembali Ke Beranda Utama
          </Button>
        </div>
      </div>
    </div>
  );
}
