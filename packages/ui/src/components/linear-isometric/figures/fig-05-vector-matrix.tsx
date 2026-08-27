"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIso, type LinearFigureProps } from "../iso-utils";

export function LinearVectorMatrixFigure({
  className,
  size = "card",
  interactive = true,
}: LinearFigureProps) {
  const cubesRef = useRef<(SVGGElement | null)[]>([]);

  const grid = [
    { x: -30, y: -30, z: 0, r: 0, c: 0 },
    { x: 0,   y: -30, z: 0, r: 0, c: 1 },
    { x: 30,  y: -30, z: 0, r: 0, c: 2 },
    { x: -30, y: 0,   z: 0, r: 1, c: 0 },
    { x: 0,   y: 0,   z: 12, r: 1, c: 1 },
    { x: 30,  y: 0,   z: 0, r: 1, c: 2 },
    { x: -30, y: 30,  z: 0, r: 2, c: 0 },
    { x: 0,   y: 30,  z: 0, r: 2, c: 1 },
    { x: 30,  y: 30,  z: 0, r: 2, c: 2 },
  ];

  const originY = 145;

  // Direct Per-Cube Hover Trigger
  const handleCubeHover = (hoveredIdx: number) => {
    if (!interactive) return;

    const hovered = grid[hoveredIdx];

    grid.forEach((c, idx) => {
      const el = cubesRef.current[idx];
      if (!el) return;

      const gridDist = Math.hypot(c.r - hovered.r, c.c - hovered.c);
      const isHovered = idx === hoveredIdx;
      const targetLift = isHovered ? -22 : gridDist === 1 ? -8 : 0;

      gsap.to(el, {
        y: targetLift,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  };

  const handleMatrixLeave = () => {
    grid.forEach((_, idx) => {
      const el = cubesRef.current[idx];
      if (!el) return;
      gsap.to(el, {
        y: 0,
        duration: 0.55,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  };

  return (
    <div
      className={cn(
        "relative w-full flex items-center justify-center select-none overflow-hidden pointer-events-none",
        size === "hero" ? "h-[320px] max-w-[420px]" : "h-[240px]",
        className
      )}
    >
      <svg
        viewBox="0 0 280 240"
        className="w-full h-full overflow-visible pointer-events-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        onMouseLeave={handleMatrixLeave}
      >
        {grid.map((c, i) => {
          const sz = 9.5;
          const h = 13;
          const ox = 140;
          const oy = originY;

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
              ref={(el) => {
                cubesRef.current[i] = el;
              }}
              className="cursor-pointer"
              onMouseEnter={() => handleCubeHover(i)}
              onMouseMove={() => handleCubeHover(i)}
            >
              <polygon points={`${p4} ${p3} ${b3} ${b4}`} fill="#09090b" stroke="#3f3f46" strokeOpacity="0.5" strokeWidth="0.75" strokeLinejoin="round" strokeLinecap="round" />
              <polygon points={`${p3} ${p2} ${b2} ${b3}`} fill="#000000" stroke="#27272a" strokeOpacity="0.4" strokeWidth="0.75" strokeLinejoin="round" strokeLinecap="round" />
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill={i === 4 ? "#18181b" : "#101012"}
                stroke={i === 4 ? "#d4d4d8" : "#71717a"}
                strokeOpacity={i === 4 ? "1" : "0.75"}
                strokeWidth="0.85"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
