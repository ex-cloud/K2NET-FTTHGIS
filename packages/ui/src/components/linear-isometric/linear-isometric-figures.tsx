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

export interface LinearFigureProps {
  className?: string;
  isHovered?: boolean;
}

// ─── 1. FIG 0.1: Purpose-Built Stacked Isometric Slices with Circle Cutout ───
export function LinearPurposeBuiltFigure({ className, isHovered }: LinearFigureProps) {
  const [hover, setHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : hover;

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
        {layers.map((idx) => {
          const zBase = idx * (layerHeight + hoverSeparation);
          const zTop = zBase + layerHeight;
          const isTopLayer = idx === layers.length - 1;

          const p1 = toIso(-size, -size, zTop);
          const p2 = toIso(size, -size, zTop);
          const p3 = toIso(size, size, zTop);
          const p4 = toIso(-size, size, zTop);

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

              {/* Hidden Interior Dashed Projections */}
              <line x1={b1.split(",")[0]} y1={b1.split(",")[1]} x2={b4.split(",")[0]} y2={b4.split(",")[1]} className="stroke-foreground/10" strokeWidth="0.8" strokeDasharray="2 3" />
              <line x1={b1.split(",")[0]} y1={b1.split(",")[1]} x2={b2.split(",")[0]} y2={b2.split(",")[1]} className="stroke-foreground/10" strokeWidth="0.8" strokeDasharray="2 3" />

              {/* Top Layer Circular Precision Cutout */}
              {isTopLayer && (
                <g>
                  <ellipse
                    cx="140"
                    cy="88"
                    rx="32"
                    ry="18"
                    className="stroke-foreground/50 group-hover:stroke-primary group-hover:fill-primary/10 transition-colors duration-300"
                    strokeWidth="1.2"
                  />
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

// ─── 2. FIG 0.2: Autonomous Agent Modular Isometric Pillar Cluster ───────────
export function LinearAgentClusterFigure({ className, isHovered }: LinearFigureProps) {
  const [hover, setHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : hover;

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

              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                className="fill-card/90 stroke-foreground/40 group-hover:stroke-primary group-hover:fill-primary/10 transition-colors duration-300"
                strokeWidth="1.2"
              />

              <line x1={b1.split(",")[0]} y1={b1.split(",")[1]} x2={b4.split(",")[0]} y2={b4.split(",")[1]} className="stroke-foreground/10" strokeWidth="0.8" strokeDasharray="2 3" />
              <line x1={b1.split(",")[0]} y1={b1.split(",")[1]} x2={b2.split(",")[0]} y2={b2.split(",")[1]} className="stroke-foreground/10" strokeWidth="0.8" strokeDasharray="2 3" />

              {p.chip && (
                <g>
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

// ─── 3. FIG 0.3: Designed for Speed Ascending Stepped Isometric Cards ─────────
export function LinearSpeedArrayFigure({ className, isHovered }: LinearFigureProps) {
  const [hover, setHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : hover;

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

// ─── 4. FIG 0.4: Spatial FTTH GIS Network Topology Grid ───────────────────────
export function LinearSpatialTopologyFigure({ className, isHovered }: LinearFigureProps) {
  const [hover, setHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : hover;

  // Grid node points
  const nodes = [
    { id: "olt-root", x: 0, y: 0, z: active ? 45 : 35, type: "olt" },
    { id: "odp-1", x: -40, y: -30, z: active ? 25 : 18, type: "odp" },
    { id: "odp-2", x: 40,  y: -30, z: active ? 25 : 18, type: "odp" },
    { id: "odp-3", x: -40, y: 30,  z: active ? 25 : 18, type: "odp" },
    { id: "odp-4", x: 40,  y: 30,  z: active ? 25 : 18, type: "odp" },
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
        {/* Isometric Ground Grid Plate */}
        <polygon
          points={`
            ${toIso(-70, -70, 0)}
            ${toIso(70, -70, 0)}
            ${toIso(70, 70, 0)}
            ${toIso(-70, 70, 0)}
          `}
          className="fill-card/30 stroke-foreground/15 group-hover:stroke-foreground/30 transition-colors"
          strokeWidth="1"
        />

        {/* Diagonal Cross Grid Lines */}
        <line x1={toIso(-70, 0, 0).split(",")[0]} y1={toIso(-70, 0, 0).split(",")[1]} x2={toIso(70, 0, 0).split(",")[0]} y2={toIso(70, 0, 0).split(",")[1]} className="stroke-foreground/10" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1={toIso(0, -70, 0).split(",")[0]} y1={toIso(0, -70, 0).split(",")[1]} x2={toIso(0, 70, 0).split(",")[0]} y2={toIso(0, 70, 0).split(",")[1]} className="stroke-foreground/10" strokeWidth="0.8" strokeDasharray="3 3" />

        {/* Connecting Fiber Laser Traces from OLT Root to ODP Nodes */}
        {nodes.slice(1).map((odp) => {
          const rootPt = toIso(0, 0, nodes[0].z);
          const odpPt = toIso(odp.x, odp.y, odp.z);
          const basePt = toIso(odp.x, odp.y, 0);

          return (
            <g key={odp.id}>
              {/* Vertical Stalk to Ground */}
              <line
                x1={odpPt.split(",")[0]}
                y1={odpPt.split(",")[1]}
                x2={basePt.split(",")[0]}
                y2={basePt.split(",")[1]}
                className="stroke-foreground/20 group-hover:stroke-primary/40"
                strokeWidth="1"
                strokeDasharray="2 3"
              />

              {/* Curved/Direct Optical Spline Cable */}
              <line
                x1={rootPt.split(",")[0]}
                y1={rootPt.split(",")[1]}
                x2={odpPt.split(",")[0]}
                y2={odpPt.split(",")[1]}
                className="stroke-foreground/30 group-hover:stroke-primary transition-colors"
                strokeWidth={active ? "1.5" : "1"}
              />
            </g>
          );
        })}

        {/* Central Root OLT Stalk */}
        <line
          x1={toIso(0, 0, nodes[0].z).split(",")[0]}
          y1={toIso(0, 0, nodes[0].z).split(",")[1]}
          x2={toIso(0, 0, 0).split(",")[0]}
          y2={toIso(0, 0, 0).split(",")[1]}
          className="stroke-primary/40"
          strokeWidth="1.2"
          strokeDasharray="2 2"
        />

        {/* Render Node Diamond Badges */}
        {nodes.map((n) => {
          const sz = n.type === "olt" ? 14 : 9;
          const p1 = toIso(n.x - sz, n.y - sz, n.z);
          const p2 = toIso(n.x + sz, n.y - sz, n.z);
          const p3 = toIso(n.x + sz, n.y + sz, n.z);
          const p4 = toIso(n.x - sz, n.y + sz, n.z);

          return (
            <g key={`badge-${n.id}`} className="transition-all duration-300">
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                className={cn(
                  "transition-colors duration-300",
                  n.type === "olt"
                    ? "fill-primary/20 stroke-primary"
                    : "fill-card stroke-foreground/40 group-hover:stroke-primary group-hover:fill-primary/10"
                )}
                strokeWidth="1.2"
              />
              <circle
                cx={toIso(n.x, n.y, n.z).split(",")[0]}
                cy={toIso(n.x, n.y, n.z).split(",")[1]}
                r={n.type === "olt" ? "2.5" : "1.5"}
                className={n.type === "olt" ? "fill-primary animate-pulse" : "fill-foreground/60 group-hover:fill-primary"}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── 5. FIG 0.5: Vector Database pgvector Isometric Chunk Array ──────────────
export function LinearVectorMatrixFigure({ className, isHovered }: LinearFigureProps) {
  const [hover, setHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : hover;

  // 3x3 Isometric Matrix Cubes
  const grid = [
    { x: -30, y: -30, z: 0, highlight: false },
    { x: 0,   y: -30, z: 0, highlight: true },
    { x: 30,  y: -30, z: 0, highlight: false },
    { x: -30, y: 0,   z: 0, highlight: false },
    { x: 0,   y: 0,   z: active ? 22 : 12, highlight: true }, // Active query match
    { x: 30,  y: 0,   z: 0, highlight: false },
    { x: -30, y: 30,  z: 0, highlight: false },
    { x: 0,   y: 30,  z: 0, highlight: false },
    { x: 30,  y: 30,  z: 0, highlight: true },
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
        {grid.map((c, i) => {
          const sz = 10;
          const h = 14;
          const ox = 140;
          const oy = 145;

          const p1 = toIso(c.x - sz, c.y - sz, c.z + h, ox, oy);
          const p2 = toIso(c.x + sz, c.y - sz, c.z + h, ox, oy);
          const p3 = toIso(c.x + sz, c.y + sz, c.z + h, ox, oy);
          const p4 = toIso(c.x - sz, c.y + sz, c.z + h, ox, oy);

          const b2 = toIso(c.x + sz, c.y - sz, c.z, ox, oy);
          const b3 = toIso(c.x + sz, c.y + sz, c.z, ox, oy);
          const b4 = toIso(c.x - sz, c.y + sz, c.z, ox, oy);

          return (
            <g
              key={i}
              className="transition-all duration-300 ease-out"
              style={{ transitionDelay: `${i * 20}ms` }}
            >
              <polygon points={`${p4} ${p3} ${b3} ${b4}`} className="fill-card/60 stroke-foreground/20 group-hover:stroke-foreground/35" strokeWidth="1" />
              <polygon points={`${p3} ${p2} ${b2} ${b3}`} className="fill-card/40 stroke-foreground/20 group-hover:stroke-foreground/35" strokeWidth="1" />
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                className={cn(
                  "transition-colors duration-300",
                  c.highlight
                    ? "fill-primary/20 stroke-primary"
                    : "fill-card/90 stroke-foreground/30 group-hover:stroke-primary/50"
                )}
                strokeWidth="1.2"
              />
            </g>
          );
        })}

        {/* Vector Similarity Laser Ray */}
        {active && (
          <line
            x1="80"
            y1="70"
            x2="140"
            y2="120"
            className="stroke-primary animate-pulse"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}
      </svg>
    </div>
  );
}

// ─── 6. FIG 0.6: Real-Time Event Stream Microservice Bus Pipeline ────────────
export function LinearMicroserviceBusFigure({ className, isHovered }: LinearFigureProps) {
  const [hover, setHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : hover;

  const busNodes = [
    { name: "Kong Ingress", x: -60, y: 0, z: 0 },
    { name: "Spring Core",  x: -20, y: 0, z: active ? 18 : 10 },
    { name: "Event Bus",    x: 20,  y: 0, z: active ? 32 : 20 },
    { name: "Go Gateways",  x: 60,  y: 0, z: 0 },
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
        {/* Longitudinal Main Bus Beam Line */}
        <line
          x1={toIso(-75, 0, 0).split(",")[0]}
          y1={toIso(-75, 0, 0).split(",")[1]}
          x2={toIso(75, 0, 0).split(",")[0]}
          y2={toIso(75, 0, 0).split(",")[1]}
          className="stroke-foreground/20 group-hover:stroke-primary/50 transition-colors"
          strokeWidth="1.5"
        />

        {/* Side Rail Track Guides */}
        <line x1={toIso(-75, -20, 0).split(",")[0]} y1={toIso(-75, -20, 0).split(",")[1]} x2={toIso(75, -20, 0).split(",")[0]} y2={toIso(75, -20, 0).split(",")[1]} className="stroke-foreground/10" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1={toIso(-75, 20, 0).split(",")[0]} y1={toIso(-75, 20, 0).split(",")[1]} x2={toIso(75, 20, 0).split(",")[0]} y2={toIso(75, 20, 0).split(",")[1]} className="stroke-foreground/10" strokeWidth="0.8" strokeDasharray="3 3" />

        {/* Bus Nodes */}
        {busNodes.map((n, i) => {
          const sz = 16;
          const p1 = toIso(n.x - sz, n.y - sz / 2, n.z);
          const p2 = toIso(n.x + sz, n.y - sz / 2, n.z);
          const p3 = toIso(n.x + sz, n.y + sz / 2, n.z);
          const p4 = toIso(n.x - sz, n.y + sz / 2, n.z);

          const bPt = toIso(n.x, n.y, 0);
          const topPt = toIso(n.x, n.y, n.z);

          return (
            <g key={i} className="transition-all duration-300">
              <line
                x1={topPt.split(",")[0]}
                y1={topPt.split(",")[1]}
                x2={bPt.split(",")[0]}
                y2={bPt.split(",")[1]}
                className="stroke-foreground/25 group-hover:stroke-primary/50"
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                className="fill-card/90 stroke-foreground/40 group-hover:stroke-primary group-hover:fill-primary/10 transition-colors"
                strokeWidth="1.2"
              />

              <circle
                cx={topPt.split(",")[0]}
                cy={topPt.split(",")[1]}
                r="2"
                className="fill-primary"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Complete 6-Card Technical Wireframe Showcase Layout (1:1 Linear Style) ───
export function LinearIsometricShowcase({ className }: { className?: string }) {
  const figures = [
    {
      fig: "FIG 0.1",
      tag: "PURPOSE-BUILT",
      title: "Purpose-built architecture",
      desc: "Engineered from the ground up with zero bloat. Layered modularity for mission-critical enterprise telecom operations.",
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
    {
      fig: "FIG 0.4",
      tag: "SPATIAL GIS",
      title: "Spatial FTTH network topology",
      desc: "Real-time PostGIS topological graphs linking OLT central offices, optical splitters, and distribution points.",
      component: <LinearSpatialTopologyFigure />,
    },
    {
      fig: "FIG 0.5",
      tag: "PGVECTOR",
      title: "Vector embedding retrieval matrix",
      desc: "500-token chunk vector embeddings stored in PostgreSQL pgvector with cosine similarity distance lookups.",
      component: <LinearVectorMatrixFigure />,
    },
    {
      fig: "FIG 0.6",
      tag: "MICROSERVICES",
      title: "High-throughput event bus",
      desc: "Decoupled Go microservice gateways processing asynchronous notification queues, payment webhooks, and SNMP telemetry.",
      component: <LinearMicroserviceBusFigure />,
    },
  ];

  return (
    <div className={cn("w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {figures.map((item, idx) => (
        <div
          key={idx}
          className="flex flex-col justify-between p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/50 transition-all duration-300 group shadow-md"
        >
          <div>
            <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
              <span>{item.fig}</span>
              <span className="text-primary/60 group-hover:text-primary transition-colors">{item.tag}</span>
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
