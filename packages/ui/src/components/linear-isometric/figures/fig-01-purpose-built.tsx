"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIso, type LinearFigureProps } from "../iso-utils";

export function LinearPurposeBuiltFigure({
  className,
  size = "card",
  interactive = true,
}: LinearFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slabsRef = useRef<(SVGGElement | null)[]>([]);

  const layers = [0, 1, 2, 3, 4, 5];
  const slabSize = size === "hero" ? 58 : 50;
  const slabThickness = size === "hero" ? 9 : 7.5;
  const originY = size === "hero" ? 155 : 148;
  const topSlabIndex = layers.length - 1;

  // Aperture radius calculation (exact isometric projection of a flat circle)
  const apertureRadius = size === "hero" ? 27 : 23;
  const apertureRx = apertureRadius * 1.2247;
  const apertureRy = apertureRadius * 0.7071;

  // Top slab center coordinate
  const zTopFinal = topSlabIndex * (slabThickness + 2) + slabThickness;
  const topCenterY = originY - zTopFinal;

  // Smooth directional cursor interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    // Directional slab lift: cursor vertical position expands/contracts the stack
    const liftIntensity = Math.max(0.4, 1.2 - ny * 1.2);

    slabsRef.current.forEach((slab, idx) => {
      if (!slab) return;
      // Higher slabs lift more, influenced by cursor direction (nx, ny)
      const targetY = -idx * (5.5 * liftIntensity) - (idx === topSlabIndex ? 6 : 0);
      const targetX = nx * (idx * 2.5);

      gsap.to(slab, {
        x: targetX,
        y: targetY,
        duration: 0.45,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  };

  const handleMouseLeave = () => {
    slabsRef.current.forEach((slab) => {
      if (!slab) return;
      gsap.to(slab, {
        x: 0,
        y: 0,
        duration: 0.65,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative w-full flex items-center justify-center select-none cursor-pointer group overflow-hidden",
        size === "hero" ? "h-[320px] max-w-[420px]" : "h-[240px]",
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
          <radialGradient id="apertureMutedGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#222226" stopOpacity="1" />
            <stop offset="100%" stopColor="#050507" stopOpacity="1" />
          </radialGradient>

          <clipPath id="fig1CenterApertureClip">
            <ellipse
              cx="140"
              cy={topCenterY}
              rx={apertureRx}
              ry={apertureRy}
            />
          </clipPath>
        </defs>

        {/* Ambient Ground Shadow */}
        <ellipse
          cx="140"
          cy={originY + 45}
          rx="72"
          ry="32"
          className="fill-black/80 filter blur-[10px]"
        />

        {/* 6 Layered Slabs with Rounded Muted Zinc Lines (Linear Style) */}
        {layers.map((idx) => {
          const zBase = idx * (slabThickness + 2);
          const zTop = zBase + slabThickness;
          const isTop = idx === topSlabIndex;

          const p1 = toIso(-slabSize, -slabSize, zTop, 140, originY);
          const p2 = toIso(slabSize, -slabSize, zTop, 140, originY);
          const p3 = toIso(slabSize, slabSize, zTop, 140, originY);
          const p4 = toIso(-slabSize, slabSize, zTop, 140, originY);

          const b2 = toIso(slabSize, -slabSize, zBase, 140, originY);
          const b3 = toIso(slabSize, slabSize, zBase, 140, originY);
          const b4 = toIso(-slabSize, slabSize, zBase, 140, originY);

          return (
            <g
              key={idx}
              ref={(el) => {
                slabsRef.current[idx] = el;
              }}
            >
              {/* Left Face (Deep Matte Charcoal) */}
              <polygon
                points={`${p4} ${p3} ${b3} ${b4}`}
                fill="#09090b"
                stroke="#3f3f46"
                strokeOpacity="0.6"
                strokeWidth="0.85"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Right Face (Deep Black) */}
              <polygon
                points={`${p3} ${p2} ${b2} ${b3}`}
                fill="#000000"
                stroke="#27272a"
                strokeOpacity="0.45"
                strokeWidth="0.85"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Top Face (Matte Obsidian + Thin Zinc-400 Outline) */}
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill="#121215"
                stroke="#71717a"
                strokeOpacity="0.8"
                strokeWidth={isTop ? "1" : "0.85"}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Leading Specular Ridge Edge Highlight (Muted Zinc-300) */}
              <line
                x1={p4.split(",")[0]}
                y1={p4.split(",")[1]}
                x2={p3.split(",")[0]}
                y2={p3.split(",")[1]}
                stroke="#a1a1aa"
                strokeOpacity="0.8"
                strokeWidth="1.1"
                strokeLinecap="round"
              />

              {/* Top Slab: Center Isometric Aperture with K2NET Concentric Waves */}
              {isTop && (
                <g>
                  {/* Recessed Center Aperture Cavity Background */}
                  <ellipse
                    cx="140"
                    cy={topCenterY}
                    rx={apertureRx}
                    ry={apertureRy}
                    fill="url(#apertureMutedGlow)"
                    stroke="#a1a1aa"
                    strokeOpacity="0.9"
                    strokeWidth="1.1"
                  />

                  {/* K2NET Vector Lines & Concentric Radar Waves (Exact Linear-Style Chords) */}
                  <g clipPath="url(#fig1CenterApertureClip)">
                    {/* Horizontal Linear Chords in Lower Half of Cavity */}
                    {[-10, -6, -2, 2, 6, 10].map((offset, cIdx) => (
                      <line
                        key={`chord-${cIdx}`}
                        x1="100"
                        y1={topCenterY + offset}
                        x2="180"
                        y2={topCenterY + offset}
                        stroke="#71717a"
                        strokeOpacity="0.75"
                        strokeWidth="0.85"
                        strokeLinecap="round"
                      />
                    ))}

                    {/* Concentric Fiber Wave Radar Arcs */}
                    <ellipse
                      cx="140"
                      cy={topCenterY}
                      rx={apertureRx * 0.72}
                      ry={apertureRy * 0.72}
                      stroke="#d4d4d8"
                      strokeOpacity="0.85"
                      strokeWidth="1"
                      strokeDasharray="4 3"
                    />

                    <ellipse
                      cx="140"
                      cy={topCenterY}
                      rx={apertureRx * 0.42}
                      ry={apertureRy * 0.42}
                      stroke="#e4e4e7"
                      strokeOpacity="0.95"
                      strokeWidth="1.1"
                    />
                  </g>

                  {/* Center K2NET Core Emitter Beacon (Sharp Silver/White Vector Mark) */}
                  <circle
                    cx="140"
                    cy={topCenterY}
                    r={size === "hero" ? "3.2" : "2.6"}
                    fill="#ffffff"
                    className="filter drop-shadow-[0_0_4px_rgba(255,255,255,0.7)]"
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
