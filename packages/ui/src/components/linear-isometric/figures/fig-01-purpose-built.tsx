"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIso, type LinearFigureProps } from "../iso-utils";

export function LinearPurposeBuiltFigure({
  className,
  isHovered,
  size = "card",
  interactive = true,
}: LinearFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slabsRef = useRef<(SVGGElement | null)[]>([]);
  const [localHover, setLocalHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : localHover;

  // GSAP Smooth Stagger Extrusion
  useEffect(() => {
    const validSlabs = slabsRef.current.filter(Boolean);
    if (validSlabs.length === 0) return;

    if (active) {
      gsap.to(validSlabs, {
        y: (i) => -i * 7,
        duration: 0.65,
        ease: "back.out(1.8)",
        stagger: 0.03,
        overwrite: "auto",
      });
    } else {
      gsap.to(validSlabs, {
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.02,
        overwrite: "auto",
      });
    }
  }, [active]);

  // GSAP Parallax Tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 12;

    gsap.to(containerRef.current.querySelector("svg"), {
      x: nx,
      y: ny,
      duration: 0.4,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const handleMouseLeave = () => {
    setLocalHover(false);
    if (containerRef.current) {
      gsap.to(containerRef.current.querySelector("svg"), {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.5)",
      });
    }
  };

  const layers = [0, 1, 2, 3, 4, 5];
  const slabSize = size === "hero" ? 58 : 50;
  const slabThickness = size === "hero" ? 9 : 7.5;
  const originY = size === "hero" ? 155 : 148;
  const topSlabIndex = layers.length - 1;

  // Aperture radius calculation (exact isometric projection of a flat circle)
  const apertureRadius = size === "hero" ? 28 : 24;
  const apertureRx = apertureRadius * 1.2247;
  const apertureRy = apertureRadius * 0.7071;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setLocalHover(true)}
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
          {/* Subtle Ambient Depth Lighting */}
          <radialGradient id="apertureMutedGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#27272a" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="1" />
          </radialGradient>

          {/* Clip path for horizontal aperture chords */}
          <clipPath id="fig1ApertureClip">
            <ellipse
              cx="140"
              cy={originY - (topSlabIndex * (slabThickness + 2) + slabThickness)}
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

          const topCenterY = originY - zTop;

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
                strokeOpacity={active ? "0.8" : "0.5"}
                strokeWidth="0.85"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Right Face (Deep Black) */}
              <polygon
                points={`${p3} ${p2} ${b2} ${b3}`}
                fill="#000000"
                stroke="#27272a"
                strokeOpacity={active ? "0.6" : "0.35"}
                strokeWidth="0.85"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Top Face (Slightly Lighter Matte Obsidian + Thin Zinc-400 Outline) */}
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill="#121215"
                stroke={active ? "#a1a1aa" : "#71717a"}
                strokeOpacity={active ? "0.9" : "0.7"}
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
                stroke={active ? "#d4d4d8" : "#a1a1aa"}
                strokeOpacity={active ? "0.95" : "0.75"}
                strokeWidth="1.1"
                strokeLinecap="round"
              />

              {/* Top Slab: Mathematically Exact Isometric Circle Aperture & Chords */}
              {isTop && (
                <g>
                  {/* Recessed Aperture Cavity */}
                  <ellipse
                    cx="140"
                    cy={topCenterY}
                    rx={apertureRx}
                    ry={apertureRy}
                    fill="url(#apertureMutedGlow)"
                    stroke={active ? "#a1a1aa" : "#71717a"}
                    strokeOpacity={active ? "0.95" : "0.75"}
                    strokeWidth="1"
                  />

                  {/* Inner Isometric Chords (Clipped inside the circle) */}
                  <g clipPath="url(#fig1ApertureClip)">
                    {[-10, -5, 0, 5, 10].map((offset, cIdx) => (
                      <line
                        key={`chord-${cIdx}`}
                        x1="100"
                        y1={topCenterY + offset}
                        x2="180"
                        y2={topCenterY + offset}
                        stroke={active ? "#71717a" : "#52525b"}
                        strokeOpacity={active ? "0.75" : "0.5"}
                        strokeWidth="0.75"
                        strokeLinecap="round"
                      />
                    ))}
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
