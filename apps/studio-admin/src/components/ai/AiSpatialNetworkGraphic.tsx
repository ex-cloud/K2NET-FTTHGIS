"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AiSpatialNetworkGraphicProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * AiSpatialNetworkGraphic
 * High-fidelity GIS City Map Network Topology with Centralized Point-to-Point
 * Interconnections matching the reference design:
 * - City/regional map boundary silhouette with subtle internal road grids.
 * - Glowing central core server hub at the center.
 * - 16 radial point-to-point fiber distribution links to perimeter nodes.
 * - Subtle, gentle animated data pulses.
 * - Semi-transparent glassmorphism with dark/light mode compatibility.
 */
export function AiSpatialNetworkGraphic({
  className,
  size = "md",
}: AiSpatialNetworkGraphicProps) {
  const sizeClasses = {
    sm: "w-full max-w-[260px] h-[150px]",
    md: "w-full max-w-[320px] h-[190px]",
    lg: "w-full max-w-[380px] h-[220px]",
  };

  // 16 radial node coordinates around the city map perimeter (relative to center 250, 170)
  const nodes = [
    { id: "n1",  x: 250, y: 48,  delay: "0.0s" },
    { id: "n2",  x: 288, y: 55,  delay: "0.4s" },
    { id: "n3",  x: 326, y: 72,  delay: "0.8s" },
    { id: "n4",  x: 365, y: 102, delay: "1.2s" },
    { id: "n5",  x: 410, y: 155, delay: "1.6s" },
    { id: "n6",  x: 382, y: 215, delay: "0.2s" },
    { id: "n7",  x: 350, y: 260, delay: "0.6s" },
    { id: "n8",  x: 295, y: 295, delay: "1.0s" },
    { id: "n9",  x: 245, y: 300, delay: "1.4s" },
    { id: "n10", x: 198, y: 288, delay: "1.8s" },
    { id: "n11", x: 145, y: 255, delay: "0.3s" },
    { id: "n12", x: 105, y: 215, delay: "0.7s" },
    { id: "n13", x: 80,  y: 160, delay: "1.1s" },
    { id: "n14", x: 105, y: 108, delay: "1.5s" },
    { id: "n15", x: 148, y: 72,  delay: "0.5s" },
    { id: "n16", x: 202, y: 54,  delay: "0.9s" },
  ];

  return (
    <div
      className={cn(
        "relative rounded-2xl p-2 flex items-center justify-center select-none overflow-hidden mx-auto",
        "bg-primary/[0.03] dark:bg-primary/[0.06] border border-primary/15",
        "shadow-xs shadow-primary/5 backdrop-blur-xs transition-all duration-300",
        sizeClasses[size],
        className
      )}
    >
      <svg
        viewBox="0 0 500 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-primary"
      >
        <defs>
          {/* Subtle glow for center hub */}
          <radialGradient id="centerHubGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="60%" stopColor="currentColor" stopOpacity="0.08" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>

          {/* Map Fill Gradient */}
          <linearGradient id="mapPolygonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.06" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>

          {/* Soft Filter for Core Node */}
          <filter id="coreGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── 1. City / Regional Map Boundary Silhouette ── */}
        <path
          d="M 50 65 
             C 80 50, 130 55, 175 60
             C 210 52, 250 50, 290 56
             C 330 50, 380 58, 430 45
             C 455 40, 465 65, 450 95
             C 435 125, 440 160, 430 190
             C 420 220, 395 250, 370 270
             C 350 285, 335 310, 305 320
             C 275 330, 240 325, 220 315
             C 200 305, 185 285, 170 270
             C 155 255, 130 245, 100 240
             C 70 235, 55 200, 50 170
             C 45 140, 40 100, 50 65 Z"
          fill="url(#mapPolygonGrad)"
          stroke="currentColor"
          strokeWidth="1.2"
          className="opacity-40 dark:opacity-50"
        />

        {/* ── 2. Internal Arterial Road Network Lines (Subtle GIS Street Layer) ── */}
        <g stroke="currentColor" strokeWidth="0.75" className="opacity-20 dark:opacity-25">
          {/* Main East-West Highway */}
          <path d="M 50 130 Q 150 145, 250 150 T 435 140" fill="none" />
          <path d="M 60 190 Q 170 185, 250 190 T 410 205" fill="none" />
          {/* Main North-South Arterial */}
          <path d="M 230 55 Q 235 150, 240 250 T 235 315" fill="none" />
          <path d="M 275 55 Q 270 150, 265 250 T 275 310" fill="none" />
          {/* Secondary Ring Roads */}
          <path d="M 120 90 Q 250 100, 380 95" fill="none" strokeDasharray="2 3" />
          <path d="M 110 210 Q 250 225, 360 230" fill="none" strokeDasharray="2 3" />
          <path d="M 130 110 Q 120 180, 140 240" fill="none" strokeDasharray="1 3" />
          <path d="M 370 100 Q 380 170, 350 240" fill="none" strokeDasharray="1 3" />
        </g>

        {/* ── 3. Radar Pulse Concentric Waves Expanding from Central Hub ── */}
        <circle cx="250" cy="170" r="15" stroke="currentColor" strokeWidth="0.75" fill="none" className="opacity-0">
          <animate attributeName="r" values="15; 160" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35; 0" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="250" cy="170" r="15" stroke="currentColor" strokeWidth="0.5" fill="none" className="opacity-0">
          <animate attributeName="r" values="15; 160" dur="5s" begin="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.25; 0" dur="5s" begin="2.5s" repeatCount="indefinite" />
        </circle>

        {/* ── 4. 16 Radial Point-to-Point Fiber Distribution Links ── */}
        {nodes.map((node) => (
          <g key={`link-${node.id}`}>
            {/* Primary Fiber Link Line */}
            <line
              x1="250"
              y1="170"
              x2={node.x}
              y2={node.y}
              stroke="currentColor"
              strokeWidth="1.1"
              className="opacity-55 dark:opacity-65"
            />
            {/* Animated Traveling Optical Packet */}
            <circle r="1.5" fill="currentColor" className="opacity-90">
              <animateMotion
                path={`M 250 170 L ${node.x} ${node.y}`}
                dur="2.8s"
                begin={node.delay}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}

        {/* ── 5. Peripheral Sub-Nodes (ODC / ODP / Towers) ── */}
        {nodes.map((node) => (
          <g key={`node-${node.id}`}>
            {/* Outer halo */}
            <circle
              cx={node.x}
              cy={node.y}
              r="4.5"
              fill="var(--background)"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            {/* Inner dot */}
            <circle cx={node.x} cy={node.y} r="1.8" fill="currentColor" />
          </g>
        ))}

        {/* ── 6. Glowing Central Core Hub Node (Central OLT / Server Hub) ── */}
        {/* Ambient Glow */}
        <circle cx="250" cy="170" r="32" fill="url(#centerHubGlow)" />

        {/* Core Outer Ring */}
        <circle
          cx="250"
          cy="170"
          r="16"
          fill="var(--background)"
          stroke="currentColor"
          strokeWidth="2"
          filter="url(#coreGlowFilter)"
        />

        {/* Central Server/Network Interconnect Icon Inside Core Hub */}
        <g transform="translate(242, 162)" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Server Top Screen */}
          <rect x="2.5" y="1.5" width="11" height="7.5" rx="1.5" fill="currentColor" fillOpacity="0.2" />
          <line x1="8" y1="9" x2="8" y2="12" />
          <line x1="3" y1="12" x2="13" y2="12" />
          {/* Mini Core Connection Dot */}
          <circle cx="4" cy="14" r="1" fill="currentColor" />
          <circle cx="12" cy="14" r="1" fill="currentColor" />
        </g>
      </svg>
    </div>
  );
}
