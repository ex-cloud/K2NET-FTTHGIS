"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIsoPt, isoRoundedRectPath, type LinearFigureProps } from "../iso-utils";

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
  const cornerRadius = 2.4;

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
          const r = cornerRadius;
          const ox = 140;
          const oy = originY;

          const topPath = isoRoundedRectPath(c.x, c.y, sz * 2, sz * 2, c.z + h, r, ox, oy);

          const x1 = c.x - sz;
          const x2 = c.x + sz;
          const y1 = c.y - sz;
          const y2 = c.y + sz;

          const p6Top = toIsoPt(x1 + r, y2, c.z + h, ox, oy);
          const p5Top = toIsoPt(x2 - r, y2, c.z + h, ox, oy);
          const c3Top = toIsoPt(x2, y2, c.z + h, ox, oy);
          const p4Top = toIsoPt(x2, y2 - r, c.z + h, ox, oy);
          const p3Top = toIsoPt(x2, y1 + r, c.z + h, ox, oy);
          const c4Top = toIsoPt(x1, y2, c.z + h, ox, oy);
          const p7Top = toIsoPt(x1, y2 - r, c.z + h, ox, oy);

          const p6Base = toIsoPt(x1 + r, y2, c.z, ox, oy);
          const p5Base = toIsoPt(x2 - r, y2, c.z, ox, oy);
          const c3Base = toIsoPt(x2, y2, c.z, ox, oy);
          const p4Base = toIsoPt(x2, y2 - r, c.z, ox, oy);
          const p3Base = toIsoPt(x2, y1 + r, c.z, ox, oy);
          const c4Base = toIsoPt(x1, y2, c.z, ox, oy);
          const p7Base = toIsoPt(x1, y2 - r, c.z, ox, oy);

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
              {/* Left Face with Rounded Corner Fillet */}
              <path
                d={`
                  M ${p7Top.x.toFixed(1)} ${p7Top.y.toFixed(1)}
                  Q ${c4Top.x.toFixed(1)} ${c4Top.y.toFixed(1)} ${p6Top.x.toFixed(1)} ${p6Top.y.toFixed(1)}
                  L ${p5Top.x.toFixed(1)} ${p5Top.y.toFixed(1)}
                  L ${p5Base.x.toFixed(1)} ${p5Base.y.toFixed(1)}
                  L ${p6Base.x.toFixed(1)} ${p6Base.y.toFixed(1)}
                  Q ${c4Base.x.toFixed(1)} ${c4Base.y.toFixed(1)} ${p7Base.x.toFixed(1)} ${p7Base.y.toFixed(1)}
                  Z
                `}
                fill="#09090b"
                stroke="#3f3f46"
                strokeOpacity="0.5"
                strokeWidth="0.75"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Right Face with Rounded Corner Fillet */}
              <path
                d={`
                  M ${p5Top.x.toFixed(1)} ${p5Top.y.toFixed(1)}
                  Q ${c3Top.x.toFixed(1)} ${c3Top.y.toFixed(1)} ${p4Top.x.toFixed(1)} ${p4Top.y.toFixed(1)}
                  L ${p3Top.x.toFixed(1)} ${p3Top.y.toFixed(1)}
                  L ${p3Base.x.toFixed(1)} ${p3Base.y.toFixed(1)}
                  L ${p4Base.x.toFixed(1)} ${p4Base.y.toFixed(1)}
                  Q ${c3Base.x.toFixed(1)} ${c3Base.y.toFixed(1)} ${p5Base.x.toFixed(1)} ${p5Base.y.toFixed(1)}
                  Z
                `}
                fill="#000000"
                stroke="#27272a"
                strokeOpacity="0.4"
                strokeWidth="0.75"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Top Face with Rounded Isometric Polygon */}
              <path
                d={topPath}
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
