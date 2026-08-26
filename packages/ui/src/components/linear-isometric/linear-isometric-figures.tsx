"use client";

import React, { useState } from "react";
import { cn } from "../../utils";

// ─── Math Helpers for True Isometric 30° Projection ──────────────────────────
// Isometric transform:
// screenX = (x - y) * cos(30°)
// screenY = (x + y) * sin(30°) - z
const COS30 = Math.cos(Math.PI / 6); // ~0.8660
const SIN30 = Math.sin(Math.PI / 6); // 0.5

function toIso(x: number, y: number, z: number, originX = 140, originY = 140) {
  const sx = originX + (x - y) * COS30;
  const sy = originY + (x + y) * SIN30 - z;
  return `${sx.toFixed(1)},${sy.toFixed(1)}`;
}

// ─── 1. FIG 0.2: Purpose-Built Stacked Isometric Slices with Circle Cutout ───
export interface LinearFigureProps {
  className?: string;
  isHovered?: boolean;
}

export function LinearPurposeBuiltFigure({ className, isHovered }: LinearFigureProps) {
  const [hover, setHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : hover;

  // 6 Stacked layers
  const layers = [0, 1, 2, 3, 4, 5];
  const size = 52;
  const layerHeight = 10;
  const hoverSeparation = active ? 6 : 0;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "relative w-full h-[240px] flex items-center justify-center select-none cursor-pointer group",
        className
      )}
    >
      <svg
        viewBox="0 0 280 240"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="isoLinearGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Isometric Stacked Slices (Bottom to Top) */}
        {layers.map((idx) => {
          const zBase = idx * (layerHeight + hoverSeparation);
          const zTop = zBase + layerHeight;
          const isTopLayer = idx === layers.length - 1;

          // 4 Vertices of the diamond top face
          const p1 = toIso(-size, -size, zTop);
          const p2 = toIso(size, -size, zTop);
          const p3 = toIso(size, size, zTop);
          const p4 = toIso(-size, size, zTop);

          // Bottom vertices for vertical drop edges
          const b1 = toIso(-size, -size, zBase);
          const b2 = toIso(size, -size, zBase);
          const b3 = toIso(size, size, zBase);
          const b4 = toIso(-size, size, zBase);

          return (
            <g
              key={idx}
              className="transition-all duration-300 ease-out"
              style={{
                transform: active ? `translateY(-${idx * 3}px)` : "translateY(0px)",
                transitionDelay: `${idx * 20}ms`,
              }}
            >
              {/* Top Face Diamond */}
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                className={cn(
                  "transition-colors duration-300",
                  isTopLayer
                    ? "fill-card/80 stroke-foreground/40 group-hover:stroke-primary group-hover:fill-primary/5"
                    : "fill-card/40 stroke-foreground/20 group-hover:stroke-foreground/40"
                )}
                strokeWidth="1"
              />

              {/* Left & Right Drop Edges */}
              <line x1={p4.split(",")[0]} y1={p4.split(",")[1]} x2={b4.split(",")[0]} y2={b4.split(",")[1]} className="stroke-foreground/25 group-hover:stroke-primary/50" strokeWidth="1" />
              <line x1={p3.split(",")[0]} y1={p3.split(",")[1]} x2={b3.split(",")[0]} y2={b3.split(",")[1]} className="stroke-foreground/25 group-hover:stroke-primary/50" strokeWidth="1" />
              <line x1={p2.split(",")[0]} y1={p2.split(",")[1]} x2={b2.split(",")[0]} y2={b2.split(",")[1]} className="stroke-foreground/25 group-hover:stroke-primary/50" strokeWidth="1" />

              {/* Bottom Edge Rails */}
              <line x1={b4.split(",")[0]} y1={b4.split(",")[1]} x2={b3.split(",")[0]} y2={b3.split(",")[1]} className="stroke-foreground/20 group-hover:stroke-foreground/35" strokeWidth="1" />
              <line x1={b3.split(",")[0]} y1={b3.split(",")[1]} x2={b2.split(",")[0]} y2={b2.split(",")[1]} className="stroke-foreground/20 group-hover:stroke-foreground/35" strokeWidth="1" />

              {/* Hidden Interior Dashed Projections (Linear Style) */}
              <line
                x1={b1.split(",")[0]}
                y1={b1.split(",")[1]}
                x2={b4.split(",")[0]}
                y2={b4.split(",")[1]}
                className="stroke-foreground/10"
                strokeWidth="0.8"
                strokeDasharray="2 3"
              />
              <line
                x1={b1.split(",")[0]}
                y1={b1.split(",")[1]}
                x2={b2.split(",")[0]}
                y2={b2.split(",")[1]}
                className="stroke-foreground/10"
                strokeWidth="0.8"
                strokeDasharray="2 3"
              />

              {/* Top Layer Circular Precision Cutout (Linear Fig 0.2 Signature) */}
              {isTopLayer && (
                <g>
                  {/* Isometric projected circle (ellipse) */}
                  <ellipse
                    cx="140"
                    cy="88"
                    rx="32"
                    ry="18"
                    className="stroke-foreground/50 group-hover:stroke-primary group-hover:fill-primary/10 transition-colors duration-300"
                    strokeWidth="1.2"
                  />
                  {/* Internal horizontal hatching lines */}
                  <line x1="116" y1="84" x2="164" y2="84" className="stroke-foreground/30 group-hover:stroke-primary/60" strokeWidth="0.8" />
                  <line x1="112" y1="88" x2="168" y2="88" className="stroke-foreground/30 group-hover:stroke-primary/60" strokeWidth="0.8" />
                  <line x1="120" y1="92" x2="160" y2="92" className="stroke-foreground/30 group-hover:stroke-primary/60" strokeWidth="0.8" />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── 2. FIG 0.3: Autonomous Agent Modular Isometric Pillar Cluster ───────────
export function LinearAgentClusterFigure({ className, isHovered }: LinearFigureProps) {
  const [hover, setHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : hover;

  // 4 Isometric Pillars arranged in a cluster
  const pillars = [
    { id: "p1", x: -26, y: -26, width: 28, height: active ? 68 : 55, chip: true },
    { id: "p2", x: 26,  y: -26, width: 28, height: active ? 42 : 32, chip: true },
    { id: "p3", x: -26, y: 26,  width: 28, height: active ? 95 : 75, chip: true },
    { id: "p4", x: 26,  y: 26,  width: 28, height: active ? 58 : 45, chip: true },
  ];

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "relative w-full h-[240px] flex items-center justify-center select-none cursor-pointer group",
        className
      )}
    >
      <svg
        viewBox="0 0 280 240"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base Grid Floor Guide Lines */}
        <line x1="75" y1="165" x2="140" y2="202" className="stroke-foreground/10" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1="205" y1="165" x2="140" y2="202" className="stroke-foreground/10" strokeWidth="0.8" strokeDasharray="3 3" />

        {pillars.map((p, idx) => {
          const w = p.width;
          const h = p.height;
          const ox = 140;
          const oy = 155;

          const p1 = toIso(p.x - w / 2, p.y - w / 2, h, ox, oy);
          const p2 = toIso(p.x + w / 2, p.y - w / 2, h, ox, oy);
          const p3 = toIso(p.x + w / 2, p.y + w / 2, h, ox, oy);
          const p4 = toIso(p.x - w / 2, p.y + w / 2, h, ox, oy);

          const b1 = toIso(p.x - w / 2, p.y - w / 2, 0, ox, oy);
          const b2 = toIso(p.x + w / 2, p.y - w / 2, 0, ox, oy);
          const b3 = toIso(p.x + w / 2, p.y + w / 2, 0, ox, oy);
          const b4 = toIso(p.x - w / 2, p.y + w / 2, 0, ox, oy);

          return (
            <g
              key={p.id}
              className="transition-all duration-500 ease-out"
              style={{ transitionDelay: `${idx * 40}ms` }}
            >
              {/* Pillar Body Left & Right Faces */}
              <polygon
                points={`${p4} ${p3} ${b3} ${b4}`}
                className="fill-card/60 stroke-foreground/25 group-hover:stroke-foreground/45 transition-colors"
                strokeWidth="1"
              />
              <polygon
                points={`${p3} ${p2} ${b2} ${b3}`}
                className="fill-card/30 stroke-foreground/25 group-hover:stroke-foreground/45 transition-colors"
                strokeWidth="1"
              />

              {/* Pillar Top Face Diamond */}
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                className="fill-card/90 stroke-foreground/40 group-hover:stroke-primary group-hover:fill-primary/10 transition-colors duration-300"
                strokeWidth="1.2"
              />

              {/* Hidden Construction Lines */}
              <line x1={b1.split(",")[0]} y1={b1.split(",")[1]} x2={b4.split(",")[0]} y2={b4.split(",")[1]} className="stroke-foreground/10" strokeWidth="0.8" strokeDasharray="2 3" />
              <line x1={b1.split(",")[0]} y1={b1.split(",")[1]} x2={b2.split(",")[0]} y2={b2.split(",")[1]} className="stroke-foreground/10" strokeWidth="0.8" strokeDasharray="2 3" />

              {/* Micro Tech Chip / Indicator on Top (Linear Signature) */}
              {p.chip && (
                <g>
                  {/* Tiny center isometric square on top cap */}
                  <polygon
                    points={`
                      ${toIso(p.x - 4, p.y - 4, h + 2, ox, oy)}
                      ${toIso(p.x + 4, p.y - 4, h + 2, ox, oy)}
                      ${toIso(p.x + 4, p.y + 4, h + 2, ox, oy)}
                      ${toIso(p.x - 4, p.y + 4, h + 2, ox, oy)}
                    `}
                    className="fill-primary/20 stroke-primary transition-all duration-300"
                    strokeWidth="1"
                  />
                  {/* Micro blinking photon center */}
                  <circle
                    cx={toIso(p.x, p.y, h + 2, ox, oy).split(",")[0]}
                    cy={toIso(p.x, p.y, h + 2, ox, oy).split(",")[1]}
                    r="1"
                    className="fill-primary"
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

// ─── 3. FIG 0.4: Designed for Speed Ascending Stepped Isometric Cards ─────────
export function LinearSpeedArrayFigure({ className, isHovered }: LinearFigureProps) {
  const [hover, setHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : hover;

  // 11 Ascending thin stadium slices
  const cardCount = 11;
  const cards = Array.from({ length: cardCount }, (_, i) => i);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "relative w-full h-[240px] flex items-center justify-center select-none cursor-pointer group",
        className
      )}
    >
      <svg
        viewBox="0 0 280 240"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {cards.map((i) => {
          // Exponential height progression (stepped stadium)
          const baseHeight = 12 + i * 8 + (i > 6 ? (i - 6) * 10 : 0);
          const height = active ? baseHeight + Math.sin((i / cardCount) * Math.PI) * 18 : baseHeight;
          const cardWidth = 50;
          const spacing = 11;
          const xPos = (i - cardCount / 2) * spacing;
          const yPos = (i - cardCount / 2) * (spacing * 0.2);

          const ox = 140;
          const oy = 175;

          const p1 = toIso(xPos, yPos - cardWidth / 2, height, ox, oy);
          const p2 = toIso(xPos, yPos + cardWidth / 2, height, ox, oy);
          const b1 = toIso(xPos, yPos - cardWidth / 2, 0, ox, oy);
          const b2 = toIso(xPos, yPos + cardWidth / 2, 0, ox, oy);

          const isHighest = i === cardCount - 1;

          return (
            <g
              key={i}
              className="transition-all duration-300 ease-out"
              style={{ transitionDelay: `${i * 15}ms` }}
            >
              {/* Vertical Blade Card Face */}
              <polygon
                points={`${p1} ${p2} ${b2} ${b1}`}
                className={cn(
                  "transition-colors duration-300",
                  isHighest
                    ? "fill-card/80 stroke-primary/80 group-hover:fill-primary/10"
                    : "fill-card/40 stroke-foreground/25 group-hover:stroke-foreground/45"
                )}
                strokeWidth="1"
              />

              {/* Top Rim Highlight */}
              <line
                x1={p1.split(",")[0]}
                y1={p1.split(",")[1]}
                x2={p2.split(",")[0]}
                y2={p2.split(",")[1]}
                className={cn(
                  "transition-colors duration-300",
                  isHighest ? "stroke-primary" : "stroke-foreground/40 group-hover:stroke-primary/70"
                )}
                strokeWidth="1.2"
              />
            </g>
          );
        })}

        {/* Scanning Light Pulse Ray traversing cards */}
        {active && (
          <line
            x1="50"
            y1="180"
            x2="230"
            y2="70"
            className="stroke-primary/50 animate-pulse"
            strokeWidth="1"
            strokeDasharray="4 8"
          />
        )}
      </svg>
    </div>
  );
}

// ─── 4. Complete 3-Card Technical Wireframe Showcase Layout (1:1 Linear Style)
export function LinearIsometricShowcase({ className }: { className?: string }) {
  return (
    <div className={cn("w-full grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
      {/* Card 1 */}
      <div className="flex flex-col justify-between p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/50 transition-all duration-300 group shadow-md">
        <div>
          <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
            <span>FIG 0.1</span>
            <span className="text-primary/60 group-hover:text-primary transition-colors">PURPOSE-BUILT</span>
          </div>

          <LinearPurposeBuiltFigure />
        </div>

        <div className="space-y-1.5 pt-4 border-t border-border/40">
          <h4 className="text-sm font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
            Purpose-built architecture
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Engineered from ground up with zero bloat. Layered modularity for mission-critical enterprise telecom operations.
          </p>
        </div>
      </div>

      {/* Card 2 */}
      <div className="flex flex-col justify-between p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/50 transition-all duration-300 group shadow-md">
        <div>
          <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
            <span>FIG 0.2</span>
            <span className="text-primary/60 group-hover:text-primary transition-colors">AUTONOMOUS</span>
          </div>

          <LinearAgentClusterFigure />
        </div>

        <div className="space-y-1.5 pt-4 border-t border-border/40">
          <h4 className="text-sm font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
            Powered by intelligent agents
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Multi-cluster agent pods running parallel vector queries, real-time spatial triangulation, and automated OLT diagnostics.
          </p>
        </div>
      </div>

      {/* Card 3 */}
      <div className="flex flex-col justify-between p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/50 transition-all duration-300 group shadow-md">
        <div>
          <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
            <span>FIG 0.3</span>
            <span className="text-primary/60 group-hover:text-primary transition-colors">HIGH VELOCITY</span>
          </div>

          <LinearSpeedArrayFigure />
        </div>

        <div className="space-y-1.5 pt-4 border-t border-border/40">
          <h4 className="text-sm font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
            Designed for sub-millisecond speed
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Streamlined synchronous pipeline reducing latency and network jitter to ship telemetry updates with maximum velocity.
          </p>
        </div>
      </div>
    </div>
  );
}
