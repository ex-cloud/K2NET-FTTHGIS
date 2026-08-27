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

  const cardCount = 14;
  // Render from back (0) to front (cardCount - 1) for proper isometric occlusion
  const cards = Array.from({ length: cardCount }, (_, i) => i);
  const originY = size === "hero" ? 175 : 165;
  const cardDepth = size === "hero" ? 52 : 44;
  const spacing = size === "hero" ? 9 : 8;

  // Directional Traveling Wave on Cursor Movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Normalized cursor along array: 0.0 (front-left) to 1.0 (back-right)
    const cursorProgress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    cards.forEach((i) => {
      const el = bladesRef.current[i];
      if (!el) return;

      // Card ratio from front (0.0) to back (1.0)
      const cardRatio = i / (cardCount - 1);
      // Distance from cursor to this specific slat
      const diff = Math.abs(cardRatio - cursorProgress);
      // Traveling Gaussian peak lift centered at cursor position
      const waveLift = Math.exp(-Math.pow(diff / 0.18, 2)) * 48;
      // Background slope accentuation when cursor is near the back
      const slopeAccent = Math.pow(cardRatio, 2) * (cursorProgress > 0.6 ? 24 : 8);

      gsap.to(el, {
        y: -(waveLift + slopeAccent),
        duration: 0.38,
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
        duration: 0.65,
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
        {/* Ambient Ground Shadow */}
        <ellipse
          cx="140"
          cy={originY + 30}
          rx="70"
          ry="28"
          className="fill-black/75 filter blur-[10px]"
        />

        {/* 14 Cascade Fin Slats rendered with subtle staircase in rest, wave on hover */}
        {cards.map((i) => {
          // Base resting height: low staircase (front is 6px, back is 30px)
          const ratio = i / (cardCount - 1);
          const baseHeight = 6 + Math.pow(ratio, 1.6) * 26;

          // Spatial position along isometric axis
          const xPos = (i - cardCount / 2) * spacing;
          const yPos = (i - cardCount / 2) * (spacing * 0.22);

          const ox = 140;
          const oy = originY;

          const p1 = toIso(xPos, yPos - cardDepth / 2, baseHeight, ox, oy);
          const p2 = toIso(xPos, yPos + cardDepth / 2, baseHeight, ox, oy);
          const b1 = toIso(xPos, yPos - cardDepth / 2, 0, ox, oy);
          const b2 = toIso(xPos, yPos + cardDepth / 2, 0, ox, oy);

          return (
            <g
              key={i}
              ref={(el) => {
                bladesRef.current[i] = el;
              }}
            >
              {/* Semi-transparent matte dark body so layered fins remain visible */}
              <polygon
                points={`${p1} ${p2} ${b2} ${b1}`}
                fill="#09090b"
                fillOpacity="0.85"
                stroke="#3f3f46"
                strokeOpacity="0.6"
                strokeWidth="0.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Leading Top Rim Zinc Ridge */}
              <line
                x1={p1.split(",")[0]}
                y1={p1.split(",")[1]}
                x2={p2.split(",")[0]}
                y2={p2.split(",")[1]}
                stroke={i === cardCount - 1 ? "#e4e4e7" : "#a1a1aa"}
                strokeOpacity="0.85"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
