"use client";

import React from "react";
import { ShieldAlert, LogIn } from "lucide-react";
import { Button } from "../button";
import { resolveErrorCopy, type ErrorLocale } from "./error-i18n";

export interface SessionExpiredErrorProps {
  statusCode?: number;
  title?: string;
  description?: string;
  loginUrl?: string;
  locale?: ErrorLocale;
  onRelogin?: () => void;
}

export function SessionExpiredError({
  statusCode = 419,
  title,
  description,
  loginUrl = "/login",
  locale,
  onRelogin,
}: SessionExpiredErrorProps) {
  const copy = resolveErrorCopy(locale);

  const resolvedTitle = title || copy.error419Title;
  const resolvedDesc = description || copy.error419Desc;

  const handleRelogin = () => {
    if (onRelogin) {
      onRelogin();
      return;
    }
    if (typeof window !== "undefined") {
      window.location.href = loginUrl;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-background via-muted/20 to-background z-0" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-3xl z-0 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6 backdrop-blur-md bg-card/40 border border-border/80 p-8 rounded-2xl shadow-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive shadow-inner mb-2">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted border border-border text-[11px] font-mono text-muted-foreground">
            {copy.statusCodeLabel(statusCode)}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-destructive">{statusCode}</h1>
          <h2 className="text-xl font-bold tracking-tight text-foreground/90">{resolvedTitle}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{resolvedDesc}</p>
        </div>

        <div className="pt-4">
          <Button variant="default" size="sm" className="w-full gap-2" onClick={handleRelogin}>
            <LogIn className="size-3.5" />
            {copy.error419ReloginButton}
          </Button>
        </div>
      </div>
    </div>
  );
}
