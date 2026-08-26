"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../utils";

// ─── Math Helpers for True Isometric 30° Axonometric Projection ──────────────
const COS30 = Math.cos(Math.PI / 6); // ~0.8660
const SIN30 = Math.sin(Math.PI / 6); // 0.5

function toIso(x: number, y: number, z: number, originX = 140, originY = 140) {
  const sx = originX + (x - y) * COS30;
  const sy = originY + (x + y) * SIN30 - z;
  return `${sx.toFixed(1)},${sy.toFixed(1)}`;
}

export interface LinearFigureProps {
  className?: string;
  isHovered?: boolean;
}

// ─── 1. FIG 0.1: Purpose-Built Volumetric Stacked Slabs (Linear FIG 0.2) ──────
export function LinearPurposeBuiltFigure({ className, isHovered }: LinearFigureProps) {
  const [localHover, setLocalHover] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const active = isHovered !== undefined ? isHovered : localHover;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
    setMouseOffset({ x: nx, y: ny });
  };

  const handleMouseLeave = () => {
    setLocalHover(false);
    setMouseOffset({ x: 0, y: 0 });
  };

  // 6 Stacked solid volumetric dark slabs
  const layers = [0, 1, 2, 3, 4, 5];
  const size = 50;
  const slabThickness = 8;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setLocalHover(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative w-full h-[240px] flex items-center justify-center select-none cursor-pointer group overflow-hidden",
        className
      )}
    >
      <svg
        viewBox="0 0 280 240"
        className="w-full h-full overflow-visible transition-transform duration-500 ease-out"
        style={{
          transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
        }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Volumetric Dark Shading Gradients */}
          <linearGradient id="slabTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e2430" />
            <stop offset="100%" stopColor="#12161f" />
          </linearGradient>

          <linearGradient id="slabTopActive" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#222d3d" />
            <stop offset="100%" stopColor="#16202c" />
          </linearGradient>

          <linearGradient id="slabLeftFace" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#131720" />
            <stop offset="100%" stopColor="#0b0e14" />
          </linearGradient>

          <linearGradient id="slabRightFace" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0d1017" />
            <stop offset="100%" stopColor="#07080c" />
          </linearGradient>

          {/* 1px Specular Edge Highlight Gradient */}
          <linearGradient id="edgeBevelHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
          </linearGradient>

          <radialGradient id="cutoutApertureGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#06090e" stopOpacity="0.9" />
          </radialGradient>
        </defs>

        {/* Ambient Ground Shadow */}
        <ellipse
          cx="140"
          cy="195"
          rx="68"
          ry="32"
          className="fill-black/60 filter blur-[10px] transition-opacity duration-500"
          style={{ opacity: active ? 0.75 : 0.4 }}
        />

        {/* 6 Solid Isometric Slices with Spring Separation */}
        {layers.map((idx) => {
          const separation = active ? idx * 7.5 : 0;
          const zBase = idx * (slabThickness + 2) + separation;
          const zTop = zBase + slabThickness;
          const isTop = idx === layers.length - 1;

          const p1 = toIso(-size, -size, zTop, 140, 150);
          const p2 = toIso(size, -size, zTop, 140, 150);
          const p3 = toIso(size, size, zTop, 140, 150);
          const p4 = toIso(-size, size, zTop, 140, 150);

          const b2 = toIso(size, -size, zBase, 140, 150);
          const b3 = toIso(size, size, zBase, 140, 150);
          const b4 = toIso(-size, size, zBase, 140, 150);

          return (
            <g
              key={idx}
              style={{
                transition: "transform 0.6s cubic-bezier(0.34, 1.4, 0.64, 1)",
                transform: active ? `translateY(-${idx * 4}px)` : "translateY(0px)",
                transitionDelay: `${idx * 25}ms`,
              }}
            >
              {/* Left Face (Solid Shaded Dark Tone) */}
              <polygon
                points={`${p4} ${p3} ${b3} ${b4}`}
                fill="url(#slabLeftFace)"
                stroke="#2a3346"
                strokeWidth="0.8"
                className="transition-colors duration-300"
              />

              {/* Right Face (Deep Shadow Dark Tone) */}
              <polygon
                points={`${p3} ${p2} ${b2} ${b3}`}
                fill="url(#slabRightFace)"
                stroke="#1f2635"
                strokeWidth="0.8"
                className="transition-colors duration-300"
              />

              {/* Top Face (Directional Highlight Face) */}
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill={active ? "url(#slabTopActive)" : "url(#slabTopGrad)"}
                stroke={isTop && active ? "url(#edgeBevelHighlight)" : "#3a4760"}
                strokeWidth={isTop ? "1.2" : "0.9"}
                className="transition-all duration-300"
              />

              {/* Leading Edge 1px Specular Bevel Line */}
              <line
                x1={p4.split(",")[0]}
                y1={p4.split(",")[1]}
                x2={p3.split(",")[0]}
                y2={p3.split(",")[1]}
                stroke={active ? "url(#edgeBevelHighlight)" : "#4a5b7a"}
                strokeWidth="1"
                className="transition-colors duration-300"
              />

              {/* Top Slab: Precision Circular Cutout / Aperture Lens */}
              {isTop && (
                <g>
                  {/* Recessed dark circular basin */}
                  <ellipse
                    cx="140"
                    cy={150 - zTop * 0.5 + 24}
                    rx="30"
                    ry="17"
                    fill="url(#cutoutApertureGlow)"
                    stroke={active ? "#10b981" : "#4a5b7a"}
                    strokeWidth="1.2"
                    className="transition-colors duration-300"
                  />

                  {/* Horizontal Precision Scan Reticles */}
                  <line
                    x1="118"
                    y1={150 - zTop * 0.5 + 21}
                    x2="162"
                    y2={150 - zTop * 0.5 + 21}
                    stroke={active ? "#10b981" : "#3b4861"}
                    strokeWidth="0.8"
                    className="transition-colors duration-300"
                  />
                  <line
                    x1="114"
                    y1={150 - zTop * 0.5 + 24}
                    x2="166"
                    y2={150 - zTop * 0.5 + 24}
                    stroke={active ? "#10b981" : "#3b4861"}
                    strokeWidth="0.9"
                    className="transition-colors duration-300"
                  />
                  <line
                    x1="120"
                    y1={150 - zTop * 0.5 + 27}
                    x2="160"
                    y2={150 - zTop * 0.5 + 27}
                    stroke={active ? "#10b981" : "#3b4861"}
                    strokeWidth="0.8"
                    className="transition-colors duration-300"
                  />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── 2. FIG 0.2: Autonomous Agent Volumetric Isometric Pillars (Linear FIG 0.3)
export function LinearAgentClusterFigure({ className, isHovered }: LinearFigureProps) {
  const [localHover, setLocalHover] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const active = isHovered !== undefined ? isHovered : localHover;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
    setMouseOffset({ x: nx, y: ny });
  };

  const handleMouseLeave = () => {
    setLocalHover(false);
    setMouseOffset({ x: 0, y: 0 });
  };

  // 4 Solid Isometric Pillars with Staggered Heights
  const pillars = [
    { id: "p1", x: -28, y: -28, width: 26, defaultH: 58, activeH: 72, delay: 0 },
    { id: "p2", x: 28,  y: -28, width: 26, defaultH: 34, activeH: 46, delay: 50 },
    { id: "p3", x: -28, y: 28,  width: 26, defaultH: 82, activeH: 104, delay: 100 },
    { id: "p4", x: 28,  y: 28,  width: 26, defaultH: 48, activeH: 64, delay: 150 },
  ];

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setLocalHover(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative w-full h-[240px] flex items-center justify-center select-none cursor-pointer group overflow-hidden",
        className
      )}
    >
      <svg
        viewBox="0 0 280 240"
        className="w-full h-full overflow-visible transition-transform duration-500 ease-out"
        style={{
          transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
        }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pillarTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#242b3a" />
            <stop offset="100%" stopColor="#141822" />
          </linearGradient>

          <linearGradient id="pillarLeftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#141822" />
            <stop offset="100%" stopColor="#0a0d13" />
          </linearGradient>

          <linearGradient id="pillarRightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0e1118" />
            <stop offset="100%" stopColor="#05070a" />
          </linearGradient>

          <filter id="emeraldChipGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
          </filter>
        </defs>

        {/* Isometric Ground Base Shadow */}
        <polygon
          points={`
            ${toIso(-55, -55, 0, 140, 160)}
            ${toIso(55, -55, 0, 140, 160)}
            ${toIso(55, 55, 0, 140, 160)}
            ${toIso(-55, 55, 0, 140, 160)}
          `}
          className="fill-black/50 filter blur-[8px]"
        />

        {/* 4 Solid Obsidian Pillars */}
        {pillars.map((p) => {
          const w = p.width;
          const h = active ? p.activeH : p.defaultH;
          const ox = 140;
          const oy = 160;

          const p1 = toIso(p.x - w / 2, p.y - w / 2, h, ox, oy);
          const p2 = toIso(p.x + w / 2, p.y - w / 2, h, ox, oy);
          const p3 = toIso(p.x + w / 2, p.y + w / 2, h, ox, oy);
          const p4 = toIso(p.x - w / 2, p.y + w / 2, h, ox, oy);

          const b2 = toIso(p.x + w / 2, p.y - w / 2, 0, ox, oy);
          const b3 = toIso(p.x + w / 2, p.y + w / 2, 0, ox, oy);
          const b4 = toIso(p.x - w / 2, p.y + w / 2, 0, ox, oy);

          return (
            <g
              key={p.id}
              style={{
                transition: "all 0.65s cubic-bezier(0.34, 1.45, 0.64, 1)",
                transitionDelay: `${p.delay}ms`,
              }}
            >
              {/* Left Face (Solid Mid-Tone) */}
              <polygon
                points={`${p4} ${p3} ${b3} ${b4}`}
                fill="url(#pillarLeftGrad)"
                stroke="#252d3d"
                strokeWidth="0.9"
              />

              {/* Right Face (Solid Deep Shadow) */}
              <polygon
                points={`${p3} ${p2} ${b2} ${b3}`}
                fill="url(#pillarRightGrad)"
                stroke="#1b212d"
                strokeWidth="0.9"
              />

              {/* Top Face (Solid Highlight) */}
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill="url(#pillarTopGrad)"
                stroke={active ? "#10b981" : "#3b475e"}
                strokeWidth={active ? "1.2" : "0.9"}
                className="transition-colors duration-300"
              />

              {/* Micro Recessed Chip Bed on Pillar Top */}
              <polygon
                points={`
                  ${toIso(p.x - 5, p.y - 5, h + 1.5, ox, oy)}
                  ${toIso(p.x + 5, p.y - 5, h + 1.5, ox, oy)}
                  ${toIso(p.x + 5, p.y + 5, h + 1.5, ox, oy)}
                  ${toIso(p.x - 5, p.y + 5, h + 1.5, ox, oy)}
                `}
                fill={active ? "rgba(16, 185, 129, 0.25)" : "rgba(56, 189, 248, 0.15)"}
                stroke={active ? "#10b981" : "#38bdf8"}
                strokeWidth="0.9"
                className="transition-all duration-300"
              />

              {/* Active Pulsing Emerald Core Dot */}
              <circle
                cx={toIso(p.x, p.y, h + 1.5, ox, oy).split(",")[0]}
                cy={toIso(p.x, p.y, h + 1.5, ox, oy).split(",")[1]}
                r={active ? "2.2" : "1.6"}
                className={active ? "fill-emerald-400" : "fill-sky-400"}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── 3. FIG 0.3: Designed for Speed Solid Stepped Blades (Linear FIG 0.4) ────
export function LinearSpeedArrayFigure({ className, isHovered }: LinearFigureProps) {
  const [localHover, setLocalHover] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const active = isHovered !== undefined ? isHovered : localHover;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
    setMouseOffset({ x: nx, y: ny });
  };

  const handleMouseLeave = () => {
    setLocalHover(false);
    setMouseOffset({ x: 0, y: 0 });
  };

  const cardCount = 12;
  const cards = Array.from({ length: cardCount }, (_, i) => i);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setLocalHover(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative w-full h-[240px] flex items-center justify-center select-none cursor-pointer group overflow-hidden",
        className
      )}
    >
      <svg
        viewBox="0 0 280 240"
        className="w-full h-full overflow-visible transition-transform duration-500 ease-out"
        style={{
          transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
        }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bladeGradSolid" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#090c12" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#151b26" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#222b3d" stopOpacity="0.98" />
          </linearGradient>

          <linearGradient id="bladeGradLead" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#062217" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#0c3826" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="leadingNeonEdge" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {cards.map((i) => {
          // Exponential height stair steps
          const baseHeight = 16 + Math.pow(i / (cardCount - 1), 1.85) * 85;
          const waveBounce = active ? Math.sin((i / cardCount) * Math.PI * 1.5) * 14 : 0;
          const height = baseHeight + waveBounce;

          const cardDepth = 42;
          const spacing = 9.5;
          const xPos = (i - cardCount / 2) * spacing;
          const yPos = (i - cardCount / 2) * (spacing * 0.2);

          const ox = 140;
          const oy = 180;

          const p1 = toIso(xPos, yPos - cardDepth / 2, height, ox, oy);
          const p2 = toIso(xPos, yPos + cardDepth / 2, height, ox, oy);
          const b1 = toIso(xPos, yPos - cardDepth / 2, 0, ox, oy);
          const b2 = toIso(xPos, yPos + cardDepth / 2, 0, ox, oy);

          const isLead = i === cardCount - 1;

          return (
            <g
              key={i}
              style={{
                transition: "all 0.5s cubic-bezier(0.34, 1.4, 0.64, 1)",
                transitionDelay: `${i * 18}ms`,
              }}
            >
              {/* Solid Volumetric Card Body Face */}
              <polygon
                points={`${p1} ${p2} ${b2} ${b1}`}
                fill={isLead ? "url(#bladeGradLead)" : "url(#bladeGradSolid)"}
                stroke={isLead ? "#10b981" : "#242e42"}
                strokeWidth={isLead ? "1.4" : "0.85"}
              />

              {/* Leading Top Rim Laser Bevel */}
              <line
                x1={p1.split(",")[0]}
                y1={p1.split(",")[1]}
                x2={p2.split(",")[0]}
                y2={p2.split(",")[1]}
                stroke={isLead ? "url(#leadingNeonEdge)" : active ? "#38bdf8" : "#3b4a69"}
                strokeWidth={isLead ? "1.8" : "1"}
                className="transition-colors duration-300"
              />
            </g>
          );
        })}

        {/* Animated Laser Speed Scanline (Traversing across the top ridge) */}
        {active && (
          <line
            x1="70"
            y1="175"
            x2="225"
            y2="75"
            stroke="#10b981"
            strokeWidth="1.6"
            strokeDasharray="6 8"
            className="animate-pulse"
          />
        )}
      </svg>
    </div>
  );
}

// ─── 4. Complete 3-Card Technical Wireframe Showcase Layout (1:1 Linear Style)
export function LinearIsometricShowcase({ className }: { className?: string }) {
  const figures = [
    {
      fig: "FIG 0.1",
      tag: "PURPOSE-BUILT",
      title: "Purpose-built architecture",
      desc: "Engineered from the ground up with zero bloat. Layered solid modularity for mission-critical enterprise telecom operations.",
      component: <LinearPurposeBuiltFigure />,
    },
    {
      fig: "FIG 0.2",
      tag: "AUTONOMOUS",
      title: "Powered by intelligent agents",
      desc: "Multi-cluster agent pods running parallel vector queries, real-time spatial triangulation, and automated diagnostics.",
      component: <LinearAgentClusterFigure />,
    },
    {
      fig: "FIG 0.3",
      tag: "HIGH VELOCITY",
      title: "Designed for sub-millisecond speed",
      desc: "Streamlined synchronous pipeline reducing latency and network jitter to ship telemetry updates with maximum velocity.",
      component: <LinearSpeedArrayFigure />,
    },
  ];

  return (
    <div className={cn("w-full grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
      {figures.map((item, idx) => (
        <div
          key={idx}
          className="flex flex-col justify-between p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/50 transition-all duration-300 group shadow-lg hover:shadow-2xl"
        >
          <div>
            <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
              <span>{item.fig}</span>
              <span className="text-primary/75 font-semibold group-hover:text-primary transition-colors">
                {item.tag}
              </span>
            </div>

            {item.component}
          </div>

          <div className="space-y-1.5 pt-4 border-t border-border/40">
            <h4 className="text-sm font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
              {item.title}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {item.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
