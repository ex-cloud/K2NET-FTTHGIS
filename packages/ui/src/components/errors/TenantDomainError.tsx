"use client";

import React from "react";
import { Globe, ShieldAlert } from "lucide-react";
import { Button } from "../button";
import { resolveErrorCopy, type ErrorLocale } from "./error-i18n";

export interface TenantDomainErrorProps {
  statusCode?: number;
  subdomain?: string;
  supportEmail?: string;
  locale?: ErrorLocale;
}

export function TenantDomainError({
  statusCode = 404,
  subdomain,
  supportEmail = "support@kdua.net",
  locale,
}: TenantDomainErrorProps) {
  const copy = resolveErrorCopy(locale);

  const handleSupport = () => {
    if (typeof window !== "undefined") {
      window.location.href = `mailto:${supportEmail}?subject=Domain%20Resolution%20Issue%20-%20${subdomain || ""}`;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-background via-muted/20 to-background z-0" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-3xl z-0 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6 backdrop-blur-md bg-card/40 border border-border/80 p-8 rounded-2xl shadow-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted border border-border/50 text-destructive shadow-inner mb-2">
          <Globe className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted border border-border text-[11px] font-mono text-muted-foreground">
            {copy.statusCodeLabel(statusCode)}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">{statusCode}</h1>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
            {copy.tenant404Title} <ShieldAlert className="h-5 w-5 text-destructive animate-pulse" />
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {copy.tenant404DescPrefix}{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs">
              {subdomain || copy.tenant404DescFallback}
            </code>{" "}
            {copy.tenant404DescSuffix}
          </p>
        </div>

        <div className="pt-4 space-y-2.5">
          <Button variant="default" size="sm" className="w-full gap-2" onClick={handleSupport}>
            {copy.tenant404ContactSupport}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              if (typeof window !== "undefined") window.location.href = "https://kdua.net";
            }}
          >
            {copy.tenant404BackHome}
          </Button>
        </div>
      </div>
    </div>
  );
}
