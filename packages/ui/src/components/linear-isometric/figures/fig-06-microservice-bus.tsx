"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIso, type LinearFigureProps } from "../iso-utils";

export function LinearMicroserviceBusFigure({
  className,
  size = "card",
  interactive = true,
}: LinearFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const busNodesRef = useRef<(SVGGElement | null)[]>([]);

  const busNodes = [
    { name: "Kong Ingress", x: -60, y: 0, z: 0,  nx: -0.35 },
    { name: "Spring Core",  x: -20, y: 0, z: 10, nx: -0.12 },
    { name: "Event Bus",    x: 20,  y: 0, z: 20, nx: 0.12 },
    { name: "Go Gateways",  x: 60,  y: 0, z: 0,  nx: 0.35 },
  ];

  // Directional Node Hop along Bus Rail
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5

    busNodes.forEach((n, idx) => {
      const el = busNodesRef.current[idx];
      if (!el) return;

      const diff = Math.abs(nx - n.nx);
      const proximity = Math.exp(-Math.pow(diff / 0.2, 2));
      const targetLift = -proximity * 16;

      gsap.to(el, {
        y: targetLift,
        duration: 0.4,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  };

  const handleMouseLeave = () => {
    busNodes.forEach((_, idx) => {
      const el = busNodesRef.current[idx];
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
        />

        {/* Parallel Guide Rails */}
        <line x1={toIso(-75, -20, 0).split(",")[0]} y1={toIso(-75, -20, 0).split(",")[1]} x2={toIso(75, -20, 0).split(",")[0]} y2={toIso(75, -20, 0).split(",")[1]} stroke="#27272a" strokeOpacity="0.5" strokeWidth="0.75" strokeDasharray="3 3" />
        <line x1={toIso(-75, 20, 0).split(",")[0]} y1={toIso(-75, 20, 0).split(",")[1]} x2={toIso(75, 20, 0).split(",")[0]} y2={toIso(75, 20, 0).split(",")[1]} stroke="#27272a" strokeOpacity="0.5" strokeWidth="0.75" strokeDasharray="3 3" />

        {busNodes.map((n, i) => {
          const sz = 15;
          const p1 = toIso(n.x - sz, n.y - sz / 2, n.z);
          const p2 = toIso(n.x + sz, n.y - sz / 2, n.z);
          const p3 = toIso(n.x + sz, n.y + sz, n.z);
          const p4 = toIso(n.x - sz, n.y + sz, n.z);

          const bPt = toIso(n.x, n.y, 0);
          const topPt = toIso(n.x, n.y, n.z);

          return (
            <g
              key={i}
              ref={(el) => {
                busNodesRef.current[i] = el;
              }}
            >
              <line
                x1={topPt.split(",")[0]}
                y1={topPt.split(",")[1]}
                x2={bPt.split(",")[0]}
                y2={bPt.split(",")[1]}
                stroke="#3f3f46"
                strokeOpacity="0.4"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />

              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill="#121215"
                stroke="#a1a1aa"
                strokeOpacity="0.85"
                strokeWidth="0.85"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              <circle
                cx={topPt.split(",")[0]}
                cy={topPt.split(",")[1]}
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
