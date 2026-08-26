"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIso, type LinearFigureProps } from "../iso-utils";

export function LinearAgentClusterFigure({
  className,
  size = "card",
  interactive = true,
}: LinearFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillarsRef = useRef<(SVGGElement | null)[]>([]);

  const pillars = [
    { id: "p1", x: -28, y: -28, width: 26, defaultH: 58, nx: -0.28, ny: -0.28 },
    { id: "p2", x: 28,  y: -28, width: 26, defaultH: 34, nx: 0.28,  ny: -0.28 },
    { id: "p3", x: -28, y: 28,  width: 26, defaultH: 82, nx: -0.28, ny: 0.28 },
    { id: "p4", x: 28,  y: 28,  width: 26, defaultH: 48, nx: 0.28,  ny: 0.28 },
  ];

  const originY = size === "hero" ? 165 : 158;

  // Directional Cursor Proximity Interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    pillars.forEach((p, idx) => {
      const el = pillarsRef.current[idx];
      if (!el) return;

      // Calculate distance between cursor and this specific pillar
      const dist = Math.hypot(nx - p.nx, ny - p.ny);
      // Closer pillar gets higher lift (smooth Gaussian falloff)
      const proximity = Math.exp(-Math.pow(dist / 0.45, 2));
      const targetLift = -proximity * 22;

      gsap.to(el, {
        y: targetLift,
        duration: 0.45,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  };

  const handleMouseLeave = () => {
    pillarsRef.current.forEach((el) => {
      if (!el) return;
      gsap.to(el, {
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
        <polygon
          points={`
            ${toIso(-55, -55, 0, 140, originY)}
            ${toIso(55, -55, 0, 140, originY)}
            ${toIso(55, 55, 0, 140, originY)}
            ${toIso(-55, 55, 0, 140, originY)}
          `}
          className="fill-black/70 filter blur-[8px]"
        />

        {pillars.map((p, idx) => {
          const w = p.width;
          const h = p.defaultH;
          const ox = 140;
          const oy = originY;

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
              ref={(el) => {
                pillarsRef.current[idx] = el;
              }}
            >
              {/* Left Face (Deep Charcoal) */}
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

              {/* Top Face (Matte Obsidian with Muted Zinc-500 Outline) */}
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill="#121215"
                stroke="#71717a"
                strokeOpacity="0.85"
                strokeWidth="0.9"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Recessed Aperture Diamond on Top Face */}
              <polygon
                points={`
                  ${toIso(p.x - 4.5, p.y - 4.5, h + 1, ox, oy)}
                  ${toIso(p.x + 4.5, p.y - 4.5, h + 1, ox, oy)}
                  ${toIso(p.x + 4.5, p.y + 4.5, h + 1, ox, oy)}
                  ${toIso(p.x - 4.5, p.y + 4.5, h + 1, ox, oy)}
                `}
                fill="#09090b"
                stroke="#3f3f46"
                strokeOpacity="0.75"
                strokeWidth="0.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Center Specular Dot */}
              <circle
                cx={toIso(p.x, p.y, h + 1, ox, oy).split(",")[0]}
                cy={toIso(p.x, p.y, h + 1, ox, oy).split(",")[1]}
                r="1.4"
                fill="#d4d4d8"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
