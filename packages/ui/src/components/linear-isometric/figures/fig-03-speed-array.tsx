"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIso, type LinearFigureProps } from "../iso-utils";

export function LinearSpeedArrayFigure({
  className,
  size = "card",
  interactive = true,
}: LinearFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bladesRef = useRef<(SVGGElement | null)[]>([]);

  const cardCount = 12;
  const cards = Array.from({ length: cardCount }, (_, i) => i);
  const originY = size === "hero" ? 185 : 178;

  // Directional Cursor Wave Tracking along Array
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Normalized cursor along array: 0.0 (left) to 1.0 (right)
    const cursorProgress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    cards.forEach((i) => {
      const el = bladesRef.current[i];
      if (!el) return;

      const cardRatio = i / (cardCount - 1);
      // Distance from cursor to this card
      const diff = Math.abs(cardRatio - cursorProgress);
      // Gaussian peak at cursor position
      const waveLift = Math.exp(-Math.pow(diff / 0.22, 2)) * 24;
      // Progressive slope lift
      const slopeLift = Math.pow(cardRatio, 1.8) * 12;

      gsap.to(el, {
        y: -(waveLift + slopeLift * 0.4),
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  };

  const handleMouseLeave = () => {
    cards.forEach((i) => {
      const el = bladesRef.current[i];
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
        {cards.map((i) => {
          const baseHeight = 16 + Math.pow(i / (cardCount - 1), 1.85) * 85;
          const cardDepth = size === "hero" ? 48 : 42;
          const spacing = size === "hero" ? 10.5 : 9.5;
          const xPos = (i - cardCount / 2) * spacing;
          const yPos = (i - cardCount / 2) * (spacing * 0.2);

          const ox = 140;
          const oy = originY;

          const p1 = toIso(xPos, yPos - cardDepth / 2, baseHeight, ox, oy);
          const p2 = toIso(xPos, yPos + cardDepth / 2, baseHeight, ox, oy);
          const b1 = toIso(xPos, yPos - cardDepth / 2, 0, ox, oy);
          const b2 = toIso(xPos, yPos + cardDepth / 2, 0, ox, oy);

          const isLead = i === cardCount - 1;

          return (
            <g
              key={i}
              ref={(el) => {
                bladesRef.current[i] = el;
              }}
            >
              {/* Solid Matte Card Body */}
              <polygon
                points={`${p1} ${p2} ${b2} ${b1}`}
                fill={isLead ? "#0c0c0e" : "#09090b"}
                stroke={isLead ? "#a1a1aa" : "#3f3f46"}
                strokeOpacity={isLead ? "0.9" : "0.5"}
                strokeWidth={isLead ? "1.1" : "0.8"}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Leading Top Rim Zinc Bevel */}
              <line
                x1={p1.split(",")[0]}
                y1={p1.split(",")[1]}
                x2={p2.split(",")[0]}
                y2={p2.split(",")[1]}
                stroke={isLead ? "#e4e4e7" : "#a1a1aa"}
                strokeOpacity={isLead ? "1" : "0.75"}
                strokeWidth={isLead ? "1.3" : "0.85"}
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
