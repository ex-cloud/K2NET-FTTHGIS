"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIso, type LinearFigureProps } from "../iso-utils";

export function LinearVectorMatrixFigure({
  className,
  isHovered,
  size = "card",
  interactive = true,
}: LinearFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cubesRef = useRef<(SVGGElement | null)[]>([]);
  const [localHover, setLocalHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : localHover;

  const grid = [
    { x: -30, y: -30, z: 0, highlight: false },
    { x: 0,   y: -30, z: 0, highlight: true },
    { x: 30,  y: -30, z: 0, highlight: false },
    { x: -30, y: 0,   z: 0, highlight: false },
    { x: 0,   y: 0,   z: 12, highlight: true },
    { x: 30,  y: 0,   z: 0, highlight: false },
    { x: -30, y: 30,  z: 0, highlight: false },
    { x: 0,   y: 30,  z: 0, highlight: false },
    { x: 30,  y: 30,  z: 0, highlight: true },
  ];

  // GSAP Matrix Grid Ripple
  useEffect(() => {
    const valid = cubesRef.current.filter(Boolean);
    if (valid.length === 0) return;

    if (active) {
      gsap.to(valid, {
        y: (i) => (i === 4 ? -16 : (i % 2 === 0 ? -8 : -4)),
        duration: 0.55,
        ease: "back.out(2)",
        stagger: {
          grid: [3, 3],
          from: "center",
          amount: 0.2,
        },
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
        {grid.map((c, i) => {
          const sz = 10;
          const h = 14;
          const ox = 140;
          const oy = 145;

          const p1 = toIso(c.x - sz, c.y - sz, c.z + h, ox, oy);
          const p2 = toIso(c.x + sz, c.y - sz, c.z + h, ox, oy);
          const p3 = toIso(c.x + sz, c.y + sz, c.z + h, ox, oy);
          const p4 = toIso(c.x - sz, c.y + sz, c.z + h, ox, oy);

          const b2 = toIso(c.x + sz, c.y - sz, c.z, ox, oy);
          const b3 = toIso(c.x + sz, c.y + sz, c.z, ox, oy);
          const b4 = toIso(c.x - sz, c.y + sz, c.z, ox, oy);

          return (
            <g
              key={i}
              ref={(el) => {
                cubesRef.current[i] = el;
              }}
            >
              <polygon points={`${p4} ${p3} ${b3} ${b4}`} fill="#0a0a0a" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.8" />
              <polygon points={`${p3} ${p2} ${b2} ${b3}`} fill="#000000" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="0.8" />
              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill={c.highlight && active ? "#222222" : "#121212"}
                stroke="#ffffff"
                strokeOpacity={c.highlight && active ? "1" : "0.7"}
                strokeWidth="1.1"
              />
            </g>
          );
        })}

        {active && (
          <line
            x1="80"
            y1="70"
            x2="140"
            y2="120"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="animate-pulse"
          />
        )}
      </svg>
    </div>
  );
}
