"use client";

import React from "react";
import { Laptop, Loader2, Fingerprint } from "lucide-react";

interface DeviceTrustBannerProps {
  sessionReady: boolean;
  browser: string;
  os: string;
  isTrustingDevice: boolean;
  onTrustDevice: () => void;
}

export function DeviceTrustBanner({
  sessionReady,
  browser,
  os,
  isTrustingDevice,
  onTrustDevice,
}: DeviceTrustBannerProps) {
  if (!sessionReady) {
    return (
      <div className="rounded-lg bg-muted/50 border border-border p-3 mb-6 animate-pulse">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-muted rounded" />
            <div>
              <div className="h-3 bg-muted rounded w-24 mb-1.5" />
              <div className="h-2 bg-muted rounded w-32" />
            </div>
          </div>
          <div className="h-6 w-20 bg-muted/40 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 border border-border p-3 text-xs text-foreground mb-6 transition-all duration-500 animate-in fade-in">
      <div className="flex items-center gap-3">
        <Laptop className="h-5 w-5 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-foreground">Perangkat Saat Ini</p>
          <p className="text-[10px] text-muted-foreground">{browser} ({os})</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onTrustDevice}
        disabled={isTrustingDevice}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold border rounded-lg transition-all shrink-0 ${
          isTrustingDevice
            ? "text-muted-foreground border-border bg-muted/30 cursor-not-allowed"
            : "text-primary border-primary/35 bg-primary/10 hover:bg-primary/20 hover:border-primary/50 hover:text-primary"
        }`}
      >
        {isTrustingDevice ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Memverifikasi...
          </>
        ) : (
          <>
            <Fingerprint className="h-3.5 w-3.5" />
            Percayai Perangkat
          </>
        )}
      </button>
    </div>
  );
}
