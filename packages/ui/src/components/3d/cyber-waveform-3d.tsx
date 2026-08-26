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

  const sizeStyles = {
    sm: "w-[260px] h-[220px]",
    md: "w-[340px] h-[280px]",
    lg: "w-[440px] h-[360px]",
    xl: "w-[560px] h-[460px]",
    full: "w-full h-full min-h-[380px]",
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 280;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4.5, 6.5);
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
    const ambientLight = new THREE.AmbientLight(0x064e3b, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.5);
    dirLight1.position.set(5, 7, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x10b981, 2.8);
    dirLight2.position.set(-5, -4, 4);
    scene.add(dirLight2);

    // ─── 2. 3D Wave Particle Grid ───────────────────────────────────────────
    const cols = 52;
    const rows = 36;
    const totalPoints = cols * rows;
    const gridSpacing = 0.14;

    const positions = new Float32Array(totalPoints * 3);
    const colors = new Float32Array(totalPoints * 3);

    const colorA = new THREE.Color("#0ea5e9"); // Sky Blue
    const colorB = new THREE.Color("#10b981"); // Emerald Neon
    const colorC = new THREE.Color("#059669"); // Deep Forest

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
        const pointColor = colorA.clone().lerp(colorB, factor);
        colors[idx * 3]     = pointColor.r;
        colors[idx * 3 + 1] = pointColor.g;
        colors[idx * 3 + 2] = pointColor.b;
      }
    }

    const waveGeo = new THREE.BufferGeometry();
    waveGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    waveGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const waveMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    });

    const wavePoints = new THREE.Points(waveGeo, waveMat);
    masterGroup.add(wavePoints);

    // ─── 3. Floating Telemetry Node Beacons on Wave Peaks ───────────────────
    const beaconCount = 6;
    const beaconGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#10b981"),
      emissive: new THREE.Color("#00f2fe"),
      emissiveIntensity: 3.2,
      roughness: 0.1,
    });

    const beacons: { mesh: THREE.Mesh; col: number; row: number }[] = [];
    for (let b = 0; b < beaconCount; b++) {
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      masterGroup.add(beaconMesh);
      beacons.push({
        mesh: beaconMesh,
        col: Math.floor((b + 1) * (cols / (beaconCount + 1))),
        row: Math.floor((b + 1) * (rows / (beaconCount + 1))),
      });
    }

    // ─── 4. Ambient Sparkle Dust ────────────────────────────────────────────
    const dustCount = 200;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);

    for (let d = 0; d < dustCount; d++) {
      dustPos[d * 3]     = (Math.random() - 0.5) * 8;
      dustPos[d * 3 + 1] = (Math.random() - 0.2) * 3;
      dustPos[d * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: new THREE.Color("#38bdf8"),
      size: 0.035,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const dustCloud = new THREE.Points(dustGeo, dustMat);
    masterGroup.add(dustCloud);

    setIsLoaded(true);

    // ─── 5. Mouse Parallax & Ripple Disturbance ──────────────────────────────
    let mouseNX = 0;
    let mouseNY = 0;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotVelX = 0;
    let rotVelY = 0;
    let rippleStrength = 1.0;

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      rippleStrength = 2.4; // Wave burst ripple on click
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      mouseNX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseNY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      if (isDragging) {
        rotVelY = (e.clientX - prevMouseX) * 0.008;
        rotVelX = (e.clientY - prevMouseY) * 0.008;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // ─── 6. Animation Loop ──────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Master Drag Rotation + Inertia Damping
      masterGroup.rotation.y += rotVelY;
      masterGroup.rotation.x += rotVelX;
      rotVelX *= 0.94;
      rotVelY *= 0.94;

      // Parallax Tilt
      if (!isDragging) {
        masterGroup.rotation.z += ((mouseNX * 0.15) - masterGroup.rotation.z) * 0.05;
        masterGroup.rotation.x += ((-Math.PI / 5.5 - mouseNY * 0.15) - masterGroup.rotation.x) * 0.05;
      }

      rippleStrength += (1.0 - rippleStrength) * 0.04;

      // Mathematical Fluid Wave Formulation
      const posAttr = waveGeo.attributes.position;
      const arr = posAttr.array as Float32Array;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const x = (c - cols / 2) * gridSpacing;
          const z = (r - rows / 2) * gridSpacing;

          // Wave components: Fundamental sine wave + harmonic cross-wave + cursor ripple
          const wave1 = Math.sin(x * 1.8 + time * 2.2) * 0.32;
          const wave2 = Math.cos(z * 1.5 + time * 1.8) * 0.28;
          const distToCursor = Math.sqrt(Math.pow(x - mouseNX * 2, 2) + Math.pow(z - mouseNY * 2, 2));
          const ripple = Math.sin(distToCursor * 3.5 - time * 4.0) * (0.2 / (distToCursor + 0.6)) * rippleStrength;

          arr[idx * 3 + 1] = wave1 + wave2 + ripple;
        }
      }
      posAttr.needsUpdate = true;

      // Update Beacon Positions to ride on the wave peaks
      beacons.forEach((b) => {
        const idx = b.row * cols + b.col;
        b.mesh.position.set(arr[idx * 3], arr[idx * 3 + 1] + 0.12, arr[idx * 3 + 2]);
      });

      dustCloud.rotation.y -= 0.0008;

      renderer.render(scene, camera);
    };
    animate();

    // ─── 7. Resize Observer ─────────────────────────────────────────────────
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

    // ─── 8. Cleanup ─────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          if (obj.geometry) obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else if (obj.material) obj.material.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center select-none mx-auto cursor-grab active:cursor-grabbing touch-none overflow-hidden",
        sizeStyles[size],
        className
      )}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
