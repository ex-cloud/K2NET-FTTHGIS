import React from "react";
import { Building2, Cpu } from "lucide-react";

interface ScopeBadgeProps {
  scope?: string;
}

export function ScopeBadge({ scope }: ScopeBadgeProps) {
  if (scope === "TENANT_TO_PLATFORM") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-semibold bg-violet-500/10 text-violet-500 border border-violet-500/20">
        <Building2 className="h-2.5 w-2.5" />
        B2B
      </span>
    );
  }
  if (scope === "PLATFORM_INTERNAL") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
        <Cpu className="h-2.5 w-2.5" />
        Internal
      </span>
    );
  }
  return null;
}
