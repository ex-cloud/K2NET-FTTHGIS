"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIso, type LinearFigureProps } from "../iso-utils";

export function LinearMicroserviceBusFigure({
  className,
  isHovered,
  size = "card",
  interactive = true,
}: LinearFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const busNodesRef = useRef<(SVGGElement | null)[]>([]);
  const [localHover, setLocalHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : localHover;

  const busNodes = [
    { name: "Kong Ingress", x: -60, y: 0, z: 0 },
    { name: "Spring Core",  x: -20, y: 0, z: 10 },
    { name: "Event Bus",    x: 20,  y: 0, z: 20 },
    { name: "Go Gateways",  x: 60,  y: 0, z: 0 },
  ];

  // GSAP Node Hop Relay
  useEffect(() => {
    const valid = busNodesRef.current.filter(Boolean);
    if (valid.length === 0) return;

    if (active) {
      gsap.to(valid, {
        y: (i) => (i === 2 ? -14 : i === 1 ? -8 : -4),
        duration: 0.6,
        ease: "back.out(1.8)",
        stagger: 0.04,
        overwrite: "auto",
      });
    } else {
      gsap.to(valid, {
        y: 0,
        duration: 0.45,
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
        <line
          x1={toIso(-75, 0, 0).split(",")[0]}
          y1={toIso(-75, 0, 0).split(",")[1]}
          x2={toIso(75, 0, 0).split(",")[0]}
          y2={toIso(75, 0, 0).split(",")[1]}
          stroke="#ffffff"
          strokeOpacity={active ? "0.9" : "0.4"}
          strokeWidth="1.5"
        />

        <line x1={toIso(-75, -20, 0).split(",")[0]} y1={toIso(-75, -20, 0).split(",")[1]} x2={toIso(75, -20, 0).split(",")[0]} y2={toIso(75, -20, 0).split(",")[1]} stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1={toIso(-75, 20, 0).split(",")[0]} y1={toIso(-75, 20, 0).split(",")[1]} x2={toIso(75, 20, 0).split(",")[0]} y2={toIso(75, 20, 0).split(",")[1]} stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.8" strokeDasharray="3 3" />

        {busNodes.map((n, i) => {
          const sz = 16;
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
                stroke="#ffffff"
                strokeOpacity="0.3"
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill="#121212"
                stroke="#ffffff"
                strokeOpacity={active ? "1" : "0.75"}
                strokeWidth="1.2"
              />

              <circle
                cx={topPt.split(",")[0]}
                cy={topPt.split(",")[1]}
                r="2"
                className="fill-white"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
