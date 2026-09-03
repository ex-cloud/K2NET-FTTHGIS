"use client";

import * as React from "react";
import { ShieldAlert, LogOut, Clock } from "lucide-react";
import { cn } from "../utils";

export interface ImpersonationBannerProps {
  tenantName: string;
  tenantSlug?: string;
  remainingSeconds: number;
  onExit: () => void;
  isExiting?: boolean;
  className?: string;
}

export function ImpersonationBanner({
  tenantName,
  tenantSlug,
  remainingSeconds: initialRemainingSeconds,
  onExit,
  isExiting = false,
  className,
}: ImpersonationBannerProps) {
  const [secondsLeft, setSecondsLeft] = React.useState(initialRemainingSeconds);

  React.useEffect(() => {
    setSecondsLeft(initialRemainingSeconds);
  }, [initialRemainingSeconds]);

  React.useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isUrgent = secondsLeft < 300; // < 5 menit

  return (
    <div
      role="alert"
      className={cn(
        "sticky top-0 z-50 flex items-center justify-between px-4 py-2 text-sm font-medium shadow-md transition-colors",
        isUrgent
          ? "bg-rose-600 text-white dark:bg-rose-950 dark:border-b dark:border-rose-800 dark:text-rose-100"
          : "bg-amber-600 text-white dark:bg-amber-950 dark:border-b dark:border-amber-800 dark:text-amber-100",
        className
      )}
    >
      <div className="flex items-center gap-2.5 truncate">
        <ShieldAlert className="h-5 w-5 shrink-0 animate-pulse text-amber-200 dark:text-amber-400" />
        <span className="truncate">
          <strong className="font-semibold uppercase tracking-wider text-amber-100 dark:text-amber-300">
            Mode Bantuan Dukungan:
          </strong>{" "}
          Mengimpersonasi <span className="underline font-semibold">{tenantName}</span>
          {tenantSlug ? ` (${tenantSlug})` : ""}
        </span>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5 font-mono text-xs bg-black/20 dark:bg-black/40 px-2.5 py-1 rounded-md">
          <Clock className="h-3.5 w-3.5 opacity-80" />
          <span>Sisa Waktu: <strong>{formatTime(secondsLeft)}</strong></span>
        </div>

        <button
          type="button"
          onClick={onExit}
          disabled={isExiting}
          className="inline-flex items-center gap-1.5 rounded-md bg-white text-stone-900 px-3 py-1 text-xs font-semibold shadow hover:bg-stone-100 dark:bg-stone-900 dark:text-white dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{isExiting ? "Keluar..." : "Keluar Sesi"}</span>
        </button>
      </div>
    </div>
  );
}
