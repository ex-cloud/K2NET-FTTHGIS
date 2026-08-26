"use client";

import React, { useState, useRef } from "react";
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

// ─── 1. FIG 0.1: Purpose-Built Stacked Slabs (Solid Black + White Lines) ─────
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

  const layers = [0, 1, 2, 3, 4, 5];
  const size = 52;
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
          <radialGradient id="cutoutApertureGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.95" />
          </radialGradient>
        </defs>

        {/* Ambient Ground Shadow */}
        <ellipse
          cx="140"
          cy="195"
          rx="68"
          ry="32"
          className="fill-black/70 filter blur-[10px]"
        />

        {/* 6 Solid Black Slices with Crisp White Lines */}
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
              {/* Left Face (Solid Deep Black) */}
              <polygon
                points={`${p4} ${p3} ${b3} ${b4}`}
                fill="#0a0a0a"
                stroke="#ffffff"
                strokeOpacity={active ? "0.6" : "0.35"}
                strokeWidth="0.9"
              />

              {/* Right Face (Solid Pure Black Shadow) */}
              <polygon
                points={`${p3} ${p2} ${b2} ${b3}`}
                fill="#000000"
                stroke="#ffffff"
                strokeOpacity={active ? "0.45" : "0.25"}
                strokeWidth="0.9"
              />

              {/* Top Face (Solid Matte Black + Crisp White Stroke) */}
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill="#121212"
                stroke={isTop && active ? "#10b981" : "#ffffff"}
                strokeOpacity={isTop && active ? "1" : "0.75"}
                strokeWidth={isTop ? "1.2" : "0.9"}
              />

              {/* Leading Edge Crisp White Highlight */}
              <line
                x1={p4.split(",")[0]}
                y1={p4.split(",")[1]}
                x2={p3.split(",")[0]}
                y2={p3.split(",")[1]}
                stroke={active ? "#10b981" : "#ffffff"}
                strokeOpacity={active ? "1" : "0.9"}
                strokeWidth="1.1"
              />

              {/* Top Slab: Precision Circular Cutout */}
              {isTop && (
                <g>
                  <ellipse
                    cx="140"
                    cy={150 - zTop * 0.5 + 24}
                    rx="30"
                    ry="17"
                    fill="url(#cutoutApertureGlow)"
                    stroke={active ? "#10b981" : "#ffffff"}
                    strokeOpacity={active ? "1" : "0.8"}
                    strokeWidth="1.2"
                  />
                  <line
                    x1="118"
                    y1={150 - zTop * 0.5 + 21}
                    x2="162"
                    y2={150 - zTop * 0.5 + 21}
                    stroke={active ? "#10b981" : "#ffffff"}
                    strokeOpacity={active ? "0.8" : "0.4"}
                    strokeWidth="0.8"
                  />
                  <line
                    x1="114"
                    y1={150 - zTop * 0.5 + 24}
                    x2="166"
                    y2={150 - zTop * 0.5 + 24}
                    stroke={active ? "#10b981" : "#ffffff"}
                    strokeOpacity={active ? "0.9" : "0.5"}
                    strokeWidth="0.9"
                  />
                  <line
                    x1="120"
                    y1={150 - zTop * 0.5 + 27}
                    x2="160"
                    y2={150 - zTop * 0.5 + 27}
                    stroke={active ? "#10b981" : "#ffffff"}
                    strokeOpacity={active ? "0.8" : "0.4"}
                    strokeWidth="0.8"
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

// ─── 2. FIG 0.2: Autonomous Agent Pillars (Solid Black + White Lines) ────────
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
        {/* Isometric Ground Base Shadow */}
        <polygon
          points={`
            ${toIso(-55, -55, 0, 140, 160)}
            ${toIso(55, -55, 0, 140, 160)}
            ${toIso(55, 55, 0, 140, 160)}
            ${toIso(-55, 55, 0, 140, 160)}
          `}
          className="fill-black/60 filter blur-[8px]"
        />

        {/* 4 Solid Black Obsidian Pillars with Crisp White Lines */}
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
              {/* Left Face (Solid Deep Black) */}
              <polygon
                points={`${p4} ${p3} ${b3} ${b4}`}
                fill="#0a0a0a"
                stroke="#ffffff"
                strokeOpacity={active ? "0.6" : "0.35"}
                strokeWidth="0.9"
              />

              {/* Right Face (Solid Pure Black) */}
              <polygon
                points={`${p3} ${p2} ${b2} ${b3}`}
                fill="#000000"
                stroke="#ffffff"
                strokeOpacity={active ? "0.45" : "0.25"}
                strokeWidth="0.9"
              />

              {/* Top Face (Solid Matte Black + White Stroke) */}
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill="#141414"
                stroke={active ? "#10b981" : "#ffffff"}
                strokeOpacity={active ? "1" : "0.8"}
                strokeWidth={active ? "1.2" : "0.9"}
              />

              {/* Recessed Chip Bed on Pillar Top */}
              <polygon
                points={`
                  ${toIso(p.x - 5, p.y - 5, h + 1.5, ox, oy)}
                  ${toIso(p.x + 5, p.y - 5, h + 1.5, ox, oy)}
                  ${toIso(p.x + 5, p.y + 5, h + 1.5, ox, oy)}
                  ${toIso(p.x - 5, p.y + 5, h + 1.5, ox, oy)}
                `}
                fill={active ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.1)"}
                stroke={active ? "#10b981" : "#ffffff"}
                strokeOpacity={active ? "1" : "0.6"}
                strokeWidth="0.9"
              />

              {/* Active Pulsing Emerald Core Dot */}
              <circle
                cx={toIso(p.x, p.y, h + 1.5, ox, oy).split(",")[0]}
                cy={toIso(p.x, p.y, h + 1.5, ox, oy).split(",")[1]}
                r={active ? "2.2" : "1.6"}
                className={active ? "fill-emerald-400" : "fill-white"}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── 3. FIG 0.3: Speed Array Blades (Solid Black + White Lines) ──────────────
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
        {cards.map((i) => {
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
              {/* Solid Black Card Body Face */}
              <polygon
                points={`${p1} ${p2} ${b2} ${b1}`}
                fill={isLead ? "#051f15" : "#080808"}
                stroke={isLead ? "#10b981" : "#ffffff"}
                strokeOpacity={isLead ? "1" : "0.35"}
                strokeWidth={isLead ? "1.4" : "0.85"}
              />

              {/* Leading Top Rim Crisp White / Emerald Bevel */}
              <line
                x1={p1.split(",")[0]}
                y1={p1.split(",")[1]}
                x2={p2.split(",")[0]}
                y2={p2.split(",")[1]}
                stroke={isLead ? "#10b981" : "#ffffff"}
                strokeOpacity={isLead ? "1" : active ? "0.9" : "0.6"}
                strokeWidth={isLead ? "1.8" : "1"}
              />
            </g>
          );
        })}

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

// ─── 4. FIG 0.4: Spatial FTTH GIS Network Topology Grid ───────────────────────
export function LinearSpatialTopologyFigure({ className, isHovered }: LinearFigureProps) {
  const [localHover, setLocalHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : localHover;

  const nodes = [
    { id: "olt-root", x: 0, y: 0, z: active ? 48 : 36, type: "olt" },
    { id: "odp-1", x: -42, y: -30, z: active ? 26 : 18, type: "odp" },
    { id: "odp-2", x: 42,  y: -30, z: active ? 26 : 18, type: "odp" },
    { id: "odp-3", x: -42, y: 30,  z: active ? 26 : 18, type: "odp" },
    { id: "odp-4", x: 42,  y: 30,  z: active ? 26 : 18, type: "odp" },
  ];

  return (
    <div
      onMouseEnter={() => setLocalHover(true)}
      onMouseLeave={() => setLocalHover(false)}
      className={cn(
        "relative w-full h-[240px] flex items-center justify-center select-none cursor-pointer group overflow-hidden",
        className
      )}
    >
      <svg
        viewBox="0 0 280 240"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Solid Black Base Plate */}
        <polygon
          points={`
            ${toIso(-70, -70, 0)}
            ${toIso(70, -70, 0)}
            ${toIso(70, 70, 0)}
            ${toIso(-70, 70, 0)}
          `}
          fill="#0a0a0a"
          stroke="#ffffff"
          strokeOpacity="0.3"
          strokeWidth="1"
        />

        {/* Reticle Lines */}
        <line x1={toIso(-70, 0, 0).split(",")[0]} y1={toIso(-70, 0, 0).split(",")[1]} x2={toIso(70, 0, 0).split(",")[0]} y2={toIso(70, 0, 0).split(",")[1]} stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1={toIso(0, -70, 0).split(",")[0]} y1={toIso(0, -70, 0).split(",")[1]} x2={toIso(0, 70, 0).split(",")[0]} y2={toIso(0, 70, 0).split(",")[1]} stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.8" strokeDasharray="3 3" />

        {/* Fiber Splines */}
        {nodes.slice(1).map((odp) => {
          const rootPt = toIso(0, 0, nodes[0].z);
          const odpPt = toIso(odp.x, odp.y, odp.z);
          const basePt = toIso(odp.x, odp.y, 0);

          return (
            <g key={odp.id}>
              <line
                x1={odpPt.split(",")[0]}
                y1={odpPt.split(",")[1]}
                x2={basePt.split(",")[0]}
                y2={basePt.split(",")[1]}
                stroke="#ffffff"
                strokeOpacity="0.25"
                strokeWidth="0.9"
                strokeDasharray="2 3"
              />

              <line
                x1={rootPt.split(",")[0]}
                y1={rootPt.split(",")[1]}
                x2={odpPt.split(",")[0]}
                y2={odpPt.split(",")[1]}
                stroke={active ? "#10b981" : "#ffffff"}
                strokeOpacity={active ? "0.9" : "0.5"}
                strokeWidth={active ? "1.5" : "1"}
              />
            </g>
          );
        })}

        {/* Node Diamonds */}
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
                fill="#121212"
                stroke={n.type === "olt" ? "#10b981" : "#ffffff"}
                strokeOpacity={n.type === "olt" ? "1" : "0.7"}
                strokeWidth="1.2"
              />
              <circle
                cx={toIso(n.x, n.y, n.z).split(",")[0]}
                cy={toIso(n.x, n.y, n.z).split(",")[1]}
                r={n.type === "olt" ? "2.6" : "1.6"}
                className={n.type === "olt" ? "fill-emerald-400 animate-pulse" : "fill-white"}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── 5. FIG 0.5: Vector pgvector Isometric Chunk Array ────────────────────────
export function LinearVectorMatrixFigure({ className, isHovered }: LinearFigureProps) {
  const [localHover, setLocalHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : localHover;

  const grid = [
    { x: -30, y: -30, z: 0, highlight: false },
    { x: 0,   y: -30, z: 0, highlight: true },
    { x: 30,  y: -30, z: 0, highlight: false },
    { x: -30, y: 0,   z: 0, highlight: false },
    { x: 0,   y: 0,   z: active ? 22 : 12, highlight: true },
    { x: 30,  y: 0,   z: 0, highlight: false },
    { x: -30, y: 30,  z: 0, highlight: false },
    { x: 0,   y: 30,  z: 0, highlight: false },
    { x: 30,  y: 30,  z: 0, highlight: true },
  ];

  return (
    <div
      onMouseEnter={() => setLocalHover(true)}
      onMouseLeave={() => setLocalHover(false)}
      className={cn(
        "relative w-full h-[240px] flex items-center justify-center select-none cursor-pointer group overflow-hidden",
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
              <polygon points={`${p4} ${p3} ${b3} ${b4}`} fill="#0a0a0a" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.8" />
              <polygon points={`${p3} ${p2} ${b2} ${b3}`} fill="#000000" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="0.8" />
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill={c.highlight && active ? "#051f15" : "#121212"}
                stroke={c.highlight && active ? "#10b981" : "#ffffff"}
                strokeOpacity={c.highlight && active ? "1" : "0.7"}
                strokeWidth="1.1"
              />
            </g>
          );
        })}

        {active && (
          <line
            x1="80"
            y1="70"
            x2="140"
            y2="120"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="animate-pulse"
          />
        )}
      </svg>
    </div>
  );
}

// ─── 6. FIG 0.6: Real-Time Event Stream Microservice Bus ─────────────────────
export function LinearMicroserviceBusFigure({ className, isHovered }: LinearFigureProps) {
  const [localHover, setLocalHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : localHover;

  const busNodes = [
    { name: "Kong Ingress", x: -60, y: 0, z: 0 },
    { name: "Spring Core",  x: -20, y: 0, z: active ? 18 : 10 },
    { name: "Event Bus",    x: 20,  y: 0, z: active ? 32 : 20 },
    { name: "Go Gateways",  x: 60,  y: 0, z: 0 },
  ];

  return (
    <div
      onMouseEnter={() => setLocalHover(true)}
      onMouseLeave={() => setLocalHover(false)}
      className={cn(
        "relative w-full h-[240px] flex items-center justify-center select-none cursor-pointer group overflow-hidden",
        className
      )}
    >
      <svg
        viewBox="0 0 280 240"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main Bus Beam Line */}
        <line
          x1={toIso(-75, 0, 0).split(",")[0]}
          y1={toIso(-75, 0, 0).split(",")[1]}
          x2={toIso(75, 0, 0).split(",")[0]}
          y2={toIso(75, 0, 0).split(",")[1]}
          stroke={active ? "#10b981" : "#ffffff"}
          strokeOpacity={active ? "0.8" : "0.4"}
          strokeWidth="1.5"
        />

        {/* Side Rail Track Guides */}
        <line x1={toIso(-75, -20, 0).split(",")[0]} y1={toIso(-75, -20, 0).split(",")[1]} x2={toIso(75, -20, 0).split(",")[0]} y2={toIso(75, -20, 0).split(",")[1]} stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1={toIso(-75, 20, 0).split(",")[0]} y1={toIso(-75, 20, 0).split(",")[1]} x2={toIso(75, 20, 0).split(",")[1]} stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.8" strokeDasharray="3 3" />

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
                stroke="#ffffff"
                strokeOpacity="0.3"
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill="#121212"
                stroke={active ? "#10b981" : "#ffffff"}
                strokeOpacity={active ? "1" : "0.75"}
                strokeWidth="1.2"
              />

              <circle
                cx={topPt.split(",")[0]}
                cy={topPt.split(",")[1]}
                r="2"
                className={active ? "fill-emerald-400" : "fill-white"}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Complete 6-Card Technical Wireframe Showcase Layout (Solid Black + White)
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
          className="flex flex-col justify-between p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/50 transition-all duration-300 group shadow-md hover:shadow-xl"
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
