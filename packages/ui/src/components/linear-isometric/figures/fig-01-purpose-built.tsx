"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIso, type LinearFigureProps } from "../iso-utils";

// Official K2NET Brand Watermark Base64 Data URI
const K2NET_LOGO_B64 =
  "data:image/png;base64,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";

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

    const liftIntensity = Math.max(0.4, 1.2 - ny * 1.2);

    slabsRef.current.forEach((slab, idx) => {
      if (!slab) return;
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
            <stop offset="0%" stopColor="#27272a" stopOpacity="1" />
            <stop offset="85%" stopColor="#09090b" stopOpacity="1" />
          </radialGradient>
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

              {/* Top Slab: Exact Center Isometric Aperture with Official K2NET Logo */}
              {isTop && (
                <g>
                  {/* Recessed Center Aperture Rim Cavity */}
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

                  {/* Horizontal Linear Chords inside aperture */}
                  {[-8, -4, 0, 4, 8].map((offset, cIdx) => {
                    const halfW = Math.sqrt(Math.max(0, 1 - Math.pow(offset / apertureRy, 2))) * (apertureRx - 3);
                    return (
                      <line
                        key={`chord-${cIdx}`}
                        x1={140 - halfW}
                        y1={topCenterY + offset}
                        x2={140 + halfW}
                        y2={topCenterY + offset}
                        stroke="#71717a"
                        strokeOpacity="0.4"
                        strokeWidth="0.75"
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Official K2NET Logo Image mapped into 30-degree isometric perspective */}
                  <g
                    transform={`translate(140, ${topCenterY}) matrix(0.866025 0.5 -0.866025 0.5 0 0)`}
                  >
                    <image
                      href={K2NET_LOGO_B64}
                      x={size === "hero" ? -24 : -19}
                      y={size === "hero" ? -24 : -19}
                      width={size === "hero" ? 48 : 38}
                      height={size === "hero" ? 48 : 38}
                      className="filter brightness-0 invert opacity-95 drop-shadow-[0_0_8px_rgba(255,255,255,0.85)]"
                    />
                  </g>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
