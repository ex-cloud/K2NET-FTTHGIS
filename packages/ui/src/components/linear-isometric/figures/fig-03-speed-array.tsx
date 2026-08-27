"use client";

import React, { useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { type LinearFigureProps } from "../iso-utils";

const COS30 = 0.8660254;
const SIN30 = 0.5;

function pt(x: number, y: number, z: number, ox: number, oy: number) {
  return {
    x: ox + (x - y) * COS30,
    y: oy + (x + y) * SIN30 - z,
  };
}

export function LinearSpeedArrayFigure({
  className,
  size = "card",
  interactive = true,
}: LinearFigureProps) {
  const cardCount = 14;
  const REST_HEIGHT = 6;
  const MAX_LIFT = size === "hero" ? 54 : 44;

  const originY = size === "hero" ? 160 : 150;
  const originX = 140;
  const slatWidth = 3.2;
  const slatLength = size === "hero" ? 56 : 48;
  const pitch = size === "hero" ? 6.2 : 5.4;

  // Track height of each slat [0..13]
  const [heights, setHeights] = useState<number[]>(() =>
    Array(cardCount).fill(REST_HEIGHT)
  );

  const animatedHeights = useRef<number[]>(Array(cardCount).fill(REST_HEIGHT));
  const rafId = useRef<number | null>(null);

  // Base ground points for each slat
  const slatBases = useRef(
    Array.from({ length: cardCount }, (_, i) => {
      const xi = (i - (cardCount - 1) / 2) * pitch;
      const p1 = pt(xi - slatWidth / 2, -slatLength / 2, 0, originX, originY);
      const p2 = pt(xi + slatWidth / 2, -slatLength / 2, 0, originX, originY);
      const p3 = pt(xi + slatWidth / 2, slatLength / 2, 0, originX, originY);
      const p4 = pt(xi - slatWidth / 2, slatLength / 2, 0, originX, originY);
      return { xi, p1, p2, p3, p4 };
    })
  );

  const updateHeights = useCallback(() => {
    setHeights([...animatedHeights.current]);
  }, []);

  const animateTo = useCallback((targets: number[], duration = 0.35) => {
    targets.forEach((target, i) => {
      gsap.to(animatedHeights.current, {
        [i]: target,
        duration,
        ease: "power2.out",
        overwrite: "auto",
        onUpdate: () => {
          if (rafId.current === null) {
            rafId.current = requestAnimationFrame(() => {
              updateHeights();
              rafId.current = null;
            });
          }
        },
      });
    });
  }, [updateHeights]);

  // Per-slat direct hover trigger
  const handleSlatHover = (hoveredIndex: number) => {
    if (!interactive) return;
    const targetHeights = Array.from({ length: cardCount }, (_, i) => {
      const dist = Math.abs(i - hoveredIndex);
      // Tight local wave: only the hovered slat and immediate neighbors rise
      const lift = Math.exp(-Math.pow(dist / 1.6, 2)) * MAX_LIFT;
      return REST_HEIGHT + lift;
    });

    animateTo(targetHeights, 0.28);
  };

  const handleMouseLeave = () => {
    animateTo(Array(cardCount).fill(REST_HEIGHT), 0.45);
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
        onMouseLeave={handleMouseLeave}
      >
        {/* Ambient Ground Shadow */}
        <ellipse
          cx="140"
          cy={originY + 22}
          rx="68"
          ry="24"
          className="fill-black/75 filter blur-[8px] pointer-events-none"
        />

        {/* 14 True 3D Isometric Extruded Slats with direct per-slat hover */}
        {slatBases.current.map((base, i) => {
          const H = heights[i] || REST_HEIGHT;
          const { p1, p2, p3, p4 } = base;

          // Top face vertices elevated by -H
          const tp1 = `${p1.x},${p1.y - H}`;
          const tp2 = `${p2.x},${p2.y - H}`;
          const tp3 = `${p3.x},${p3.y - H}`;
          const tp4 = `${p4.x},${p4.y - H}`;

          const isRaised = H > REST_HEIGHT + 2;

          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => handleSlatHover(i)}
              onMouseMove={() => handleSlatHover(i)}
            >
              {/* Left vertical side face */}
              <polygon
                points={`${tp4} ${tp3} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
                fill="#09090b"
                stroke="#3f3f46"
                strokeOpacity={isRaised ? "0.85" : "0.5"}
                strokeWidth="0.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Front-right vertical end cap */}
              <polygon
                points={`${tp3} ${tp2} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
                fill="#000000"
                stroke="#27272a"
                strokeOpacity={isRaised ? "0.65" : "0.4"}
                strokeWidth="0.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Top horizontal face */}
              <polygon
                points={`${tp1} ${tp2} ${tp3} ${tp4}`}
                fill={isRaised ? "#18181b" : "#121215"}
                stroke={isRaised ? "#d4d4d8" : "#71717a"}
                strokeOpacity={isRaised ? "1" : "0.75"}
                strokeWidth={isRaised ? "0.95" : "0.8"}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Leading Top Ridge Highlight */}
              <line
                x1={p4.x}
                y1={p4.y - H}
                x2={p3.x}
                y2={p3.y - H}
                stroke={isRaised ? "#ffffff" : "#a1a1aa"}
                strokeOpacity={isRaised ? "1" : "0.7"}
                strokeWidth={isRaised ? "1.2" : "0.85"}
                strokeLinecap="round"
              />

              {/* Invisible expanded hit area for buttery-smooth interaction */}
              <polygon
                points={`${p1.x},${p1.y - MAX_LIFT} ${p2.x},${p2.y - MAX_LIFT} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
                fill="transparent"
                stroke="transparent"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
