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
  const nodesRef = useRef<(SVGGElement | null)[]>([]);

  const nodes = [
    { id: "olt-root", x: 0,   y: 0,   z: 36, type: "olt", idx: 0 },
    { id: "odp-1",    x: -42, y: -30, z: 18, type: "odp", idx: 1 },
    { id: "odp-2",    x: 42,  y: -30, z: 18, type: "odp", idx: 2 },
    { id: "odp-3",    x: -42, y: 30,  z: 18, type: "odp", idx: 3 },
    { id: "odp-4",    x: 42,  y: 30,  z: 18, type: "odp", idx: 4 },
  ];

  // Direct Per-Node Hover
  const handleNodeHover = (hoveredIdx: number) => {
    if (!interactive) return;

    nodes.forEach((n) => {
      const el = nodesRef.current[n.idx];
      if (!el) return;

      const isHovered = n.idx === hoveredIdx;
      const targetLift = isHovered ? (n.type === "olt" ? -22 : -16) : 0;

      gsap.to(el, {
        y: targetLift,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  };

  const handleNodesLeave = () => {
    nodesRef.current.forEach((el) => {
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
        onMouseLeave={handleNodesLeave}
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
          className="pointer-events-none"
        />

        <line x1={toIso(-70, 0, 0).split(",")[0]} y1={toIso(-70, 0, 0).split(",")[1]} x2={toIso(70, 0, 0).split(",")[0]} y2={toIso(70, 0, 0).split(",")[1]} stroke="#27272a" strokeOpacity="0.6" strokeWidth="0.75" strokeDasharray="3 3" className="pointer-events-none" />
        <line x1={toIso(0, -70, 0).split(",")[0]} y1={toIso(0, -70, 0).split(",")[1]} x2={toIso(0, 70, 0).split(",")[0]} y2={toIso(0, 70, 0).split(",")[1]} stroke="#27272a" strokeOpacity="0.6" strokeWidth="0.75" strokeDasharray="3 3" className="pointer-events-none" />

        {nodes.slice(1).map((odp) => {
          const rootPt = toIso(0, 0, nodes[0].z);
          const odpPt = toIso(odp.x, odp.y, odp.z);
          const basePt = toIso(odp.x, odp.y, 0);

          return (
            <g key={`feeder-${odp.id}`} className="pointer-events-none">
              <line
                x1={basePt.split(",")[0]}
                y1={basePt.split(",")[1]}
                x2={odpPt.split(",")[0]}
                y2={odpPt.split(",")[1]}
                stroke="#3f3f46"
                strokeOpacity="0.5"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />
              <line
                x1={rootPt.split(",")[0]}
                y1={rootPt.split(",")[1]}
                x2={odpPt.split(",")[0]}
                y2={odpPt.split(",")[1]}
                stroke="#52525b"
                strokeOpacity="0.7"
                strokeWidth="0.9"
              />
            </g>
          );
        })}

        {nodes.map((node) => {
          const isOlt = node.type === "olt";
          const r = isOlt ? 8.5 : 5.5;

          const p1 = toIso(node.x - r, node.y - r, node.z);
          const p2 = toIso(node.x + r, node.y - r, node.z);
          const p3 = toIso(node.x + r, node.y + r, node.z);
          const p4 = toIso(node.x - r, node.y + r, node.z);

          return (
            <g
              key={node.id}
              ref={(el) => {
                nodesRef.current[node.idx] = el;
              }}
              className="cursor-pointer"
              onMouseEnter={() => handleNodeHover(node.idx)}
              onMouseMove={() => handleNodeHover(node.idx)}
            >
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill="#121215"
                stroke={isOlt ? "#d4d4d8" : "#71717a"}
                strokeOpacity={isOlt ? "1" : "0.85"}
                strokeWidth={isOlt ? "1.1" : "0.85"}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              <circle
                cx={toIso(node.x, node.y, node.z).split(",")[0]}
                cy={toIso(node.x, node.y, node.z).split(",")[1]}
                r={isOlt ? 2.2 : 1.4}
                fill={isOlt ? "#ffffff" : "#a1a1aa"}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
