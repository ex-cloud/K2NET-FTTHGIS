"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIso, type LinearFigureProps } from "../iso-utils";

export function LinearSpatialTopologyFigure({
  className,
  size = "card",
  interactive = true,
}: LinearFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<(SVGGElement | null)[]>([]);

  const nodes = [
    { id: "olt-root", x: 0,   y: 0,   z: 36, type: "olt", nx: 0,    ny: 0 },
    { id: "odp-1",    x: -42, y: -30, z: 18, type: "odp", nx: -0.3, ny: -0.2 },
    { id: "odp-2",    x: 42,  y: -30, z: 18, type: "odp", nx: 0.3,  ny: -0.2 },
    { id: "odp-3",    x: -42, y: 30,  z: 18, type: "odp", nx: -0.3, ny: 0.2 },
    { id: "odp-4",    x: 42,  y: 30,  z: 18, type: "odp", nx: 0.3,  ny: 0.2 },
  ];

  // Directional Node Elevation based on Cursor Proximity
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    nodes.forEach((n, idx) => {
      const el = nodesRef.current[idx];
      if (!el) return;

      const dist = Math.hypot(nx - n.nx, ny - n.ny);
      const proximity = Math.exp(-Math.pow(dist / 0.38, 2));
      const targetLift = -proximity * (n.type === "olt" ? 18 : 12);

      gsap.to(el, {
        y: targetLift,
        duration: 0.45,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  };

  const handleMouseLeave = () => {
    nodes.forEach((_, idx) => {
      const el = nodesRef.current[idx];
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
        <polygon
          points={`
            ${toIso(-70, -70, 0)}
            ${toIso(70, -70, 0)}
            ${toIso(70, 70, 0)}
            ${toIso(-70, 70, 0)}
          `}
          fill="#09090b"
          stroke="#3f3f46"
          strokeOpacity="0.5"
          strokeWidth="0.85"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <line x1={toIso(-70, 0, 0).split(",")[0]} y1={toIso(-70, 0, 0).split(",")[1]} x2={toIso(70, 0, 0).split(",")[0]} y2={toIso(70, 0, 0).split(",")[1]} stroke="#27272a" strokeOpacity="0.6" strokeWidth="0.75" strokeDasharray="3 3" />
        <line x1={toIso(0, -70, 0).split(",")[0]} y1={toIso(0, -70, 0).split(",")[1]} x2={toIso(0, 70, 0).split(",")[0]} y2={toIso(0, 70, 0).split(",")[1]} stroke="#27272a" strokeOpacity="0.6" strokeWidth="0.75" strokeDasharray="3 3" />

        {nodes.slice(1).map((odp) => {
          const rootPt = toIso(0, 0, nodes[0].z);
          const odpPt = toIso(odp.x, odp.y, odp.z);
          const basePt = toIso(odp.x, odp.y, 0);

          return (
            <g key={odp.id}>
              <line
                x1={odpPt.split(",")[0]}
                y1={odpPt.split(",")[1]}
                x2={basePt.split(",")[0]}
                y2={basePt.split(",")[1]}
                stroke="#3f3f46"
                strokeOpacity="0.4"
                strokeWidth="0.8"
                strokeDasharray="2 3"
              />

              <line
                x1={rootPt.split(",")[0]}
                y1={rootPt.split(",")[1]}
                x2={odpPt.split(",")[0]}
                y2={odpPt.split(",")[1]}
                stroke="#71717a"
                strokeOpacity="0.75"
                strokeWidth="0.95"
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {nodes.map((n, idx) => {
          const sz = n.type === "olt" ? 13 : 8.5;
          const p1 = toIso(n.x - sz, n.y - sz, n.z);
          const p2 = toIso(n.x + sz, n.y - sz, n.z);
          const p3 = toIso(n.x + sz, n.y + sz, n.z);
          const p4 = toIso(n.x - sz, n.y + sz, n.z);

          return (
            <g
              key={`badge-${n.id}`}
              ref={(el) => {
                nodesRef.current[idx] = el;
              }}
            >
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill="#121215"
                stroke={n.type === "olt" ? "#d4d4d8" : "#a1a1aa"}
                strokeOpacity="0.9"
                strokeWidth="0.9"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <circle
                cx={toIso(n.x, n.y, n.z).split(",")[0]}
                cy={toIso(n.x, n.y, n.z).split(",")[1]}
                r={n.type === "olt" ? "2.2" : "1.4"}
                fill="#ffffff"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
