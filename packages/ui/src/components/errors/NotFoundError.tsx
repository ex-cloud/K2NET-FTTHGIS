"use client";

import React from "react";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "../button";
import { resolveErrorCopy, type ErrorLocale } from "./error-i18n";

export interface NotFoundErrorProps {
  statusCode?: number;
  title?: string;
  description?: string;
  backUrl?: string;
  locale?: ErrorLocale;
}

export function NotFoundError({
  statusCode = 404,
  title,
  description,
  backUrl = "/",
  locale,
}: NotFoundErrorProps) {
  const copy = resolveErrorCopy(locale);

  const resolvedTitle = title || copy.error404Title;
  const resolvedDesc = description || copy.error404Desc;

  const handleBack = () => {
    if (typeof window !== "undefined") {
      window.location.href = backUrl;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-background via-muted/20 to-background z-0" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl z-0 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6 backdrop-blur-md bg-card/40 border border-border/80 p-8 rounded-2xl shadow-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted border border-border/50 text-muted-foreground shadow-inner mb-2">
          <FileQuestion className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted border border-border text-[11px] font-mono text-muted-foreground">
            {copy.statusCodeLabel(statusCode)}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">{statusCode}</h1>
          <h2 className="text-xl font-bold tracking-tight text-foreground/90">{resolvedTitle}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{resolvedDesc}</p>
        </div>

        <div className="pt-4">
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleBack}>
            <ArrowLeft className="size-3.5" />
            {copy.backButton}
          </Button>
        </div>
      </div>
    </div>
  );
}
