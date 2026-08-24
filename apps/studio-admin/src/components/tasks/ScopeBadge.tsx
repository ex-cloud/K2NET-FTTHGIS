import React from "react";
import { Building2, Cpu } from "lucide-react";

interface ScopeBadgeProps {
  scope?: string;
}

export function ScopeBadge({ scope }: ScopeBadgeProps) {
  if (scope === "TENANT_TO_PLATFORM") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
        <Building2 className="h-2.5 w-2.5" />
        B2B Mitra
      </span>
    );
  }
  if (scope === "PLATFORM_INTERNAL") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
        <Cpu className="h-2.5 w-2.5" />
        Platform Internal
      </span>
    );
  }
  return null;
}
