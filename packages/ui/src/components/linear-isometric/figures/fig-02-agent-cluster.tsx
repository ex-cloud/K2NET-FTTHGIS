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
  const pillarsRef = useRef<(SVGGElement | null)[]>([]);

  const pillars = [
    { id: "p1", x: -28, y: -28, width: 26, defaultH: 58, idx: 0 },
    { id: "p2", x: 28,  y: -28, width: 26, defaultH: 34, idx: 1 },
    { id: "p3", x: -28, y: 28,  width: 26, defaultH: 82, idx: 2 },
    { id: "p4", x: 28,  y: 28,  width: 26, defaultH: 48, idx: 3 },
  ];

  const originY = size === "hero" ? 165 : 158;

  // Direct Per-Pillar Hover Trigger
  const handlePillarHover = (hoveredIdx: number) => {
    if (!interactive) return;

    pillars.forEach((p) => {
      const el = pillarsRef.current[p.idx];
      if (!el) return;

      const isHovered = p.idx === hoveredIdx;
      const targetLift = isHovered ? -24 : -6;

      gsap.to(el, {
        y: targetLift,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  };

  const handlePillarsLeave = () => {
    pillarsRef.current.forEach((el) => {
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
        onMouseLeave={handlePillarsLeave}
      >
        <polygon
          points={`
            ${toIso(-55, -55, 0, 140, originY)}
            ${toIso(55, -55, 0, 140, originY)}
            ${toIso(55, 55, 0, 140, originY)}
            ${toIso(-55, 55, 0, 140, originY)}
          `}
          className="fill-black/70 filter blur-[8px] pointer-events-none"
        />

        {pillars.map((p) => {
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
                pillarsRef.current[p.idx] = el;
              }}
              className="cursor-pointer"
              onMouseEnter={() => handlePillarHover(p.idx)}
              onMouseMove={() => handlePillarHover(p.idx)}
            >
              {/* Left Face */}
              <polygon
                points={`${p4} ${p3} ${b3} ${b4}`}
                fill="#09090b"
                stroke="#3f3f46"
                strokeOpacity="0.6"
                strokeWidth="0.85"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Right Face */}
              <polygon
                points={`${p3} ${p2} ${b2} ${b3}`}
                fill="#000000"
                stroke="#27272a"
                strokeOpacity="0.45"
                strokeWidth="0.85"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Top Face */}
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
