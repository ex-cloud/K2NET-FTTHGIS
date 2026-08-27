"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIso, toIsoPt, isoRoundedRectPath, type LinearFigureProps } from "../iso-utils";

export function LinearMicroserviceBusFigure({
  className,
  size = "card",
  interactive = true,
}: LinearFigureProps) {
  const busNodesRef = useRef<(SVGGElement | null)[]>([]);

  const busNodes = [
    { name: "Kong Ingress", x: -60, y: 0, z: 0,  idx: 0 },
    { name: "Spring Core",  x: -20, y: 0, z: 10, idx: 1 },
    { name: "Event Bus",    x: 20,  y: 0, z: 20, idx: 2 },
    { name: "Go Gateways",  x: 60,  y: 0, z: 0,  idx: 3 },
  ];

  const cornerRadius = 3.5;

  // Direct Per-Node Hover Trigger along Bus Rail
  const handleBusNodeHover = (hoveredIdx: number) => {
    if (!interactive) return;

    busNodes.forEach((n) => {
      const el = busNodesRef.current[n.idx];
      if (!el) return;

      const isHovered = n.idx === hoveredIdx;
      const targetLift = isHovered ? -20 : Math.abs(n.idx - hoveredIdx) === 1 ? -8 : 0;

      gsap.to(el, {
        y: targetLift,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  };

  const handleBusLeave = () => {
    busNodes.forEach((_, idx) => {
      const el = busNodesRef.current[idx];
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
        onMouseLeave={handleBusLeave}
      >
        {/* Main Bus Track Rail */}
        <line
          x1={toIso(-75, 0, 0).split(",")[0]}
          y1={toIso(-75, 0, 0).split(",")[1]}
          x2={toIso(75, 0, 0).split(",")[0]}
          y2={toIso(75, 0, 0).split(",")[1]}
          stroke="#71717a"
          strokeOpacity="0.75"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="pointer-events-none"
        />

        {/* Parallel Guide Rails */}
        <line x1={toIso(-75, -20, 0).split(",")[0]} y1={toIso(-75, -20, 0).split(",")[1]} x2={toIso(75, -20, 0).split(",")[0]} y2={toIso(75, -20, 0).split(",")[1]} stroke="#27272a" strokeOpacity="0.5" strokeWidth="0.75" strokeDasharray="3 3" strokeLinecap="round" className="pointer-events-none" />
        <line x1={toIso(-75, 20, 0).split(",")[0]} y1={toIso(-75, 20, 0).split(",")[1]} x2={toIso(75, 20, 0).split(",")[0]} y2={toIso(75, 20, 0).split(",")[1]} stroke="#27272a" strokeOpacity="0.5" strokeWidth="0.75" strokeDasharray="3 3" strokeLinecap="round" className="pointer-events-none" />

        {busNodes.map((n) => {
          const sz = 15;
          const bPt = toIsoPt(n.x, n.y, 0);
          const topPt = toIsoPt(n.x, n.y, n.z);

          return (
            <g
              key={n.name}
              ref={(el) => {
                busNodesRef.current[n.idx] = el;
              }}
              className="cursor-pointer"
              onMouseEnter={() => handleBusNodeHover(n.idx)}
              onMouseMove={() => handleBusNodeHover(n.idx)}
            >
              <line
                x1={bPt.x.toFixed(1)}
                y1={bPt.y.toFixed(1)}
                x2={topPt.x.toFixed(1)}
                y2={topPt.y.toFixed(1)}
                stroke="#52525b"
                strokeOpacity="0.6"
                strokeWidth="0.85"
                strokeDasharray="2 2"
                strokeLinecap="round"
              />

              {/* Rounded Plate Node */}
              <path
                d={isoRoundedRectPath(n.x, n.y, sz * 2, sz * 1.5, n.z, cornerRadius, 140, 140)}
                fill="#121215"
                stroke="#71717a"
                strokeOpacity="0.85"
                strokeWidth="0.9"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              <circle
                cx={topPt.x.toFixed(1)}
                cy={topPt.y.toFixed(1)}
                r="1.8"
                fill="#ffffff"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
