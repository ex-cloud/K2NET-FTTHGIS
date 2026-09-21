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
 * High-performance 3D procedural fluid raymarching & organic plasma sphere with:
 * - Obsidian fluid interior with real-time simplex/perlin surface waves
 * - Luminous emerald green Fresnel rim & corona glow
 * - Parallax mouse gaze & interactive dynamic lighting angle
 * - Background ambient concentric orbital energy pulse rings
 * - Click shockwave excitation
 * - Dual-layer WebGL 2.0 / Procedural Canvas 2D engine for 100% universal browser compatibility
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

  // Dimensions
  const isHero = size === "hero";
  const canvasDimension = isHero ? 320 : 240;
  const orbRadius = isHero ? 96 : 68;

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
        x: nx * 14,
        y: ny * 10,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    if (ringsRef.current) {
      gsap.to(ringsRef.current, {
        x: nx * -8,
        y: ny * -6,
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
        { scale: 0.92 },
        { scale: 1, duration: 0.7, ease: "elastic.out(1.2, 0.4)" }
      );
    }
  }, []);

  // ─── 3D Procedural Raymarching Shader Engine ────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

    let isWebGLRunning = false;
    let cleanupWebGL: (() => void) | null = null;

    if (gl) {
      // ── GLSL Shaders ──
      const vsSource = `
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
          vUv = position * 0.5 + 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;

      const fsSource = `
        precision highp float;
        varying vec2 vUv;
        uniform vec2 uResolution;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uExcited;
        uniform float uRadius;

        // 3D Simplex noise functions
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);

          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);

          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;

          i = mod289(i);
          vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));

          float n_ = 0.142857142857;
          vec3  ns = n_ * D.wyz - D.xzx;

          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);

          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);

          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);

          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));

          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);

          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;

          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
          float dist = length(uv);
          float r = uRadius / min(uResolution.x, uResolution.y);

          if (dist > r * 1.5) {
            discard;
          }

          // 3D Sphere Normal Calculation
          float z2 = r * r - dist * dist;
          vec3 normal = vec3(0.0);
          float isInside = 0.0;

          if (z2 > 0.0) {
            isInside = 1.0;
            normal = normalize(vec3(uv.x, uv.y, sqrt(z2)));
          }

          // Dynamic light vector influenced by mouse
          vec3 lightDir = normalize(vec3(-0.45 + uMouse.x * 0.4, 0.55 - uMouse.y * 0.4, 0.9));
          vec3 viewDir = vec3(0.0, 0.0, 1.0);

          // Animated fluid wave distortion
          float t = uTime * 0.7;
          float noise = snoise(vec3(normal.xy * 2.8 + vec2(t * 0.3, t * 0.2), normal.z * 1.8 + t * 0.4));
          float noiseFine = snoise(vec3(normal.xy * 6.5 - vec2(t * 0.5, t * 0.3), normal.z * 4.0 + t * 0.6));
          float fluidWave = noise * 0.6 + noiseFine * 0.4;

          // Rim / Fresnel glow calculation
          float fresnel = 0.0;
          if (isInside > 0.5) {
            fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
            fresnel = pow(fresnel, 2.2 + fluidWave * 0.8);
          }

          // Emerald Palette
          vec3 emeraldCore = vec3(0.02, 0.04, 0.03); // Deep obsidian
          vec3 emeraldMid  = vec3(0.08, 0.42, 0.18); // Bioluminescent green
          vec3 emeraldRim  = vec3(0.28, 0.96, 0.48); // Neon electric emerald
          vec3 emeraldHighlight = vec3(0.72, 1.0, 0.82); // Specular white-emerald

          // Internal fluid currents & caustics
          float internalCurrent = snoise(vec3(uv * 4.2 + vec2(t * 0.4, -t * 0.3), t * 0.5)) * 0.5 + 0.5;
          vec3 fluidColor = mix(emeraldCore, emeraldMid, internalCurrent * 0.55);

          // Surface Specular Highlight
          vec3 halfVector = normalize(lightDir + viewDir);
          float specular = 0.0;
          if (isInside > 0.5) {
            specular = pow(max(dot(normal, halfVector), 0.0), 38.0 + fluidWave * 12.0);
          }

          // Composite Inner Sphere Color
          vec3 color = fluidColor;
          color += emeraldRim * fresnel * (1.35 + (uExcited * 0.6));
          color += emeraldHighlight * specular * 0.85;

          // Outer Corona Atmosphere Glow (Soft Bloom outside sphere edge)
          float corona = 0.0;
          if (dist >= r) {
            float edgeDist = (dist - r) / (r * 0.45);
            corona = exp(-edgeDist * 4.5) * (0.85 + sin(uTime * 2.0) * 0.12);
            color = emeraldRim * corona * 0.9;
          }

          // Soft Alpha Anti-aliasing at outermost boundary
          float alpha = 1.0;
          if (dist > r * 1.35) {
            alpha = smoothstep(r * 1.45, r * 1.35, dist);
          }

          gl_FragColor = vec4(color, alpha);
        }
      `;

      const createShader = (type: number, src: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = createShader(gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl.FRAGMENT_SHADER, fsSource);

      if (vs && fs) {
        const program = gl.createProgram();
        if (program) {
          gl.attachShader(program, vs);
          gl.attachShader(program, fs);
          gl.linkProgram(program);

          if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);

            const posBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
            gl.bufferData(
              gl.ARRAY_BUFFER,
              new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
              gl.STATIC_DRAW
            );

            const posLoc = gl.getAttribLocation(program, "position");
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

            const uResLoc = gl.getUniformLocation(program, "uResolution");
            const uTimeLoc = gl.getUniformLocation(program, "uTime");
            const uMouseLoc = gl.getUniformLocation(program, "uMouse");
            const uExcitedLoc = gl.getUniformLocation(program, "uExcited");
            const uRadLoc = gl.getUniformLocation(program, "uRadius");

            isWebGLRunning = true;

            const renderWebGL = () => {
              // Mouse interpolation
              mousePosRef.current.x += (mousePosRef.current.targetX - mousePosRef.current.x) * 0.08;
              mousePosRef.current.y += (mousePosRef.current.targetY - mousePosRef.current.y) * 0.08;

              const elapsed = (Date.now() - startTimeRef.current) * 0.001 * speed;

              gl.viewport(0, 0, canvas.width, canvas.height);
              gl.clearColor(0, 0, 0, 0);
              gl.clear(gl.COLOR_BUFFER_BIT);

              gl.uniform2f(uResLoc, canvas.width, canvas.height);
              gl.uniform1f(uTimeLoc, elapsed);
              gl.uniform2f(uMouseLoc, mousePosRef.current.x, mousePosRef.current.y);
              gl.uniform1f(uExcitedLoc, isExcited ? 1.0 : 0.0);
              gl.uniform1f(uRadLoc, orbRadius);

              gl.drawArrays(gl.TRIANGLES, 0, 6);
              animFrameRef.current = requestAnimationFrame(renderWebGL);
            };

            animFrameRef.current = requestAnimationFrame(renderWebGL);

            cleanupWebGL = () => {
              if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
              gl.deleteProgram(program);
              gl.deleteShader(vs);
              gl.deleteShader(fs);
            };
          }
        }
      }
    }

    // ── 2D Canvas Fallback if WebGL failed ──
    if (!isWebGLRunning) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const render2D = () => {
        mousePosRef.current.x += (mousePosRef.current.targetX - mousePosRef.current.x) * 0.08;
        mousePosRef.current.y += (mousePosRef.current.targetY - mousePosRef.current.y) * 0.08;

        const elapsed = (Date.now() - startTimeRef.current) * 0.001 * speed;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const mx = mousePosRef.current.x * 16;
        const my = mousePosRef.current.y * 12;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Ambient Corona Glow
        const coronaGrad = ctx.createRadialGradient(
          cx + mx * 0.5,
          cy + my * 0.5,
          orbRadius * 0.7,
          cx,
          cy,
          orbRadius * 1.38
        );
        coronaGrad.addColorStop(0, "rgba(34, 197, 94, 0.45)");
        coronaGrad.addColorStop(0.5, "rgba(74, 222, 128, 0.18)");
        coronaGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = coronaGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, orbRadius * 1.38, 0, Math.PI * 2);
        ctx.fill();

        // Core Obsidian Sphere
        const bodyGrad = ctx.createRadialGradient(
          cx - orbRadius * 0.35 + mx,
          cy - orbRadius * 0.35 + my,
          orbRadius * 0.1,
          cx,
          cy,
          orbRadius
        );
        bodyGrad.addColorStop(0, "#08120c");
        bodyGrad.addColorStop(0.6, "#040705");
        bodyGrad.addColorStop(0.85, "#15803d");
        bodyGrad.addColorStop(0.98, "#4ade80");
        bodyGrad.addColorStop(1, "#86efac");

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
        ctx.fill();

        // Fluid Surface Waves Overlay
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
        ctx.clip();

        const waveGrad = ctx.createRadialGradient(
          cx + Math.sin(elapsed) * 15,
          cy + Math.cos(elapsed * 0.8) * 15,
          orbRadius * 0.2,
          cx,
          cy,
          orbRadius
        );
        waveGrad.addColorStop(0, "rgba(34, 197, 94, 0.15)");
        waveGrad.addColorStop(0.7, "rgba(22, 101, 52, 0.05)");
        waveGrad.addColorStop(1, "rgba(0, 0, 0, 0.4)");
        ctx.fillStyle = waveGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Specular highlight bead
        const specGrad = ctx.createRadialGradient(
          cx - orbRadius * 0.38 + mx * 0.8,
          cy - orbRadius * 0.38 + my * 0.8,
          1,
          cx - orbRadius * 0.38 + mx * 0.8,
          cy - orbRadius * 0.38 + my * 0.8,
          orbRadius * 0.28
        );
        specGrad.addColorStop(0, "rgba(255, 255, 255, 0.75)");
        specGrad.addColorStop(0.4, "rgba(134, 239, 172, 0.3)");
        specGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = specGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.restore();

        animFrameRef.current = requestAnimationFrame(render2D);
      };

      animFrameRef.current = requestAnimationFrame(render2D);
    }

    return () => {
      if (cleanupWebGL) cleanupWebGL();
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

      {/* ── Background Subtle Orbital Pulse Rings (Concentric Waves) ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10"
        viewBox="0 0 320 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g ref={ringsRef} className="transition-transform duration-700 ease-out">
          {/* Outer Ring 1 */}
          <circle
            cx="160"
            cy="160"
            r={isHero ? 142 : 106}
            className="stroke-primary/20"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          {/* Outer Ring 2 */}
          <circle
            cx="160"
            cy="160"
            r={isHero ? 122 : 90}
            className="stroke-primary/30 animate-pulse"
            strokeWidth="0.85"
            style={{ animationDuration: "4s" }}
          />
          {/* Inner Accent Ring */}
          <circle
            cx="160"
            cy="160"
            r={isHero ? 104 : 76}
            className="stroke-primary/40"
            strokeWidth="0.75"
          />
          {/* Floating Orbit Node */}
          <circle
            cx="160"
            cy={isHero ? 18 : 54}
            r="2.5"
            className="fill-primary animate-ping"
            style={{ animationDuration: "3s" }}
          />
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

        {/* Raymarched Shader / 2D Canvas */}
        <canvas
          ref={canvasRef}
          width={canvasDimension}
          height={canvasDimension}
          className="w-full h-full max-w-[320px] max-h-[320px] object-contain drop-shadow-[0_0_32px_rgba(34,197,94,0.45)]"
        />
      </div>
    </div>
  );
}
