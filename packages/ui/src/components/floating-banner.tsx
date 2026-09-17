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
    success: "bg-card border-primary/20 text-foreground shadow-lg",
    warning: "bg-card border-amber-500/20 text-foreground shadow-lg",
    error: "bg-card border-destructive/20 text-foreground shadow-lg",
    info: "bg-card border-blue-500/20 text-foreground shadow-lg",
  };

  const badgeColors = {
    success: "bg-primary/10 text-primary border-primary/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    error: "bg-destructive/10 text-destructive border-destructive/20",
    info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  const btnColors = {
    success: "bg-primary text-primary-foreground hover:bg-primary/90",
    warning: "bg-amber-500 text-white hover:bg-amber-600",
    error: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    info: "bg-blue-500 text-white hover:bg-blue-600",
  };

  const iconColors = {
    success: "text-primary",
    warning: "text-amber-500",
    error: "text-destructive",
    info: "text-blue-500",
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 w-80 max-w-sm rounded-xl border p-4 shadow-lg flex flex-col gap-3 transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in backdrop-blur-md",
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
              <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded border tracking-wider uppercase", badgeColors[variant])}>
                {badgeText}
              </span>
            )}
            <Sparkles className={cn("w-3.5 h-3.5 opacity-80", iconColors[variant])} />
          </div>
          <h4 className="text-xs font-semibold text-foreground tracking-tight mt-0.5">{title}</h4>
          <p className="text-[10px] text-muted-foreground leading-relaxed font-normal">{description}</p>
        </div>

        <button
          onClick={handleClose}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors hover:bg-muted shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {actionText && (
        <button
          onClick={onAction}
          className={cn("relative z-10 text-[10px] font-medium py-1.5 px-3 rounded border text-center transition-all w-fit", btnColors[variant])}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
