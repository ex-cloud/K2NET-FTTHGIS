"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIso, type LinearFigureProps } from "../iso-utils";

export function LinearSpeedArrayFigure({
  className,
  isHovered,
  size = "card",
  interactive = true,
}: LinearFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bladesRef = useRef<(SVGGElement | null)[]>([]);
  const [localHover, setLocalHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : localHover;

  const cardCount = 12;
  const cards = Array.from({ length: cardCount }, (_, i) => i);
  const originY = size === "hero" ? 185 : 178;

  // GSAP Wave Propagation
  useEffect(() => {
    const valid = bladesRef.current.filter(Boolean);
    if (valid.length === 0) return;

    if (active) {
      gsap.to(valid, {
        y: (i) => Math.sin((i / cardCount) * Math.PI * 1.5) * 16,
        duration: 0.55,
        ease: "sine.out",
        stagger: {
          each: 0.02,
          from: "start",
        },
        overwrite: "auto",
      });
    } else {
      gsap.to(valid, {
        y: 0,
        duration: 0.45,
        ease: "power2.out",
        stagger: 0.015,
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
              <polygon
                points={`${p1} ${p2} ${b2} ${b1}`}
                fill="#080808"
                stroke="#ffffff"
                strokeOpacity={isLead ? "0.9" : "0.35"}
                strokeWidth={isLead ? "1.4" : "0.85"}
              />

              <line
                x1={p1.split(",")[0]}
                y1={p1.split(",")[1]}
                x2={p2.split(",")[0]}
                y2={p2.split(",")[1]}
                stroke="#ffffff"
                strokeOpacity={isLead ? "1" : active ? "0.9" : "0.6"}
                strokeWidth={isLead ? "1.8" : "1"}
              />
            </g>
          );
        })}

        {active && (
          <line
            x1="70"
            y1="175"
            x2="225"
            y2="75"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeDasharray="6 8"
            className="animate-pulse"
          />
        )}
      </svg>
    </div>
  );
}
