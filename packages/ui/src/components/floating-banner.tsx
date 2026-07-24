"use client";

import * as React from "react";
import { X, Sparkles } from "lucide-react";
import { cn } from "../utils";

export interface FloatingBannerProps {
  title: string;
  description: string;
  badgeText?: string;
  variant?: "success" | "warning" | "error" | "info";
  actionText?: string;
  onAction?: () => void;
  storageKey?: string;
  onClose?: () => void;
  className?: string;
}

export function FloatingBanner({
  title,
  description,
  badgeText,
  variant = "info",
  actionText,
  onAction,
  storageKey,
  onClose,
  className,
}: FloatingBannerProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    if (storageKey) {
      const dismissed = localStorage.getItem(storageKey);
      if (!dismissed) {
        setIsVisible(true);
      }
    } else {
      setIsVisible(true);
    }
  }, [storageKey]);

  if (!isMounted || !isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    if (storageKey) {
      localStorage.setItem(storageKey, "true");
    }
    if (onClose) {
      onClose();
    }
  };

  const gradientClasses = {
    success: "from-emerald-950/95 via-teal-950/95 to-zinc-950/95 border-emerald-500/20 text-emerald-100",
    warning: "from-amber-950/95 via-orange-950/95 to-zinc-950/95 border-amber-500/20 text-amber-100",
    error: "from-rose-950/95 via-red-950/95 to-zinc-950/95 border-red-500/20 text-red-100",
    info: "from-indigo-950/95 via-blue-950/95 to-zinc-950/95 border-blue-500/20 text-blue-100",
  };

  const badgeColors = {
    success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    error: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    info: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  };

  const btnColors = {
    success: "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-500/30",
    warning: "bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/30",
    error: "bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/30",
    info: "bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border-blue-500/30",
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 w-80 max-w-sm rounded-xl border p-4 bg-gradient-to-br shadow-2xl flex flex-col gap-3 transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in backdrop-blur-md",
        gradientClasses[variant],
        className
      )}
    >
      {/* Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none rounded-xl overflow-hidden"
           style={{
             backgroundImage: "radial-gradient(circle at 100% 100%, var(--foreground) 1px, transparent 1px)",
             backgroundSize: "12px 12px",
           }}
      />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex items-center gap-2">
            {badgeText && (
              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border tracking-wider uppercase", badgeColors[variant])}>
                {badgeText}
              </span>
            )}
            <Sparkles className="w-3.5 h-3.5 opacity-80" />
          </div>
          <h4 className="text-xs font-semibold text-white tracking-tight mt-0.5">{title}</h4>
          <p className="text-[10px] text-zinc-300 leading-relaxed font-normal">{description}</p>
        </div>

        <button
          onClick={handleClose}
          className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors hover:bg-white/10 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {actionText && (
        <button
          onClick={onAction}
          className={cn("relative z-10 text-[10px] font-semibold py-1.5 px-3 rounded border text-center transition-all w-fit", btnColors[variant])}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
