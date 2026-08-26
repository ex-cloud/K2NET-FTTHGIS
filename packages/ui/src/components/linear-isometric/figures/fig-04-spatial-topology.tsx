"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIso, type LinearFigureProps } from "../iso-utils";

export function LinearSpatialTopologyFigure({
  className,
  isHovered,
  size = "card",
  interactive = true,
}: LinearFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<(SVGGElement | null)[]>([]);
  const [localHover, setLocalHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : localHover;

  const nodes = [
    { id: "olt-root", x: 0, y: 0, z: 36, type: "olt" },
    { id: "odp-1", x: -42, y: -30, z: 18, type: "odp" },
    { id: "odp-2", x: 42,  y: -30, z: 18, type: "odp" },
    { id: "odp-3", x: -42, y: 30,  z: 18, type: "odp" },
    { id: "odp-4", x: 42,  y: 30,  z: 18, type: "odp" },
  ];

  // GSAP Node Elevation
  useEffect(() => {
    const valid = nodesRef.current.filter(Boolean);
    if (valid.length === 0) return;

    if (active) {
      gsap.to(valid, {
        y: (i) => (i === 0 ? -14 : -8),
        duration: 0.6,
        ease: "back.out(1.8)",
        stagger: 0.03,
        overwrite: "auto",
      });
    } else {
      gsap.to(valid, {
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.02,
        overwrite: "auto",
      });
    }
  }, [active]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 10;

    gsap.to(containerRef.current.querySelector("svg"), {
      x: nx,
      y: ny,
      duration: 0.4,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const handleMouseLeave = () => {
    setLocalHover(false);
    if (containerRef.current) {
      gsap.to(containerRef.current.querySelector("svg"), {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.5)",
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setLocalHover(true)}
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
          fill="#0a0a0a"
          stroke="#ffffff"
          strokeOpacity="0.3"
          strokeWidth="1"
        />

        <line x1={toIso(-70, 0, 0).split(",")[0]} y1={toIso(-70, 0, 0).split(",")[1]} x2={toIso(70, 0, 0).split(",")[0]} y2={toIso(70, 0, 0).split(",")[1]} stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1={toIso(0, -70, 0).split(",")[0]} y1={toIso(0, -70, 0).split(",")[1]} x2={toIso(0, 70, 0).split(",")[0]} y2={toIso(0, 70, 0).split(",")[1]} stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.8" strokeDasharray="3 3" />

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
                stroke="#ffffff"
                strokeOpacity="0.25"
                strokeWidth="0.9"
                strokeDasharray="2 3"
              />

              <line
                x1={rootPt.split(",")[0]}
                y1={rootPt.split(",")[1]}
                x2={odpPt.split(",")[0]}
                y2={odpPt.split(",")[1]}
                stroke="#ffffff"
                strokeOpacity={active ? "1" : "0.5"}
                strokeWidth={active ? "1.5" : "1"}
              />
            </g>
          );
        })}

        {nodes.map((n, idx) => {
          const sz = n.type === "olt" ? 14 : 9;
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
                fill="#121212"
                stroke="#ffffff"
                strokeOpacity={n.type === "olt" ? "1" : "0.7"}
                strokeWidth="1.2"
              />
              <circle
                cx={toIso(n.x, n.y, n.z).split(",")[0]}
                cy={toIso(n.x, n.y, n.z).split(",")[1]}
                r={n.type === "olt" ? "2.6" : "1.6"}
                className="fill-white"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
