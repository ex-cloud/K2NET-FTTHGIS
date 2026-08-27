"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIso, toIsoPt, isoRoundedRectPath, type LinearFigureProps } from "../iso-utils";

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
  const cornerRadius = 3.8;

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
          const r = cornerRadius;
          const ox = 140;
          const oy = originY;

          const topPath = isoRoundedRectPath(p.x, p.y, w, w, h, r, ox, oy);

          const x1 = p.x - w / 2;
          const x2 = p.x + w / 2;
          const y1 = p.y - w / 2;
          const y2 = p.y + w / 2;

          const p6Top = toIsoPt(x1 + r, y2, h, ox, oy);
          const p5Top = toIsoPt(x2 - r, y2, h, ox, oy);
          const c3Top = toIsoPt(x2, y2, h, ox, oy);
          const p4Top = toIsoPt(x2, y2 - r, h, ox, oy);
          const p3Top = toIsoPt(x2, y1 + r, h, ox, oy);
          const c4Top = toIsoPt(x1, y2, h, ox, oy);
          const p7Top = toIsoPt(x1, y2 - r, h, ox, oy);

          const p6Base = toIsoPt(x1 + r, y2, 0, ox, oy);
          const p5Base = toIsoPt(x2 - r, y2, 0, ox, oy);
          const c3Base = toIsoPt(x2, y2, 0, ox, oy);
          const p4Base = toIsoPt(x2, y2 - r, 0, ox, oy);
          const p3Base = toIsoPt(x2, y1 + r, 0, ox, oy);
          const c4Base = toIsoPt(x1, y2, 0, ox, oy);
          const p7Base = toIsoPt(x1, y2 - r, 0, ox, oy);

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
                strokeOpacity="0.6"
                strokeWidth="0.85"
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
                strokeOpacity="0.45"
                strokeWidth="0.85"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Top Face (Smooth Rounded Isometric Polygon) */}
              <path
                d={topPath}
                fill="#121215"
                stroke="#71717a"
                strokeOpacity="0.85"
                strokeWidth="0.9"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Recessed Aperture Diamond on Top Face with Rounded Joins */}
              <path
                d={isoRoundedRectPath(p.x, p.y, 9, 9, h + 1, 1.8, ox, oy)}
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
