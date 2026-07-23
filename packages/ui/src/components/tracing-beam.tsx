"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "../utils";

export interface TracingBeamProps {
  children: React.ReactNode;
  className?: string;
}

export function TracingBeam({ children, className }: TracingBeamProps) {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [svgHeight, setSvgHeight] = useState(0);
  const [y1, setY1] = useState(50);
  const [y2, setY2] = useState(50);

  // Monitor height changes of children content dynamically
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSvgHeight(entry.contentRect.height);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frameId: number;
    let targetProgress = 0;
    let currentProgress = 0;

    const onScroll = () => {
      const container = ref.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Start tracking when container enters from bottom, end when container leaves top
      const startTrigger = rect.top - windowHeight;
      const totalTriggerHeight = rect.height + windowHeight;

      if (totalTriggerHeight <= 0) return;

      const progress = Math.max(0, Math.min(1, -startTrigger / totalTriggerHeight));
      targetProgress = progress;
    };

    const tick = () => {
      // Lerp transition logic for smooth tracking
      currentProgress = currentProgress + (targetProgress - currentProgress) * 0.08;

      // Map scroll progress to y1 and y2 coordinates
      const startOffset = 50;
      const endOffset = svgHeight - 100;

      const calculatedY1 = startOffset + currentProgress * (endOffset - startOffset);
      const calculatedY2 = startOffset + currentProgress * (endOffset - startOffset - 150);

      setY1(Math.max(startOffset, calculatedY1));
      setY2(Math.max(startOffset, calculatedY2));

      frameId = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    onScroll();
    frameId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [svgHeight]);

  return (
    <div ref={ref} className={cn("relative w-full max-w-4xl mx-auto h-full", className)}>
      <div className="absolute -left-4 md:-left-12 top-3 select-none pointer-events-none">
        <div className="ml-[9px] h-4 w-4 rounded-full border border-border bg-card shadow-xs flex items-center justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        </div>
        <svg
          viewBox={`0 0 20 ${svgHeight}`}
          width="20"
          height={svgHeight}
          className="ml-2 block"
          aria-hidden="true"
        >
          <path
            d={`M 10 0 V ${svgHeight}`}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1.25"
          />
          <path
            d={`M 10 0 V ${svgHeight}`}
            fill="none"
            stroke="url(#beam-gradient)"
            strokeWidth="1.5"
            className="motion-reduce:hidden"
          />
          <defs>
            <linearGradient
              id="beam-gradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2="0"
              y1={y1}
              y2={y2}
            >
              <stop stopColor="var(--primary)" stopOpacity="0" />
              <stop stopColor="var(--primary)" stopOpacity="0.8" />
              <stop stopColor="var(--ring)" stopOpacity="0.9" />
              <stop stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div ref={contentRef} className="w-full">
        {children}
      </div>
    </div>
  );
}
