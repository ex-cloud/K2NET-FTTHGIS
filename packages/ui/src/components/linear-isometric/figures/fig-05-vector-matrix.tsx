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
  const containerRef = useRef<HTMLDivElement>(null);
  const cubesRef = useRef<(SVGGElement | null)[]>([]);

  const grid = [
    { x: -30, y: -30, z: 0, nx: -0.3, ny: -0.3 },
    { x: 0,   y: -30, z: 0, nx: 0,    ny: -0.3 },
    { x: 30,  y: -30, z: 0, nx: 0.3,  ny: -0.3 },
    { x: -30, y: 0,   z: 0, nx: -0.3, ny: 0 },
    { x: 0,   y: 0,   z: 12, nx: 0,    ny: 0 },
    { x: 30,  y: 0,   z: 0, nx: 0.3,  ny: 0 },
    { x: -30, y: 30,  z: 0, nx: -0.3, ny: 0.3 },
    { x: 0,   y: 30,  z: 0, nx: 0,    ny: 0.3 },
    { x: 30,  y: 30,  z: 0, nx: 0.3,  ny: 0.3 },
  ];

  // Tactile Magnetic Pin Ripple based on Cursor Direction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    grid.forEach((c, idx) => {
      const el = cubesRef.current[idx];
      if (!el) return;

      const dist = Math.hypot(nx - c.nx, ny - c.ny);
      const proximity = Math.exp(-Math.pow(dist / 0.35, 2));
      const targetLift = -proximity * (idx === 4 ? 20 : 14);

      gsap.to(el, {
        y: targetLift,
        duration: 0.4,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  };

  const handleMouseLeave = () => {
    grid.forEach((_, idx) => {
      const el = cubesRef.current[idx];
      if (!el) return;
      gsap.to(el, {
        y: 0,
        duration: 0.6,
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
        {grid.map((c, i) => {
          const sz = 9.5;
          const h = 13;
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
              ref={(el) => {
                cubesRef.current[i] = el;
              }}
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
