import React from "react";
import { cn } from "../../utils";
import { Skeleton } from "../skeleton";

export type AuthSkeletonVariant = "login" | "reset-password" | "activate" | "invite";

export interface AuthCardFormSkeletonProps {
  variant?: AuthSkeletonVariant;
  className?: string;
}

/**
 * Contextual skeleton for the inner auth form card (Login, Reset Password, Activate, Invite Accept).
 * Used both inside the full-page <AuthLoginSkeleton /> and when validating security tokens.
 */
export function AuthCardFormSkeleton({
  variant = "login",
  className,
}: AuthCardFormSkeletonProps) {
  if (variant === "reset-password" || variant === "activate" || variant === "invite") {
    return (
      <div
        className={cn(
          "w-full rounded-2xl border border-border/80 bg-card/50 p-5 sm:p-6 space-y-5 shadow-xs",
          className
        )}
      >
        {/* Card Header Metadata */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-56 max-w-full rounded-md" />
        </div>

        {/* Workspace / Organization summary pill for activate & invite */}
        {(variant === "activate" || variant === "invite") && (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-3.5 w-32 rounded" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3.5 w-36 rounded" />
            </div>
          </div>
        )}

        {/* Password Input Fields */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-9 w-full rounded-lg border border-border/50 bg-background/50" />
          </div>

          {/* 4-Bar Strength Meter + Checklist Skeleton */}
          <div className="space-y-2 pt-0.5">
            <div className="grid grid-cols-4 gap-1.5">
              <Skeleton className="h-1 w-full rounded-full" />
              <Skeleton className="h-1 w-full rounded-full" />
              <Skeleton className="h-1 w-full rounded-full" />
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <Skeleton className="h-2.5 w-28 rounded" />
              <Skeleton className="h-2.5 w-24 rounded" />
              <Skeleton className="h-2.5 w-24 rounded" />
              <Skeleton className="h-2.5 w-28 rounded" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-9 w-full rounded-lg border border-border/50 bg-background/50" />
          </div>
        </div>

        {/* Submit Action Button */}
        <Skeleton className="h-8 w-full rounded-lg bg-primary/20" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-border/80 bg-card/50 p-5 sm:p-6 space-y-4 shadow-xs",
        className
      )}
    >
      {/* Account Email or Username Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-4 w-14 rounded-md" />
        </div>
        <div className="h-9 w-full rounded-lg border border-border/60 bg-background/60 px-3 flex items-center gap-2.5">
          <Skeleton className="h-3.5 w-3.5 rounded-xs shrink-0" />
          <Skeleton className="h-3 w-44 rounded" />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <div className="h-9 w-full rounded-lg border border-border/60 bg-background/60 px-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-3.5 w-3.5 rounded-xs shrink-0" />
            <Skeleton className="h-2.5 w-28 rounded" />
          </div>
          <Skeleton className="h-3.5 w-3.5 rounded-xs shrink-0" />
        </div>
      </div>

      {/* Remember Me & Save Profile Checkboxes */}
      <div className="space-y-2 pt-0.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-3.5 rounded-xs shrink-0" />
          <Skeleton className="h-3 w-52 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-3.5 rounded-xs shrink-0" />
          <Skeleton className="h-3 w-40 rounded" />
        </div>
      </div>

      {/* Cloudflare Turnstile Verification Box Skeleton */}
      <div className="h-[65px] w-full rounded-lg border border-border/60 bg-background/40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded-md shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-2 w-16 rounded" />
          </div>
        </div>
        <Skeleton className="h-6 w-14 rounded" />
      </div>

      {/* Primary Sign-In Button Skeleton */}
      <Skeleton className="h-9 w-full rounded-lg bg-primary/20" />
    </div>
  );
}

export interface AuthLoginSkeletonProps {
  variant?: AuthSkeletonVariant;
  hideMobileHero?: boolean;
}

/**
 * Full-screen split-layout skeleton matching <AuthLoginLayout /> + <FtthTopologyFlow />.
 * Eliminates blank screens and generic spinners during route chunk loading or tenant discovery.
 */
export function AuthLoginSkeleton({
  variant = "login",
  hideMobileHero = false,
}: AuthLoginSkeletonProps) {
  return (
    <div
      className="min-h-screen w-full flex bg-background text-foreground antialiased font-sans select-none overflow-hidden"
      aria-busy="true"
      aria-label="Loading authentication workspace"
    >
      {/* ─── LEFT COLUMN: Login Form & Header Skeleton (40%) ───────────── */}
      <div className="w-full lg:w-[40%] xl:w-[40%] flex flex-col justify-between p-4 sm:p-10 md:p-14 relative bg-sidebar border-r border-border/90 z-10">
        {/* Top Header Row (Brand Logo + Language Switcher + Theme Toggle) */}
        <div className="flex items-center justify-between w-full z-20 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Skeleton className="h-6 w-6 rounded-md shrink-0" />
            <Skeleton className="h-3.5 w-32 rounded-md" />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>

        {/* Center Form Area */}
        <div className="w-full max-w-sm mx-auto my-auto py-8 z-20 space-y-5">
          {/* Mobile Isometric 3D Placeholder (visible only on mobile) */}
          {!hideMobileHero && (
            <div className="lg:hidden flex flex-col items-center justify-center -mt-2 mb-1">
              <div className="w-[140px] h-[120px] flex items-center justify-center">
                <div className="w-20 h-20 rounded-2xl border border-border/60 bg-muted/20 rotate-12 flex items-center justify-center animate-pulse">
                  <div className="w-10 h-10 rounded-lg border border-border/80 bg-muted/40 -rotate-12" />
                </div>
              </div>
            </div>
          )}

          {/* Welcome Heading & Subtitle */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-3.5 w-64 max-w-full rounded-md" />
          </div>

          {/* Contextual Form Card Skeleton */}
          <AuthCardFormSkeleton variant={variant} />
        </div>

        {/* Bottom Footer Row */}
        <div className="z-20 flex flex-col gap-2 border-t border-border/90 pt-5">
          <Skeleton className="h-3 w-72 max-w-full rounded" />
          <Skeleton className="h-2.5 w-56 max-w-full rounded" />
        </div>
      </div>

      {/* ─── RIGHT COLUMN: FTTH Topology Flow Canvas Skeleton (60%) ────── */}
      <div className="hidden lg:flex flex-1 bg-background flex-col justify-between p-10 xl:p-14 relative overflow-hidden">
        {/* Peripheral Corner Dot-Matrix Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08] dark:opacity-[0.12]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(ellipse at 50% 50%, transparent 42%, black 82%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, transparent 42%, black 82%)",
          }}
        />

        {/* Top Right: System Docs Button Skeleton */}
        <div className="w-full flex justify-end z-10">
          <Skeleton className="h-8 w-28 rounded-md border border-border/60 bg-card/50" />
        </div>

        {/* Center Hero: Proportion-Accurate Topology Diagram Skeleton */}
        <div className="my-auto flex flex-col items-center justify-center py-2 w-full z-10">
          <div className="w-full max-w-[1060px] px-1 flex justify-center">
            <div className="relative w-full aspect-[700/330] select-none">
              {/* Orthogonal SVG Wireframe Lines */}
              <svg
                viewBox="0 0 700 330"
                className="w-full h-full overflow-visible pointer-events-none opacity-40"
                fill="none"
              >
                <path
                  d="M 271 58 L 620 58 Q 632 58 632 70 L 632 175"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border"
                />
                <path
                  d="M 271 96 L 502 96 Q 514 96 514 108 L 514 175"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border"
                />
                <path
                  d="M 271 134 L 384 134 Q 396 134 396 146 L 396 175"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border"
                />
                <path
                  d="M 632 271 L 632 290 Q 632 302 620 302 L 154 302 Q 142 302 142 290 L 142 175"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  className="text-border"
                />
              </svg>

              {/* Main Trigger Container Skeleton (Top-Left: x=30, y=32, w=224, h=128) */}
              <div
                style={{
                  left: "4.285%",
                  top: "9.696%",
                  width: "32%",
                  height: "38.787%",
                }}
                className="absolute rounded-[11px] bg-card/80 border border-border p-[7px] flex flex-col justify-between shadow-sm"
              >
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="w-full h-[30%] rounded-[6px] bg-secondary/50 border border-border/80 px-2.5 flex items-center gap-2"
                  >
                    <Skeleton className="h-3 w-3 rounded-xs shrink-0" />
                    <Skeleton className="h-2.5 w-32 rounded" />
                  </div>
                ))}
              </div>

              {/* 3 Processor Nodes Skeleton (Bottom-Right) */}
              {[356, 474, 592].map((xPos, idx) => (
                <div
                  key={idx}
                  style={{
                    left: `${(xPos / 700) * 100}%`,
                    top: `${(183 / 330) * 100}%`,
                    width: `${(80 / 700) * 100}%`,
                    height: `${(80 / 330) * 100}%`,
                  }}
                  className="absolute rounded-[11px] border border-dashed border-border/75 p-[6px] flex items-center justify-center"
                >
                  <div className="w-full h-full rounded-[7px] bg-card/85 border border-border p-2.5 flex items-start justify-start shadow-xs animate-pulse">
                    <div className="grid grid-cols-4 gap-[3px]">
                      {Array.from({ length: 16 }).map((_, dotIdx) => (
                        <div
                          key={dotIdx}
                          className="w-[2.5px] h-[2.5px] rounded-full bg-muted-foreground/35"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
}

