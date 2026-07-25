"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SettingsFormRowProps {
  label: string;
  description?: string | React.ReactNode;
  children: React.ReactNode;
  divider?: boolean;
  className?: string;
  badge?: React.ReactNode;
}

export function SettingsFormRow({
  label,
  description,
  children,
  divider = true,
  className,
  badge,
}: SettingsFormRowProps) {
  return (
    <>
      <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-1", className)}>
        <div className="w-full sm:w-2/3 space-y-1 pr-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground tracking-tight">{label}</label>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
        <div className="w-full sm:w-1/3 flex sm:justify-end shrink-0">
          {children}
        </div>
      </div>
      {divider && <div className="h-[1px] w-full bg-border/40 my-4" />}
    </>
  );
}
