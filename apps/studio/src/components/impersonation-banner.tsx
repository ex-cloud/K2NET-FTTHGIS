"use client";

import React from "react";
import { useImpersonation } from "@/hooks/use-impersonation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@k2net/ui";

export function ImpersonationBanner() {
  const { isImpersonating, orgName, exitImpersonation } = useImpersonation();

  if (!isImpersonating) return null;

  return (
    <div className="w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-500 px-4 py-2 text-xs z-50 flex items-center justify-between font-medium backdrop-blur-md shrink-0">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
        <span>
          <strong className="font-bold uppercase tracking-wide">AUDIT MODE ACTIVE:</strong> Anda sedang melihat workspace sebagai{" "}
          <span className="underline font-semibold">{orgName}</span>. Semua tindakan write/edit dinonaktifkan secara aman.
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={exitImpersonation}
        className="h-7 px-3 text-[11px] border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-semibold gap-1.5 shrink-0"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Exit Impersonation
      </Button>
    </div>
  );
}
