"use client";

import React, { useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { toIsoPt, isoRoundedRectPath, type LinearFigureProps } from "../iso-utils";

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
  const slatWidth = 3.4;
  const slatLength = size === "hero" ? 56 : 48;
  const pitch = size === "hero" ? 6.2 : 5.4;
  const cornerRadius = 1.2;

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
      const x1 = xi - slatWidth / 2;
      const x2 = xi + slatWidth / 2;
      const y1 = -slatLength / 2;
      const y2 = slatLength / 2;
      const r = cornerRadius;

      return { xi, x1, x2, y1, y2, r };
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

        {/* 14 True 3D Isometric Extruded Slats with Rounded Fillets */}
        {slatBases.current.map((base, i) => {
          const H = heights[i] || REST_HEIGHT;
          const { xi, x1, x2, y1, y2, r } = base;

          const topPath = isoRoundedRectPath(xi, 0, slatWidth, slatLength, H, r, originX, originY);

          // Side wall and end-cap contours
          const p6Top = toIsoPt(x1 + r, y2, H, originX, originY);
          const p5Top = toIsoPt(x2 - r, y2, H, originX, originY);
          const c3Top = toIsoPt(x2, y2, H, originX, originY);
          const p4Top = toIsoPt(x2, y2 - r, H, originX, originY);
          const p3Top = toIsoPt(x2, y1 + r, H, originX, originY);
          const c4Top = toIsoPt(x1, y2, H, originX, originY);
          const p7Top = toIsoPt(x1, y2 - r, H, originX, originY);

          const p6Base = toIsoPt(x1 + r, y2, 0, originX, originY);
          const p5Base = toIsoPt(x2 - r, y2, 0, originX, originY);
          const c3Base = toIsoPt(x2, y2, 0, originX, originY);
          const p4Base = toIsoPt(x2, y2 - r, 0, originX, originY);
          const p3Base = toIsoPt(x2, y1 + r, 0, originX, originY);
          const c4Base = toIsoPt(x1, y2, 0, originX, originY);
          const p7Base = toIsoPt(x1, y2 - r, 0, originX, originY);

          const isRaised = H > REST_HEIGHT + 2;

          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => handleSlatHover(i)}
              onMouseMove={() => handleSlatHover(i)}
            >
              {/* Left vertical side face with rounded corner end */}
              <path
                d={`
                  M ${p7Top.x.toFixed(1)} ${p7Top.y.toFixed(1)}
                  Q ${c4Top.x.toFixed(1)} ${c4Top.y.toFixed(1)} ${p6Top.x.toFixed(1)} ${p6Top.y.toFixed(1)}
                  L ${p5Top.x.toFixed(1)} ${p5Top.y.toFixed(1)}
                  L ${p5Base.x.toFixed(1)} ${p5Base.y.toFixed(1)}
                  L ${p6Base.x.toFixed(1)} ${p6Base.y.toFixed(1)}
                  Q ${c4Base.x.toFixed(1)} ${c4Base.y.toFixed(1)} ${p7Base.x.toFixed(1)} ${p7Base.y.toFixed(1)}
                  Z
                `}
                fill="#09090b"
                stroke="#3f3f46"
                strokeOpacity={isRaised ? "0.85" : "0.5"}
                strokeWidth="0.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Front-right vertical end cap with rounded fillet */}
              <path
                d={`
                  M ${p5Top.x.toFixed(1)} ${p5Top.y.toFixed(1)}
                  Q ${c3Top.x.toFixed(1)} ${c3Top.y.toFixed(1)} ${p4Top.x.toFixed(1)} ${p4Top.y.toFixed(1)}
                  L ${p3Top.x.toFixed(1)} ${p3Top.y.toFixed(1)}
                  L ${p3Base.x.toFixed(1)} ${p3Base.y.toFixed(1)}
                  L ${p4Base.x.toFixed(1)} ${p4Base.y.toFixed(1)}
                  Q ${c3Base.x.toFixed(1)} ${c3Base.y.toFixed(1)} ${p5Base.x.toFixed(1)} ${p5Base.y.toFixed(1)}
                  Z
                `}
                fill="#000000"
                stroke="#27272a"
                strokeOpacity={isRaised ? "0.65" : "0.4"}
                strokeWidth="0.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Top horizontal face with rounded corners */}
              <path
                d={topPath}
                fill={isRaised ? "#18181b" : "#121215"}
                stroke={isRaised ? "#d4d4d8" : "#71717a"}
                strokeOpacity={isRaised ? "1" : "0.75"}
                strokeWidth={isRaised ? "0.95" : "0.8"}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Leading Top Ridge Highlight */}
              <path
                d={`
                  M ${p7Top.x.toFixed(1)} ${p7Top.y.toFixed(1)}
                  Q ${c4Top.x.toFixed(1)} ${c4Top.y.toFixed(1)} ${p6Top.x.toFixed(1)} ${p6Top.y.toFixed(1)}
                  L ${p5Top.x.toFixed(1)} ${p5Top.y.toFixed(1)}
                  Q ${c3Top.x.toFixed(1)} ${c3Top.y.toFixed(1)} ${p4Top.x.toFixed(1)} ${p4Top.y.toFixed(1)}
                `}
                stroke={isRaised ? "#ffffff" : "#a1a1aa"}
                strokeOpacity={isRaised ? "1" : "0.7"}
                strokeWidth={isRaised ? "1.2" : "0.85"}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Expanded hit area for smooth hover */}
              <polygon
                points={`
                  ${toIsoPt(x1, y1, H + 12, originX, originY).x},${toIsoPt(x1, y1, H + 12, originX, originY).y}
                  ${toIsoPt(x2, y1, H + 12, originX, originY).x},${toIsoPt(x2, y1, H + 12, originX, originY).y}
                  ${toIsoPt(x2, y2, 0, originX, originY).x},${toIsoPt(x2, y2, 0, originX, originY).y}
                  ${toIsoPt(x1, y2, 0, originX, originY).x},${toIsoPt(x1, y2, 0, originX, originY).y}
                `}
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
