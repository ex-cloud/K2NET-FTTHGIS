"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { cn } from "../../utils";

export interface PebbleBotSvgProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
  interactive?: boolean;
  showHalo?: boolean;
  statusText?: string;
  onClick?: () => void;
}

export function PebbleBotSvg({
  className,
  size = "md",
  interactive = true,
  showHalo = true,
  onClick,
}: PebbleBotSvgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const visorRef = useRef<SVGGElement>(null);
  const earLeftRef = useRef<SVGGElement>(null);
  const earRightRef = useRef<SVGGElement>(null);
  const haloRef = useRef<SVGGElement>(null);

  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // GSAP Mouse Gaze Parallax Tracking
  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const nx = Math.max(-1, Math.min(1, (e.clientX - centerX) / (window.innerWidth / 2)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - centerY) / (window.innerHeight / 2)));

      if (headRef.current) {
        gsap.to(headRef.current, {
          x: nx * 10,
          y: ny * 7,
          duration: 0.5,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
      if (visorRef.current) {
        gsap.to(visorRef.current, {
          x: nx * 18,
          y: ny * 12,
          duration: 0.45,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
      if (earLeftRef.current) {
        gsap.to(earLeftRef.current, {
          x: -nx * 5,
          y: ny * 4,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
      if (earRightRef.current) {
        gsap.to(earRightRef.current, {
          x: nx * 5,
          y: -ny * 4,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    };

    const handleMouseLeave = () => {
      if (headRef.current) gsap.to(headRef.current, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.5)" });
      if (visorRef.current) gsap.to(visorRef.current, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.5)" });
      if (earLeftRef.current) gsap.to(earLeftRef.current, { x: 0, y: 0, duration: 0.8, ease: "power2.out" });
      if (earRightRef.current) gsap.to(earRightRef.current, { x: 0, y: 0, duration: 0.8, ease: "power2.out" });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [interactive]);

  // Periodic Natural Blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 4000);

    return () => clearInterval(blinkInterval);
  }, []);

  // GSAP Squash & Stretch Bounce on Click
  const handleClick = () => {
    if (headRef.current) {
      gsap.timeline()
        .to(headRef.current, { scaleX: 1.15, scaleY: 0.85, y: "+=8", duration: 0.12, ease: "power2.in" })
        .to(headRef.current, { scaleX: 0.92, scaleY: 1.08, y: "-=12", duration: 0.25, ease: "back.out(2)" })
        .to(headRef.current, { scaleX: 1, scaleY: 1, y: 0, duration: 0.35, ease: "elastic.out(1, 0.4)" });
    }
    onClick?.();
  };

  const sizeClasses = {
    sm: "w-28 h-28 max-w-[120px]",
    md: "w-48 h-48 max-w-[200px]",
    lg: "w-64 h-64 max-w-[280px]",
    full: "w-full h-full min-h-[220px]",
  }[size];

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex items-center justify-center select-none cursor-pointer group",
        sizeClasses,
        className
      )}
    >
      <svg
        viewBox="0 0 300 300"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Ceramic Body Lighting Gradient */}
          <radialGradient id="pebbleBodyLight" cx="38%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#f4f4f5" />
            <stop offset="70%" stopColor="#d4d4d8" />
            <stop offset="100%" stopColor="#71717a" />
          </radialGradient>

          {/* Dark Glass Visor Gradient */}
          <linearGradient id="pebbleVisorDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#18181b" />
            <stop offset="60%" stopColor="#09090b" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>

          {/* Visor Specular Glass Arc Shine */}
          <linearGradient id="pebbleGlassShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Ear Pod Gradient */}
          <radialGradient id="pebbleEarLight" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#e4e4e7" />
            <stop offset="85%" stopColor="#a1a1aa" />
            <stop offset="100%" stopColor="#52525b" />
          </radialGradient>

          {/* Ambient Ground Shadow */}
          <radialGradient id="pebbleShadowBlur" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#000000" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Ground Shadow */}
        <ellipse
          cx="150"
          cy="265"
          rx={65 + (isHovered ? 8 : 0)}
          ry={16 + (isHovered ? 2 : 0)}
          fill="url(#pebbleShadowBlur)"
          className="transition-all duration-300"
        />

        {/* Orbit Reticle Halo */}
        {showHalo && (
          <g ref={haloRef} className="transition-opacity duration-500">
            <ellipse
              cx="150"
              cy="150"
              rx="115"
              ry="45"
              stroke="#ffffff"
              strokeOpacity="0.18"
              strokeWidth="0.9"
              strokeDasharray="4 6"
              style={{
                transformOrigin: "150px 150px",
                transform: "rotate(-14deg)",
              }}
            />
            <circle cx="45" cy="125" r="2.5" className="fill-white animate-pulse" />
            <circle cx="255" cy="175" r="2.5" className="fill-white animate-pulse" />
          </g>
        )}

        {/* Floating Left Wireless Satellite Ear Pod */}
        <g ref={earLeftRef}>
          <ellipse
            cx="62"
            cy="148"
            rx="14"
            ry="24"
            fill="url(#pebbleEarLight)"
            stroke="#ffffff"
            strokeOpacity="0.4"
            strokeWidth="0.8"
            style={{
              transformOrigin: "62px 148px",
              transform: "rotate(-12deg)",
            }}
          />
          <circle cx="62" cy="148" r="3" fill="#18181b" />
          <circle cx="62" cy="148" r="1.2" fill="#38bdf8" />
        </g>

        {/* Floating Right Wireless Satellite Ear Pod */}
        <g ref={earRightRef}>
          <ellipse
            cx="238"
            cy="148"
            rx="14"
            ry="24"
            fill="url(#pebbleEarLight)"
            stroke="#ffffff"
            strokeOpacity="0.4"
            strokeWidth="0.8"
            style={{
              transformOrigin: "238px 148px",
              transform: "rotate(12deg)",
            }}
          />
          <circle cx="238" cy="148" r="3" fill="#18181b" />
          <circle cx="238" cy="148" r="1.2" fill="#38bdf8" />
        </g>

        {/* Main Volumetric Porcelain Ceramic Body */}
        <g ref={headRef} style={{ transformOrigin: "150px 150px" }}>
          <ellipse
            cx="150"
            cy="150"
            rx="72"
            ry="64"
            fill="url(#pebbleBodyLight)"
            stroke="#ffffff"
            strokeOpacity="0.7"
            strokeWidth="1"
            className="filter drop-shadow-md"
          />

          <ellipse
            cx="140"
            cy="102"
            rx="32"
            ry="10"
            fill="#ffffff"
            fillOpacity="0.65"
          />

          {/* Curved Glossy Visor & Expressive Digital Eyes */}
          <g ref={visorRef}>
            <ellipse
              cx="150"
              cy="152"
              rx="46"
              ry="32"
              fill="url(#pebbleVisorDark)"
              stroke="#27272a"
              strokeWidth="1.2"
            />

            <path
              d="M 112 142 Q 150 128 188 142 A 44 28 0 0 0 112 142 Z"
              fill="url(#pebbleGlassShine)"
            />

            <g className="transition-all duration-150">
              {isBlinking ? (
                <>
                  <line x1="128" y1="154" x2="142" y2="154" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="158" y1="154" x2="172" y2="154" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                </>
              ) : isHovered ? (
                <>
                  <path d="M 126 156 Q 135 146 144 156" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" className="filter drop-shadow-[0_0_4px_rgba(56,189,248,0.8)]" />
                  <path d="M 156 156 Q 165 146 174 156" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" className="filter drop-shadow-[0_0_4px_rgba(56,189,248,0.8)]" />
                </>
              ) : (
                <>
                  <ellipse cx="135" cy="153" rx="5" ry="7.5" fill="#38bdf8" className="filter drop-shadow-[0_0_5px_rgba(56,189,248,0.9)]" />
                  <circle cx="137" cy="151" r="1.8" fill="#ffffff" />
                  <ellipse cx="165" cy="153" rx="5" ry="7.5" fill="#38bdf8" className="filter drop-shadow-[0_0_5px_rgba(56,189,248,0.9)]" />
                  <circle cx="167" cy="151" r="1.8" fill="#ffffff" />
                </>
              )}
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

// Backwards-compatible aliases
export const PebbleBot3D = PebbleBotSvg;
export type PebbleBot3DProps = PebbleBotSvgProps;
