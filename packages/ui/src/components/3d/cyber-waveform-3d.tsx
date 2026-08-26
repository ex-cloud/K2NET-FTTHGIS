"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "../../utils";

export interface CyberWaveform3DProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  interactive?: boolean;
}

export function CyberWaveform3D({
  className,
  size = "md",
  interactive = true,
}: CyberWaveform3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
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

  const sizeStyles = {
    sm: "w-[240px] h-[200px]",
    md: "w-[300px] h-[260px]",
    lg: "w-[380px] h-[320px]",
    xl: "w-[480px] h-[400px]",
    full: "w-full h-full min-h-[360px]",
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 260;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 4.2, 6.8);
    camera.lookAt(0, 0, 0);

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

    // Master Group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);
    masterGroup.rotation.x = -Math.PI / 5.5;

    // ─── 1. Lights ──────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(isDark ? 0x064e3b : 0xe0f2fe, isDark ? 1.4 : 2.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(isDark ? 0x38bdf8 : 0x0284c7, 2.5);
    dirLight1.position.set(5, 7, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(isDark ? 0x10b981 : 0x059669, 2.8);
    dirLight2.position.set(-5, -4, 4);
    scene.add(dirLight2);

    // ─── 2. 3D Wave Particle Grid ───────────────────────────────────────────
    const cols = 50;
    const rows = 34;
    const totalPoints = cols * rows;
    const gridSpacing = 0.13;

    const positions = new Float32Array(totalPoints * 3);
    const colors = new Float32Array(totalPoints * 3);

    const colorA = new THREE.Color(isDark ? "#0ea5e9" : "#1d4ed8"); // Sky Blue (Dark) vs Royal Sapphire (Light)
    const colorB = new THREE.Color(isDark ? "#10b981" : "#059669"); // Emerald Neon (Dark) vs Forest Emerald (Light)
    const colorC = new THREE.Color(isDark ? "#00f2fe" : "#0284c7"); // Neon Cyan (Dark) vs Deep Cyan (Light)

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const x = (c - cols / 2) * gridSpacing;
        const z = (r - rows / 2) * gridSpacing;
        const y = 0;

        positions[idx * 3]     = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = z;

        // Gradient interpolation
        const factor = (c / cols + r / rows) / 2;
        const pointColor = colorA.clone().lerp(colorB, factor).lerp(colorC, Math.sin(factor * Math.PI));
        colors[idx * 3]     = pointColor.r;
        colors[idx * 3 + 1] = pointColor.g;
        colors[idx * 3 + 2] = pointColor.b;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: isDark ? 0.045 : 0.052,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.88 : 0.95,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    const wavePoints = new THREE.Points(geometry, material);
    masterGroup.add(wavePoints);

    // ─── 3. Floating Telemetry Beacons atop Peaks ────────────────────────────
    const beaconCount = 6;
    const beaconGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(isDark ? "#00f2fe" : "#0284c7"),
      emissive: new THREE.Color(isDark ? "#10b981" : "#059669"),
      emissiveIntensity: isDark ? 2.5 : 1.6,
      roughness: 0.1,
    });

    const beaconObjects: { mesh: THREE.Mesh; col: number; row: number; offset: number }[] = [];

    const samplePoints = [
      { c: 8, r: 8 },
      { c: 24, r: 16 },
      { c: 40, r: 24 },
      { c: 12, r: 28 },
      { c: 36, r: 10 },
      { c: 28, r: 30 },
    ];

    for (let i = 0; i < beaconCount; i++) {
      const bMesh = new THREE.Mesh(beaconGeo, beaconMat);
      masterGroup.add(bMesh);
      beaconObjects.push({
        mesh: bMesh,
        col: samplePoints[i].c,
        row: samplePoints[i].r,
        offset: i * 1.2,
      });
    }

    setIsLoaded(true);

    // ─── 4. Mouse Parallax & Ripple Physics ──────────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = -Math.PI / 5.5;
    let rippleStrength = 1.0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      mouseX = nx;
      mouseY = ny;
      targetRotY = nx * 0.45;
      targetRotX = -Math.PI / 5.5 - ny * 0.25;
    };

    const onPointerDown = () => {
      if (!interactive) return;
      rippleStrength = 2.8;
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);

    // ─── 5. Animation Loop ──────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth Rotation Damping
      masterGroup.rotation.y += (targetRotY - masterGroup.rotation.y) * 0.05;
      masterGroup.rotation.x += (targetRotX - masterGroup.rotation.x) * 0.05;

      rippleStrength += (1.0 - rippleStrength) * 0.04;

      // Mathematical Sinusoidal Wave Deformation
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = (r * cols + c) * 3;
          const x = posArray[idx];
          const z = posArray[idx + 2];

          // Complex layered sinusoidal interference waves
          const wave1 = Math.sin(x * 1.5 + time * 2.2) * 0.35;
          const wave2 = Math.cos(z * 1.8 + time * 1.8) * 0.25;
          const wave3 = Math.sin((x + z) * 1.2 + time * 1.4) * 0.2;

          // Interactive cursor ripple
          const distToCursor = Math.sqrt((x - mouseX * 2.5) ** 2 + (z - mouseY * 2.0) ** 2);
          const cursorRipple = Math.sin(distToCursor * 3.5 - time * 4.0) * Math.exp(-distToCursor * 0.6) * 0.45 * rippleStrength;

          posArray[idx + 1] = (wave1 + wave2 + wave3 + cursorRipple) * 0.85;
        }
      }
      posAttr.needsUpdate = true;

      // Update Beacon Positions to Ride Wave Crests
      beaconObjects.forEach((b) => {
        const idx = (b.row * cols + b.col) * 3;
        b.mesh.position.x = posArray[idx];
        b.mesh.position.y = posArray[idx + 1] + 0.12;
        b.mesh.position.z = posArray[idx + 2];
      });

      renderer.render(scene, camera);
    };
    animate();

    // ─── 6. Resize Observer ─────────────────────────────────────────────────
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

    // ─── 7. Cleanup ─────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);

      geometry.dispose();
      material.dispose();
      beaconGeo.dispose();
      beaconMat.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive, isDark]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center select-none cursor-pointer",
        sizeStyles[size],
        className
      )}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
