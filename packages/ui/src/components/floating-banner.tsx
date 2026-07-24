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

  const cardClasses = {
    success: "bg-card border-emerald-500/20 text-foreground dark:bg-gradient-to-br dark:from-emerald-950/90 dark:via-teal-950/90 dark:to-zinc-950/90 dark:border-emerald-500/10 dark:text-emerald-100",
    warning: "bg-card border-amber-500/20 text-foreground dark:bg-gradient-to-br dark:from-amber-950/90 dark:via-orange-950/90 dark:to-zinc-950/90 dark:border-amber-500/10 dark:text-amber-100",
    error: "bg-card border-rose-500/20 text-foreground dark:bg-gradient-to-br dark:from-rose-950/90 dark:via-red-950/90 dark:to-zinc-950/90 dark:border-red-500/10 dark:text-red-100",
    info: "bg-card border-blue-500/20 text-foreground dark:bg-gradient-to-br dark:from-indigo-950/90 dark:via-blue-950/90 dark:to-zinc-950/90 dark:border-blue-500/10 dark:text-blue-100",
  };

  const badgeColors = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
    warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
    error: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30",
    info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
  };

  const btnColors = {
    success: "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-200 dark:border-emerald-500/30",
    warning: "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-200 dark:border-amber-500/30",
    error: "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 dark:text-rose-200 dark:border-rose-500/30",
    info: "bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 dark:text-blue-200 dark:border-blue-500/30",
  };

  const iconColors = {
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    error: "text-rose-600 dark:text-rose-400",
    info: "text-blue-600 dark:text-blue-400",
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 w-80 max-w-sm rounded-xl border p-4 shadow-2xl flex flex-col gap-3 transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in backdrop-blur-md",
        cardClasses[variant],
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
            <Sparkles className={cn("w-3.5 h-3.5 opacity-80", iconColors[variant])} />
          </div>
          <h4 className="text-xs font-semibold text-foreground dark:text-white tracking-tight mt-0.5">{title}</h4>
          <p className="text-[10px] text-muted-foreground dark:text-zinc-300 leading-relaxed font-normal">{description}</p>
        </div>

        <button
          onClick={handleClose}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors hover:bg-muted dark:hover:bg-white/10 shrink-0"
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
