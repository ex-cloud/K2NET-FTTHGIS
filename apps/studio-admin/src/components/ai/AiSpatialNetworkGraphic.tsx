"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AiSpatialNetworkGraphicProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * AiSpatialNetworkGraphic
 * Minimalist, elegant spatial GIS map graphic with centralized point-to-point
 * network interconnection and gentle, subtle animated pulses.
 * Designed with soft transparency and theme-aware semantic tokens.
 */
export function AiSpatialNetworkGraphic({
  className,
  size = "md",
}: AiSpatialNetworkGraphicProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-24 h-24",
  };

  return (
    <div
      className={cn(
        "relative rounded-3xl p-1.5 flex items-center justify-center select-none overflow-hidden",
        "bg-primary/[0.04] dark:bg-primary/[0.08] border border-primary/20",
        "shadow-sm shadow-primary/5 backdrop-blur-xs",
        sizeClasses[size],
        className
      )}
    >
      {/* SVG Topology & Point-to-Point Network */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-primary"
      >
        <defs>
          {/* Radial glow for center hub */}
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>

          {/* Linear gradient for feeder cable links */}
          <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
          </linearGradient>

          {/* Filter for soft glow */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── 1. Subtle Spatial Map Grid & Contour Rings ── */}
        {/* Outer Contour Ring */}
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke="currentColor"
          strokeWidth="0.75"
          strokeDasharray="2 3"
          className="opacity-20 dark:opacity-25"
        />

        {/* Middle Buffer Ring */}
        <circle
          cx="50"
          cy="50"
          r="26"
          stroke="currentColor"
          strokeWidth="0.75"
          className="opacity-15 dark:opacity-20"
        />

        {/* Subtle Map Lattice Coordinates */}
        <line x1="50" y1="8" x2="50" y2="92" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 4" className="opacity-15" />
        <line x1="8" y1="50" x2="92" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 4" className="opacity-15" />

        {/* ── 2. Concentric Radar Pulse Animation (Gentle & Smooth) ── */}
        <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="0.8" fill="none" className="opacity-0">
          <animate attributeName="r" values="8; 38" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.45; 0" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="0.6" fill="none" className="opacity-0">
          <animate attributeName="r" values="8; 38" dur="4s" begin="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35; 0" dur="4s" begin="2s" repeatCount="indefinite" />
        </circle>

        {/* ── 3. Point-to-Point Interconnection Links (Lines from Central Node) ── */}
        {/* Link to Top Node (50, 18) */}
        <line x1="50" y1="50" x2="50" y2="18" stroke="currentColor" strokeWidth="1.2" className="opacity-40 dark:opacity-50" />
        
        {/* Link to Top-Right Node (78, 32) */}
        <line x1="50" y1="50" x2="78" y2="32" stroke="currentColor" strokeWidth="1.2" className="opacity-40 dark:opacity-50" />

        {/* Link to Bottom-Right Node (74, 74) */}
        <line x1="50" y1="50" x2="74" y2="74" stroke="currentColor" strokeWidth="1.2" className="opacity-40 dark:opacity-50" />

        {/* Link to Bottom-Left Node (26, 74) */}
        <line x1="50" y1="50" x2="26" y2="74" stroke="currentColor" strokeWidth="1.2" className="opacity-40 dark:opacity-50" />

        {/* Link to Top-Left Node (22, 32) */}
        <line x1="50" y1="50" x2="22" y2="32" stroke="currentColor" strokeWidth="1.2" className="opacity-40 dark:opacity-50" />

        {/* Inter-Node Mesh Links (Peripheral Ring) */}
        <polygon
          points="50,18 78,32 74,74 26,74 22,32"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          strokeDasharray="2 2"
          className="opacity-20 dark:opacity-25"
        />

        {/* ── 4. Animated Data Packets / Pulses on Fiber Links ── */}
        {/* Packet: Center -> Top */}
        <circle r="1.5" fill="currentColor" className="opacity-90">
          <animateMotion path="M 50 50 L 50 18" dur="2.4s" repeatCount="indefinite" />
        </circle>

        {/* Packet: Center -> Top-Right */}
        <circle r="1.5" fill="currentColor" className="opacity-90">
          <animateMotion path="M 50 50 L 78 32" dur="2.8s" begin="0.6s" repeatCount="indefinite" />
        </circle>

        {/* Packet: Center -> Bottom-Right */}
        <circle r="1.5" fill="currentColor" className="opacity-90">
          <animateMotion path="M 50 50 L 74 74" dur="3.2s" begin="1.2s" repeatCount="indefinite" />
        </circle>

        {/* Packet: Center -> Bottom-Left */}
        <circle r="1.5" fill="currentColor" className="opacity-90">
          <animateMotion path="M 50 50 L 26 74" dur="2.6s" begin="0.4s" repeatCount="indefinite" />
        </circle>

        {/* Packet: Center -> Top-Left */}
        <circle r="1.5" fill="currentColor" className="opacity-90">
          <animateMotion path="M 50 50 L 22 32" dur="3.0s" begin="1.6s" repeatCount="indefinite" />
        </circle>

        {/* ── 5. Peripheral Sub-Nodes (ODC / ODP / Towers) ── */}
        {/* Top Node */}
        <circle cx="50" cy="18" r="3.2" fill="var(--background)" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="50" cy="18" r="1.4" fill="currentColor" />

        {/* Top-Right Node */}
        <circle cx="78" cy="32" r="3.2" fill="var(--background)" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="78" cy="32" r="1.4" fill="currentColor" />

        {/* Bottom-Right Node */}
        <circle cx="74" cy="74" r="3.2" fill="var(--background)" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="74" cy="74" r="1.4" fill="currentColor" />

        {/* Bottom-Left Node */}
        <circle cx="26" cy="74" r="3.2" fill="var(--background)" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="26" cy="74" r="1.4" fill="currentColor" />

        {/* Top-Left Node */}
        <circle cx="22" cy="32" r="3.2" fill="var(--background)" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="22" cy="32" r="1.4" fill="currentColor" />

        {/* ── 6. Central Core Hub Node (Central OLT Headend) ── */}
        {/* Core Hub Glow */}
        <circle cx="50" cy="50" r="10" fill="url(#centerGlow)" />

        {/* Core Hub Outer Ring */}
        <circle
          cx="50"
          cy="50"
          r="5.5"
          fill="var(--background)"
          stroke="currentColor"
          strokeWidth="2"
          filter="url(#softGlow)"
        />

        {/* Core Hub Active Center Dot */}
        <circle cx="50" cy="50" r="2.8" fill="currentColor" />
      </svg>
    </div>
  );
}
