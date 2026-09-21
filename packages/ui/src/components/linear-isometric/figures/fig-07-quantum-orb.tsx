"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import { cn } from "../../../utils";
import { type LinearFigureProps } from "../iso-utils";

export interface QuantumOrbFigureProps extends LinearFigureProps {
  glowColor?: string;
  coreColor?: string;
  speed?: number;
  noiseIntensity?: number;
}

/**
 * FIG 0.7: Bioluminescent Quantum Fluid Energy Orb
 * 
 * Exact 1:1 match with enterprise 3D reference visual (Gambar 2):
 * - Expansive, wide orbital halo rings with generous breathing room
 * - Ethereal volumetric plasma fluid caustics (no harsh white specular hotspot)
 * - Luminous chartreuse-lime Fresnel rim highlight (#bef264 - #d9f99d)
 * - Deep obsidian-emerald void interior (#020503 to #07150c)
 * - Organic multi-octave undulating fluid folds cascading across the interior dome
 * - Subtle bioluminescent particle dust along inner cavity
 */
export function LinearQuantumOrbFigure({
  className,
  size = "card",
  interactive = true,
  speed = 1.0,
}: QuantumOrbFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbWrapperRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<SVGGElement>(null);

  const [isExcited, setIsExcited] = useState(false);
  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Dimensions: Generous spacing between orb and outer HUD rings
  const isHero = size === "hero";
  const canvasDimension = isHero ? 340 : 240;
  const orbRadius = isHero ? 86 : 60; // Clean, elegant sphere size allowing expansive orbital rings

  // Generate subtle, widely-spaced radar ticks along the far outer ring
  const hudTicks = React.useMemo(() => {
    const ticks: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const cx = 170;
    const cy = 170;
    const r = isHero ? 146 : 104;
    const count = 36;
    for (let i = 0; i < count; i++) {
      if (i % 6 === 0) continue; // spacious gaps
      const angle = (i / count) * Math.PI * 2;
      const x1 = cx + Math.cos(angle) * (r - 3);
      const y1 = cy + Math.sin(angle) * (r - 3);
      const x2 = cx + Math.cos(angle) * (r + 3);
      const y2 = cy + Math.sin(angle) * (r + 3);
      ticks.push({ x1, y1, x2, y2 });
    }
    return ticks;
  }, [isHero]);

  // Handle interactive mouse movements with smooth dampening
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const nx = (e.clientX - centerX) / (rect.width / 2);
    const ny = (e.clientY - centerY) / (rect.height / 2);

    mousePosRef.current.targetX = Math.max(-1.2, Math.min(1.2, nx));
    mousePosRef.current.targetY = Math.max(-1.2, Math.min(1.2, ny));

    // GSAP parallax on orb container
    if (orbWrapperRef.current) {
      gsap.to(orbWrapperRef.current, {
        x: nx * 12,
        y: ny * 8,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    if (ringsRef.current) {
      gsap.to(ringsRef.current, {
        x: nx * -6,
        y: ny * -4,
        duration: 0.6,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  }, [interactive]);

  const handleMouseLeave = useCallback(() => {
    mousePosRef.current.targetX = 0;
    mousePosRef.current.targetY = 0;

    if (orbWrapperRef.current) {
      gsap.to(orbWrapperRef.current, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.5)",
        overwrite: "auto",
      });
    }

    if (ringsRef.current) {
      gsap.to(ringsRef.current, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  }, []);

  const handleClick = useCallback(() => {
    setIsExcited(true);
    setTimeout(() => setIsExcited(false), 900);

    if (orbWrapperRef.current) {
      gsap.fromTo(
        orbWrapperRef.current,
        { scale: 0.95 },
        { scale: 1, duration: 0.7, ease: "elastic.out(1.2, 0.4)" }
      );
    }
  }, []);

  // ─── High-Fidelity Rendering Engine (Gambar 2 Reference Visual) ──────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isRunning = true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Seeded shimmer particles along inner cavity
    const particles = Array.from({ length: 32 }, (_, i) => {
      const angle = (Math.PI * 0.1) + (i / 32) * (Math.PI * 0.8);
      return {
        angle,
        radOffset: (Math.random() - 0.5) * 10,
        size: 0.5 + Math.random() * 1.1,
        speed: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.25 + Math.random() * 0.5,
      };
    });

    const render = () => {
      if (!isRunning) return;

      mousePosRef.current.x += (mousePosRef.current.targetX - mousePosRef.current.x) * 0.08;
      mousePosRef.current.y += (mousePosRef.current.targetY - mousePosRef.current.y) * 0.08;

      const elapsed = (Date.now() - startTimeRef.current) * 0.001 * speed;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const mx = mousePosRef.current.x * 10;
      const my = mousePosRef.current.y * 8;

      ctx.clearRect(0, 0, w, h);

      // ── 1. Soft Ethereal Atmospheric Corona Glow (Diffuse & Natural) ──
      const corona = ctx.createRadialGradient(
        cx + mx * 0.2,
        cy + my * 0.2,
        orbRadius * 0.75,
        cx,
        cy,
        orbRadius * 1.55
      );
      corona.addColorStop(0, "rgba(163, 230, 53, 0.22)");
      corona.addColorStop(0.35, "rgba(74, 222, 128, 0.10)");
      corona.addColorStop(0.7, "rgba(20, 83, 45, 0.03)");
      corona.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius * 1.55, 0, Math.PI * 2);
      ctx.fill();

      // ── 2. Base Sphere Fill (Deep Obsidian Green Abyss) ──
      const bodyGrad = ctx.createRadialGradient(
        cx - orbRadius * 0.2 + mx * 0.5,
        cy - orbRadius * 0.2 + my * 0.5,
        orbRadius * 0.05,
        cx,
        cy,
        orbRadius
      );
      bodyGrad.addColorStop(0, "#061309");
      bodyGrad.addColorStop(0.5, "#020704");
      bodyGrad.addColorStop(0.85, "#010402");
      bodyGrad.addColorStop(0.96, "#0a2211");
      bodyGrad.addColorStop(1, "#154722");

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      // ── 3. Clip to Sphere Interior for Fluid Caustics & Waves ──
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
      ctx.clip();

      // ── 3a. Deep Volumetric Fluid Ambient Glow (Gambar 2) ──
      const deepGlow = ctx.createRadialGradient(
        cx + mx * 0.4,
        cy - orbRadius * 0.1 + my * 0.4,
        orbRadius * 0.1,
        cx,
        cy,
        orbRadius * 0.95
      );
      deepGlow.addColorStop(0, "rgba(101, 163, 13, 0.25)");
      deepGlow.addColorStop(0.4, "rgba(22, 101, 52, 0.15)");
      deepGlow.addColorStop(0.8, "rgba(5, 30, 14, 0.06)");
      deepGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = deepGlow;
      ctx.fillRect(0, 0, w, h);

      // ── 3b. Multi-Octave Organic Fluid Plasma Wave 1 (Deep Layer) ──
      ctx.beginPath();
      const waveY1 = cy - orbRadius * 0.2 + my * 0.35;
      ctx.moveTo(cx - orbRadius, cy);
      for (let x = -orbRadius; x <= orbRadius; x += 2) {
        const normX = x / orbRadius;
        const curve = Math.sqrt(Math.max(0, 1 - normX * normX));
        const wave = Math.sin(normX * 4.2 + elapsed * 1.4) * (orbRadius * 0.11)
                   + Math.cos(normX * 7.8 - elapsed * 1.8) * (orbRadius * 0.055)
                   + Math.sin(normX * 11.5 + elapsed * 2.6) * (orbRadius * 0.025);
        const y = waveY1 + wave * curve;
        ctx.lineTo(cx + x, y);
      }
      ctx.lineTo(cx + orbRadius, cy + orbRadius);
      ctx.lineTo(cx - orbRadius, cy + orbRadius);
      ctx.closePath();

      const waveGrad1 = ctx.createLinearGradient(cx, waveY1 - orbRadius * 0.25, cx, cy + orbRadius * 0.6);
      waveGrad1.addColorStop(0, "rgba(132, 204, 22, 0.35)");
      waveGrad1.addColorStop(0.3, "rgba(74, 222, 128, 0.20)");
      waveGrad1.addColorStop(0.7, "rgba(20, 83, 45, 0.08)");
      waveGrad1.addColorStop(1, "rgba(1, 5, 2, 0.7)");
      ctx.fillStyle = waveGrad1;
      ctx.fill();

      // Wave 1 Crest Glow
      ctx.strokeStyle = "rgba(163, 230, 53, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // ── 3c. Multi-Octave Organic Fluid Wave 2 (Main Luminous Folds - Gambar 2) ──
      ctx.beginPath();
      const waveY2 = cy - orbRadius * 0.08 + my * 0.55;
      ctx.moveTo(cx - orbRadius, cy);
      for (let x = -orbRadius; x <= orbRadius; x += 2) {
        const normX = x / orbRadius;
        const curve = Math.sqrt(Math.max(0, 1 - normX * normX));
        const wave = Math.sin(normX * 4.8 - elapsed * 1.6 + 1.0) * (orbRadius * 0.13)
                   + Math.cos(normX * 8.6 + elapsed * 2.1) * (orbRadius * 0.065)
                   + Math.sin(normX * 13.0 - elapsed * 3.1) * (orbRadius * 0.03);
        const y = waveY2 + wave * curve;
        ctx.lineTo(cx + x, y);
      }
      ctx.lineTo(cx + orbRadius, cy + orbRadius);
      ctx.lineTo(cx - orbRadius, cy + orbRadius);
      ctx.closePath();

      const waveGrad2 = ctx.createLinearGradient(cx, waveY2 - orbRadius * 0.2, cx, cy + orbRadius * 0.75);
      waveGrad2.addColorStop(0, "rgba(190, 242, 100, 0.48)");
      waveGrad2.addColorStop(0.25, "rgba(134, 239, 172, 0.28)");
      waveGrad2.addColorStop(0.6, "rgba(21, 128, 61, 0.12)");
      waveGrad2.addColorStop(1, "rgba(2, 6, 3, 0.88)");
      ctx.fillStyle = waveGrad2;
      ctx.fill();

      // Wave 2 Soft Luminous Ridge
      ctx.strokeStyle = "rgba(217, 249, 157, 0.80)";
      ctx.lineWidth = 1.4;
      ctx.shadowColor = "#84cc16";
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── 3d. Bioluminescent Micro-Particles Shimmer ──
      particles.forEach((p) => {
        const currentAngle = p.angle + Math.sin(elapsed * p.speed + p.phase) * 0.08;
        const r = orbRadius * 0.86 + p.radOffset;
        const px = cx + Math.cos(currentAngle) * r;
        const py = cy + Math.sin(currentAngle) * r;
        const pulse = 0.5 + 0.5 * Math.sin(elapsed * 2.5 + p.phase);
        const alpha = p.alpha * pulse;

        ctx.fillStyle = `rgba(190, 242, 100, ${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── 3e. Smooth Fresnel Volumetric Edge Glow (Gambar 2 - No harsh white blob!) ──
      const fresnel = ctx.createRadialGradient(
        cx,
        cy,
        orbRadius * 0.70,
        cx,
        cy,
        orbRadius
      );
      fresnel.addColorStop(0, "rgba(0, 0, 0, 0)");
      fresnel.addColorStop(0.60, "rgba(34, 197, 94, 0.06)");
      fresnel.addColorStop(0.84, "rgba(132, 204, 22, 0.35)");
      fresnel.addColorStop(0.95, "rgba(190, 242, 100, 0.75)");
      fresnel.addColorStop(1, "rgba(236, 252, 203, 0.92)");

      ctx.fillStyle = fresnel;
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // end clip

      // ── 4. Luminous Outer Rim Perimeter ──
      ctx.save();
      ctx.strokeStyle = "rgba(217, 249, 157, 0.88)";
      ctx.lineWidth = 1.25;
      ctx.shadowColor = "#84cc16";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [orbRadius, isExcited, speed]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full flex items-center justify-center select-none overflow-hidden cursor-pointer group",
        isHero ? "h-[320px] max-w-[440px] bg-transparent border-0" : "h-[240px] rounded-2xl bg-gradient-to-b from-[#060e09]/90 via-[#030604]/95 to-card border border-border/60 shadow-sm",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="3D Quantum Fluid Energy Orb"
    >
      {/* ── Radial Emerald Illumination on Card Preview ── */}
      {!isHero && (
        <>
          <div 
            className="absolute inset-0 pointer-events-none opacity-80"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.18) 0%, rgba(16, 185, 129, 0.06) 35%, rgba(4, 8, 5, 0.95) 70%, transparent 100%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.25] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(74, 222, 128, 0.6) 1.1px, transparent 1.1px)",
              backgroundSize: "16px 16px",
              maskImage: "radial-gradient(circle at center, black 30%, transparent 85%)",
              WebkitMaskImage: "radial-gradient(circle at center, black 30%, transparent 85%)",
            }}
          />
        </>
      )}

      {/* ── Background Expansive Orbital Rings & Subtle Radar Reticle (Gambar 2 Style) ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10"
        viewBox="0 0 340 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="fig07-ringFade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bef264" stopOpacity="0.30" />
            <stop offset="50%" stopColor="#4ade80" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#bef264" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        <g ref={ringsRef} className="transition-transform duration-700 ease-out">
          {/* Main Expansive Rotating Orbital Rings HUD (Wide & uncluttered) */}
          <g
            className="animate-hud-spin"
            style={{
              transformOrigin: "170px 170px",
            }}
          >
            {/* Far Outer Ring 1 (Delicate segmented orbit) */}
            <circle
              cx="170"
              cy="170"
              r={isHero ? 156 : 112}
              stroke="url(#fig07-ringFade)"
              strokeWidth="0.75"
              strokeDasharray="2 8"
            />
            {/* Primary Outer Ring 2 (Continuous fine hairline orbit) */}
            <circle
              cx="170"
              cy="170"
              r={isHero ? 144 : 102}
              stroke="url(#fig07-ringFade)"
              strokeWidth="0.8"
            />
            {/* Subtle Outer Radar Ticks along r=144 */}
            {hudTicks.map((t, idx) => (
              <line
                key={idx}
                x1={t.x1.toFixed(2)}
                y1={t.y1.toFixed(2)}
                x2={t.x2.toFixed(2)}
                y2={t.y2.toFixed(2)}
                stroke="#bef264"
                strokeOpacity="0.25"
                strokeWidth="0.8"
              />
            ))}
          </g>

          {/* Counter-rotating subtle compass reticle far out */}
          <g
            className="animate-hud-spin-reverse"
            style={{
              transformOrigin: "170px 170px",
            }}
          >
            {/* Fine Reticle Crosshairs at perimeter */}
            <line
              x1="170"
              y1={isHero ? 10 : 56}
              x2="170"
              y2={isHero ? 22 : 66}
              stroke="#bef264"
              strokeOpacity="0.4"
              strokeWidth="1"
            />
            <line
              x1="170"
              y1={isHero ? 318 : 274}
              x2="170"
              y2={isHero ? 330 : 284}
              stroke="#bef264"
              strokeOpacity="0.4"
              strokeWidth="1"
            />
            <line
              x1={isHero ? 10 : 56}
              y1="170"
              x2={isHero ? 22 : 66}
              y2="170"
              stroke="#bef264"
              strokeOpacity="0.4"
              strokeWidth="1"
            />
            <line
              x1={isHero ? 318 : 274}
              y1="170"
              x2={isHero ? 330 : 284}
              y2="170"
              stroke="#bef264"
              strokeOpacity="0.4"
              strokeWidth="1"
            />
          </g>
        </g>
      </svg>

      {/* ── Center Levitating 3D Quantum Orb ── */}
      <div
        ref={orbWrapperRef}
        className="relative flex items-center justify-center pointer-events-none transition-transform duration-300 z-20"
      >
        {/* Deep ambient drop shadow under the orb */}
        <div
          className="absolute -bottom-6 w-3/4 h-8 bg-black/90 rounded-full blur-xl pointer-events-none transform scale-y-50"
        />

        {/* High-fidelity Canvas Renderer */}
        <canvas
          ref={canvasRef}
          width={canvasDimension}
          height={canvasDimension}
          className="w-full h-full max-w-[340px] max-h-[340px] object-contain drop-shadow-[0_0_28px_rgba(74,222,128,0.3)]"
        />
      </div>
    </div>
  );
}
