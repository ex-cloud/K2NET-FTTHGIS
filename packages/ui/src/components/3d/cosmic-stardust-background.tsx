"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "../../utils";

export interface CosmicStardustBackgroundProps {
  className?: string;
  starCount?: number;
  interactive?: boolean;
}

/**
 * CosmicStardustBackground
 * High-performance, full-viewport WebGL deep-space galaxy stardust canvas.
 * Spreads multi-colored twinkling stars with natural 3D depth across the entire background container.
 * Automatically adapts palette for both Dark and Light modes.
 */
export function CosmicStardustBackground({
  className,
  starCount = 650,
  interactive = true,
}: CosmicStardustBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 900;

    // Scene & Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 10);

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ─── Generate Multi-Colored Deep Space Stars (Theme Adaptive) ───────────
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    // Dark vs Light Mode Palette
    const darkPalette = [
      new THREE.Color("#ffffff"), // Pure brilliant white
      new THREE.Color("#f8fafc"), // Silver white
      new THREE.Color("#38bdf8"), // Sky blue
      new THREE.Color("#0ea5e9"), // Deep sky
      new THREE.Color("#10b981"), // Emerald teal
      new THREE.Color("#00f2fe"), // Neon cyan
      new THREE.Color("#818cf8"), // Soft indigo
    ];

    const lightPalette = [
      new THREE.Color("#0284c7"), // Deep Sky Cyan
      new THREE.Color("#0891b2"), // Deep Ocean Cyan
      new THREE.Color("#059669"), // Forest Emerald
      new THREE.Color("#4f46e5"), // Deep Indigo
      new THREE.Color("#64748b"), // Slate Blue
      new THREE.Color("#2563eb"), // Royal Blue
    ];

    const palette = isDark ? darkPalette : lightPalette;

    for (let i = 0; i < starCount; i++) {
      // Wide distribution covering full rectangular viewport
      positions[i * 3]     = (Math.random() - 0.5) * 22.0;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12.0 - 2.0;

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: isDark ? 0.048 : 0.055,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.85 : 0.65,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // ─── Mouse Parallax Interaction ─────────────────────────────────────────
    let mouseNX = 0;
    let mouseNY = 0;

    const onPointerMove = (e: PointerEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      mouseNX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseNY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    window.addEventListener("pointermove", onPointerMove);

    // ─── Animation Loop ─────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Subtle slow galaxy rotation
      starPoints.rotation.y = time * 0.015;
      starPoints.rotation.x = Math.sin(time * 0.01) * 0.05;

      // Parallax camera displacement
      camera.position.x += ((mouseNX * 0.8) - camera.position.x) * 0.03;
      camera.position.y += ((-mouseNY * 0.6) - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      // Subtle breathing twinkle
      starMat.opacity = (isDark ? 0.75 : 0.55) + Math.sin(time * 1.8) * 0.15;

      renderer.render(scene, camera);
    };
    animate();

    // ─── Resize Observer ────────────────────────────────────────────────────
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    // ─── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);

      starGeo.dispose();
      starMat.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [starCount, interactive, isDark]);

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 pointer-events-none overflow-hidden select-none z-0", className)}
    />
  );
}
