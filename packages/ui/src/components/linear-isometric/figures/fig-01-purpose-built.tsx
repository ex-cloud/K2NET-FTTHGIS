"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIso, type LinearFigureProps } from "../iso-utils";

export function LinearPurposeBuiltFigure({
  className,
  isHovered,
  size = "card",
  interactive = true,
}: LinearFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slabsRef = useRef<(SVGGElement | null)[]>([]);
  const [localHover, setLocalHover] = useState(false);
  const active = isHovered !== undefined ? isHovered : localHover;

  // GSAP Smooth Stagger Extrusion
  useEffect(() => {
    const validSlabs = slabsRef.current.filter(Boolean);
    if (validSlabs.length === 0) return;

    if (active) {
      gsap.to(validSlabs, {
        y: (i) => -i * 6.5,
        duration: 0.65,
        ease: "back.out(1.8)",
        stagger: 0.03,
        overwrite: "auto",
      });
    } else {
      gsap.to(validSlabs, {
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.02,
        overwrite: "auto",
      });
    }
  }, [active]);

  // GSAP Parallax Tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 12;

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

  const layers = [0, 1, 2, 3, 4, 5];
  const slabSize = size === "hero" ? 58 : 50;
  const slabThickness = size === "hero" ? 9 : 7.5;
  const originY = size === "hero" ? 155 : 148;

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
        <defs>
          <radialGradient id="apertureWhiteGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.95" />
          </radialGradient>
        </defs>

        <ellipse
          cx="140"
          cy={originY + 45}
          rx="72"
          ry="34"
          className="fill-black/80 filter blur-[10px]"
        />

        {layers.map((idx) => {
          const zBase = idx * (slabThickness + 2);
          const zTop = zBase + slabThickness;
          const isTop = idx === layers.length - 1;

          const p1 = toIso(-slabSize, -slabSize, zTop, 140, originY);
          const p2 = toIso(slabSize, -slabSize, zTop, 140, originY);
          const p3 = toIso(slabSize, slabSize, zTop, 140, originY);
          const p4 = toIso(-slabSize, slabSize, zTop, 140, originY);

          const b2 = toIso(slabSize, -slabSize, zBase, 140, originY);
          const b3 = toIso(slabSize, slabSize, zBase, 140, originY);
          const b4 = toIso(-slabSize, slabSize, zBase, 140, originY);

          return (
            <g
              key={idx}
              ref={(el) => {
                slabsRef.current[idx] = el;
              }}
            >
              <polygon
                points={`${p4} ${p3} ${b3} ${b4}`}
                fill="#0a0a0a"
                stroke="#ffffff"
                strokeOpacity={active ? "0.6" : "0.35"}
                strokeWidth="0.9"
              />

              <polygon
                points={`${p3} ${p2} ${b2} ${b3}`}
                fill="#000000"
                stroke="#ffffff"
                strokeOpacity={active ? "0.45" : "0.22"}
                strokeWidth="0.9"
              />

              <polygon
                points={`${p1} ${p2} ${p3} ${p4}`}
                fill="#141414"
                stroke="#ffffff"
                strokeOpacity={isTop && active ? "1" : "0.75"}
                strokeWidth={isTop ? "1.2" : "0.9"}
              />

              <line
                x1={p4.split(",")[0]}
                y1={p4.split(",")[1]}
                x2={p3.split(",")[0]}
                y2={p3.split(",")[1]}
                stroke="#ffffff"
                strokeOpacity={active ? "1" : "0.85"}
                strokeWidth="1.1"
              />

              {isTop && (
                <g>
                  <ellipse
                    cx="140"
                    cy={originY - zTop * 0.5 + 24}
                    rx="30"
                    ry="17"
                    fill="url(#apertureWhiteGlow)"
                    stroke="#ffffff"
                    strokeOpacity={active ? "1" : "0.8"}
                    strokeWidth="1.2"
                  />
                  <line x1="118" y1={originY - zTop * 0.5 + 21} x2="162" y2={originY - zTop * 0.5 + 21} stroke="#ffffff" strokeOpacity={active ? "0.8" : "0.35"} strokeWidth="0.8" />
                  <line x1="114" y1={originY - zTop * 0.5 + 24} x2="166" y2={originY - zTop * 0.5 + 24} stroke="#ffffff" strokeOpacity={active ? "0.9" : "0.45"} strokeWidth="0.9" />
                  <line x1="120" y1={originY - zTop * 0.5 + 27} x2="160" y2={originY - zTop * 0.5 + 27} stroke="#ffffff" strokeOpacity={active ? "0.8" : "0.35"} strokeWidth="0.8" />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
