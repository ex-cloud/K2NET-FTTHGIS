"use client";

import React, { useState, useRef } from "react";
import { cn } from "../../utils";

// ─── Math Helpers for True Isometric 30° Axonometric Projection ──────────────
const COS30 = Math.cos(Math.PI / 6); // ~0.8660
const SIN30 = Math.sin(Math.PI / 6); // 0.5

function toIso(x: number, y: number, z: number, originX = 200, originY = 175) {
  const sx = originX + (x - y) * COS30;
  const sy = originY + (x + y) * SIN30 - z;
  return `${sx.toFixed(1)},${sy.toFixed(1)}`;
}

export interface LinearHeroProps {
  className?: string;
  size?: "md" | "lg" | "full";
  interactive?: boolean;
}

// ═════════════════════════════════════════════════════════════════════════════
// 🌟 KONSEP 1: "The Global FTTH Geospatial Core" (Solid Black + White Lines)
// ═════════════════════════════════════════════════════════════════════════════
export function LinearGeospatialCoreHero({
  className,
  size = "full",
  interactive = true,
}: LinearHeroProps) {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 14;
    setMouseOffset({ x: nx, y: ny });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMouseOffset({ x: 0, y: 0 });
  };

  const satellites = [
    { id: "sat-1", name: "ODP-JKT-01", x: -95, y: -70, z: isHovered ? 45 : 30, type: "odp" },
    { id: "sat-2", name: "OLT-CORE-N", x: 95,  y: -70, z: isHovered ? 65 : 45, type: "olt" },
    { id: "sat-3", name: "GIS-EDGE-S", x: -95, y: 70,  z: isHovered ? 40 : 25, type: "edge" },
    { id: "sat-4", name: "ODP-SUB-04", x: 95,  y: 70,  z: isHovered ? 55 : 35, type: "odp" },
  ];

  const coreSlabs = [0, 1, 2, 3, 4];
  const slabSize = 56;
  const slabThickness = 9;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative w-full h-full min-h-[340px] flex items-center justify-center select-none cursor-pointer group overflow-hidden",
        className
      )}
    >
      <svg
        viewBox="0 0 400 350"
        className="w-full max-w-[460px] h-full max-h-[380px] overflow-visible transition-transform duration-500 ease-out"
        style={{
          transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
        }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="geoApertureGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.95" />
          </radialGradient>
        </defs>

        {/* Ambient Ground Shadow */}
        <ellipse
          cx="200"
          cy="255"
          rx="110"
          ry="48"
          className="fill-black/70 filter blur-[14px]"
        />

        {/* ── 1. Base GIS Coordinate Map Grid Plate (Solid Black + White Lines) ── */}
        <polygon
          points={`
            ${toIso(-115, -115, 0)}
            ${toIso(115, -115, 0)}
            ${toIso(115, 115, 0)}
            ${toIso(-115, 115, 0)}
          `}
          fill="#080808"
          stroke="#ffffff"
          strokeOpacity="0.3"
          strokeWidth="1"
        />

        {/* GIS Lat / Long Reticle Grid Lines */}
        {[-70, -35, 0, 35, 70].map((coord, idx) => (
          <g key={`grid-line-${idx}`}>
            <line
              x1={toIso(-115, coord, 0).split(",")[0]}
              y1={toIso(-115, coord, 0).split(",")[1]}
              x2={toIso(115, coord, 0).split(",")[0]}
              y2={toIso(115, coord, 0).split(",")[1]}
              stroke="#ffffff"
              strokeOpacity="0.12"
              strokeWidth="0.8"
              strokeDasharray="3 4"
            />
            <line
              x1={toIso(coord, -115, 0).split(",")[0]}
              y1={toIso(coord, -115, 0).split(",")[1]}
              x2={toIso(coord, 115, 0).split(",")[0]}
              y2={toIso(coord, 115, 0).split(",")[1]}
              stroke="#ffffff"
              strokeOpacity="0.12"
              strokeWidth="0.8"
              strokeDasharray="3 4"
            />
          </g>
        ))}

        {/* ── 2. Laser Optical Fiber Telemetry Links to Satellites ─────────── */}
        {satellites.map((sat) => {
          const coreCenter = toIso(0, 0, isHovered ? 75 : 55);
          const satPos = toIso(sat.x, sat.y, sat.z);
          const basePos = toIso(sat.x, sat.y, 0);

          return (
            <g key={`cable-${sat.id}`}>
              <line
                x1={satPos.split(",")[0]}
                y1={satPos.split(",")[1]}
                x2={basePos.split(",")[0]}
                y2={basePos.split(",")[1]}
                stroke="#ffffff"
                strokeOpacity="0.25"
                strokeWidth="0.8"
                strokeDasharray="2 3"
              />

              <line
                x1={coreCenter.split(",")[0]}
                y1={coreCenter.split(",")[1]}
                x2={satPos.split(",")[0]}
                y2={satPos.split(",")[1]}
                stroke={isHovered ? "#10b981" : "#ffffff"}
                strokeOpacity={isHovered ? "1" : "0.5"}
                strokeWidth={isHovered ? "1.4" : "1"}
              />
            </g>
          );
        })}

        {/* ── 3. Central Monolithic Layered Slabs (Solid Black + White Lines) ── */}
        {coreSlabs.map((idx) => {
          const separation = isHovered ? idx * 8 : 0;
          const zBase = idx * (slabThickness + 2) + separation;
          const zTop = zBase + slabThickness;
          const isTop = idx === coreSlabs.length - 1;

          const p1 = toIso(-slabSize, -slabSize, zTop);
          const p2 = toIso(slabSize, -slabSize, zTop);
          const p3 = toIso(slabSize, slabSize, zTop);
          const p4 = toIso(-slabSize, slabSize, zTop);

          const b2 = toIso(slabSize, -slabSize, zBase);
          const b3 = toIso(slabSize, slabSize, zBase);
          const b4 = toIso(-slabSize, slabSize, zBase);

          return (
            <g
              key={`slab-${idx}`}
              style={{
                transition: "transform 0.6s cubic-bezier(0.34, 1.45, 0.64, 1)",
                transform: isHovered ? `translateY(-${idx * 3.5}px)` : "translateY(0px)",
                transitionDelay: `${idx * 20}ms`,
              }}
            >
              {/* Left Face (Solid Deep Black) */}
              <polygon
                points={`${p4} ${p3} ${b3} ${b4}`}
                fill="#0a0a0a"
                stroke="#ffffff"
                strokeOpacity={isHovered ? "0.6" : "0.35"}
                strokeWidth="0.9"
              />

              {/* Right Face (Solid Pure Black) */}
              <polygon
                points={`${p3} ${p2} ${b2} ${b3}`}
                fill="#000000"
                stroke="#ffffff"
                strokeOpacity={isHovered ? "0.45" : "0.25"}
                strokeWidth="0.9"
              />

              {/* Top Face (Solid Matte Black + Crisp White Contour) */}
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill="#121212"
                stroke={isTop && isHovered ? "#10b981" : "#ffffff"}
                strokeOpacity={isTop && isHovered ? "1" : "0.75"}
                strokeWidth={isTop ? "1.2" : "0.9"}
              />

              {/* Specular Front Edge Line */}
              <line
                x1={p4.split(",")[0]}
                y1={p4.split(",")[1]}
                x2={p3.split(",")[0]}
                y2={p3.split(",")[1]}
                stroke={isHovered ? "#10b981" : "#ffffff"}
                strokeOpacity={isHovered ? "1" : "0.9"}
                strokeWidth="1.1"
              />

              {/* Top Slab: Circular GPS Aperture & Reticle */}
              {isTop && (
                <g>
                  <ellipse
                    cx="200"
                    cy={175 - zTop * 0.5 + 28}
                    rx="32"
                    ry="18"
                    fill="url(#geoApertureGlow)"
                    stroke={isHovered ? "#10b981" : "#ffffff"}
                    strokeOpacity={isHovered ? "1" : "0.8"}
                    strokeWidth="1.3"
                  />
                  <line
                    x1="176"
                    y1={175 - zTop * 0.5 + 25}
                    x2="224"
                    y2={175 - zTop * 0.5 + 25}
                    stroke={isHovered ? "#10b981" : "#ffffff"}
                    strokeOpacity={isHovered ? "0.8" : "0.4"}
                    strokeWidth="0.9"
                  />
                  <line
                    x1="172"
                    y1={175 - zTop * 0.5 + 28}
                    x2="228"
                    y2={175 - zTop * 0.5 + 28}
                    stroke={isHovered ? "#10b981" : "#ffffff"}
                    strokeOpacity={isHovered ? "1" : "0.5"}
                    strokeWidth="1"
                  />
                  <line
                    x1="178"
                    y1={175 - zTop * 0.5 + 31}
                    x2="222"
                    y2={175 - zTop * 0.5 + 31}
                    stroke={isHovered ? "#10b981" : "#ffffff"}
                    strokeOpacity={isHovered ? "0.8" : "0.4"}
                    strokeWidth="0.9"
                  />
                </g>
              )}
            </g>
          );
        })}

        {/* ── 4. Floating Satellite Diamonds ──────────────────────────────── */}
        {satellites.map((sat) => {
          const sz = sat.type === "olt" ? 14 : 10;
          const p1 = toIso(sat.x - sz, sat.y - sz, sat.z);
          const p2 = toIso(sat.x + sz, sat.y - sz, sat.z);
          const p3 = toIso(sat.x + sz, sat.y + sz, sat.z);
          const p4 = toIso(sat.x - sz, sat.y + sz, sat.z);

          return (
            <g key={`sat-badge-${sat.id}`}>
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill="#121212"
                stroke={sat.type === "olt" ? "#10b981" : "#ffffff"}
                strokeOpacity={sat.type === "olt" ? "1" : "0.7"}
                strokeWidth="1.2"
              />
              <circle
                cx={toIso(sat.x, sat.y, sat.z).split(",")[0]}
                cy={toIso(sat.x, sat.y, sat.z).split(",")[1]}
                r={sat.type === "olt" ? "2.6" : "1.8"}
                className={sat.type === "olt" ? "fill-emerald-400 animate-pulse" : "fill-white"}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 🌐 KONSEP 2: "The Stepped Fiber Infrastructure Matrix" (Solid Black + White)
// ═════════════════════════════════════════════════════════════════════════════
export function LinearFiberMatrixHero({
  className,
  size = "full",
  interactive = true,
}: LinearHeroProps) {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 14;
    setMouseOffset({ x: nx, y: ny });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMouseOffset({ x: 0, y: 0 });
  };

  const cardCount = 14;
  const cards = Array.from({ length: cardCount }, (_, i) => i);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative w-full h-full min-h-[340px] flex items-center justify-center select-none cursor-pointer group overflow-hidden",
        className
      )}
    >
      <svg
        viewBox="0 0 400 350"
        className="w-full max-w-[460px] h-full max-h-[380px] overflow-visible transition-transform duration-500 ease-out"
        style={{
          transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
        }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="200"
          cy="260"
          rx="120"
          ry="40"
          className="fill-black/60 filter blur-[12px]"
        />

        {cards.map((i) => {
          const baseHeight = 20 + Math.pow(i / (cardCount - 1), 1.9) * 115;
          const waveBounce = isHovered ? Math.sin((i / cardCount) * Math.PI * 1.6) * 18 : 0;
          const height = baseHeight + waveBounce;

          const cardDepth = 55;
          const spacing = 12;
          const xPos = (i - cardCount / 2) * spacing;
          const yPos = (i - cardCount / 2) * (spacing * 0.25);

          const ox = 200;
          const oy = 230;

          const p1 = toIso(xPos, yPos - cardDepth / 2, height, ox, oy);
          const p2 = toIso(xPos, yPos + cardDepth / 2, height, ox, oy);
          const b1 = toIso(xPos, yPos - cardDepth / 2, 0, ox, oy);
          const b2 = toIso(xPos, yPos + cardDepth / 2, 0, ox, oy);

          const isLead = i === cardCount - 1;

          return (
            <g
              key={`blade-${i}`}
              style={{
                transition: "all 0.55s cubic-bezier(0.34, 1.4, 0.64, 1)",
                transitionDelay: `${i * 15}ms`,
              }}
            >
              <polygon
                points={`${p1} ${p2} ${b2} ${b1}`}
                fill={isLead ? "#051f15" : "#080808"}
                stroke={isLead ? "#10b981" : "#ffffff"}
                strokeOpacity={isLead ? "1" : "0.35"}
                strokeWidth={isLead ? "1.4" : "0.9"}
              />

              <line
                x1={p1.split(",")[0]}
                y1={p1.split(",")[1]}
                x2={p2.split(",")[0]}
                y2={p2.split(",")[1]}
                stroke={isLead ? "#10b981" : "#ffffff"}
                strokeOpacity={isLead ? "1" : isHovered ? "0.9" : "0.6"}
                strokeWidth={isLead ? "2" : "1.1"}
              />
            </g>
          );
        })}

        {isHovered && (
          <line
            x1="90"
            y1="230"
            x2="310"
            y2="85"
            stroke="#10b981"
            strokeWidth="1.8"
            strokeDasharray="6 8"
            className="animate-pulse"
          />
        )}
      </svg>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 🗼 KONSEP 3: "Autonomous Network Sentinel" (Solid Black + White Lines)
// ═════════════════════════════════════════════════════════════════════════════
export function LinearNetworkSentinelHero({
  className,
  size = "full",
  interactive = true,
}: LinearHeroProps) {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 14;
    setMouseOffset({ x: nx, y: ny });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMouseOffset({ x: 0, y: 0 });
  };

  const spires = [
    { id: "spire-main", x: 0,   y: 0,   width: 38, defaultH: 110, activeH: 130, isCore: true },
    { id: "spire-w",    x: -42, y: -20, width: 28, defaultH: 70,  activeH: 88,  isCore: false },
    { id: "spire-e",    x: 42,  y: -20, width: 28, defaultH: 55,  activeH: 70,  isCore: false },
    { id: "spire-s",    x: 0,   y: 42,  width: 28, defaultH: 78,  activeH: 96,  isCore: false },
  ];

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative w-full h-full min-h-[340px] flex items-center justify-center select-none cursor-pointer group overflow-hidden",
        className
      )}
    >
      <svg
        viewBox="0 0 400 350"
        className="w-full max-w-[460px] h-full max-h-[380px] overflow-visible transition-transform duration-500 ease-out"
        style={{
          transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
        }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="200"
          cy="260"
          rx="115"
          ry="44"
          className="fill-black/60 filter blur-[12px]"
        />

        {/* Orbit Rings Revolving around Central Sentinel Spire */}
        <ellipse
          cx="200"
          cy={180 - (isHovered ? 35 : 20)}
          rx="105"
          ry="42"
          stroke={isHovered ? "#10b981" : "#ffffff"}
          strokeOpacity={isHovered ? "0.8" : "0.3"}
          strokeWidth="1"
          strokeDasharray="4 6"
          className="transition-colors duration-500"
        />
        <ellipse
          cx="200"
          cy={180 - (isHovered ? 55 : 40)}
          rx="75"
          ry="30"
          stroke={isHovered ? "#10b981" : "#ffffff"}
          strokeOpacity={isHovered ? "0.6" : "0.2"}
          strokeWidth="0.9"
          strokeDasharray="3 5"
          className="transition-colors duration-500"
        />

        {/* 4 Volumetric Spire Pillars (Solid Black + White Lines) */}
        {spires.map((sp, idx) => {
          const w = sp.width;
          const h = isHovered ? sp.activeH : sp.defaultH;
          const ox = 200;
          const oy = 210;

          const p1 = toIso(sp.x - w / 2, sp.y - w / 2, h, ox, oy);
          const p2 = toIso(sp.x + w / 2, sp.y - w / 2, h, ox, oy);
          const p3 = toIso(sp.x + w / 2, sp.y + w / 2, h, ox, oy);
          const p4 = toIso(sp.x - w / 2, sp.y + w / 2, h, ox, oy);

          const b2 = toIso(sp.x + w / 2, sp.y - w / 2, 0, ox, oy);
          const b3 = toIso(sp.x + w / 2, sp.y + w / 2, 0, ox, oy);
          const b4 = toIso(sp.x - w / 2, sp.y + w / 2, 0, ox, oy);

          return (
            <g
              key={sp.id}
              style={{
                transition: "all 0.65s cubic-bezier(0.34, 1.45, 0.64, 1)",
                transitionDelay: `${idx * 40}ms`,
              }}
            >
              <polygon
                points={`${p4} ${p3} ${b3} ${b4}`}
                fill="#0a0a0a"
                stroke="#ffffff"
                strokeOpacity={isHovered ? "0.6" : "0.35"}
                strokeWidth="0.9"
              />

              <polygon
                points={`${p3} ${p2} ${b2} ${b3}`}
                fill="#000000"
                stroke="#ffffff"
                strokeOpacity={isHovered ? "0.45" : "0.25"}
                strokeWidth="0.9"
              />

              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill="#121212"
                stroke={isHovered ? "#10b981" : "#ffffff"}
                strokeOpacity={isHovered ? "1" : "0.75"}
                strokeWidth={sp.isCore ? "1.4" : "0.9"}
              />

              <circle
                cx={toIso(sp.x, sp.y, h + 2, ox, oy).split(",")[0]}
                cy={toIso(sp.x, sp.y, h + 2, ox, oy).split(",")[1]}
                r={sp.isCore ? "3.2" : "2"}
                className={sp.isCore ? "fill-emerald-400 animate-pulse" : "fill-white"}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
