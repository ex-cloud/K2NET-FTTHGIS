"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "../../utils";

export interface CloudNetClay3DProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onSphereClick?: () => void;
}

interface SphereConfig {
  x: number;
  y: number;
  z: number;
  radius: number;
  colorType: "white" | "sky" | "deepSky" | "gray" | "glow";
  speed: number;
  phase: number;
}

export function CloudNetClay3D({
  className,
  size = "md",
  interactive = true,
  onSphereClick,
}: CloudNetClay3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const sizeStyles = {
    sm: "w-[260px] h-[200px]",
    md: "w-[340px] h-[250px]",
    lg: "w-[440px] h-[320px]",
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 250;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.8);

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

    // Master Rotation Group (receives 360° drag and cursor tracking)
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // ─── 1. Lights (Soft Studio Ambient Occlusion & Rim Lighting) ───────────
    const ambientLight = new THREE.AmbientLight(0xf1f5f9, 1.3);
    scene.add(ambientLight);

    // Key Light (Warm Porcelain Highlight)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(5, 7, 6);
    scene.add(keyLight);

    // Sky Blue Fill / Rim Light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    rimLight.position.set(-6, -4, 5);
    scene.add(rimLight);

    // Soft Top Light
    const topLight = new THREE.DirectionalLight(0xe0f2fe, 1.4);
    topLight.position.set(0, 8, 2);
    scene.add(topLight);

    // Internal Glow Point Light
    const coreLight = new THREE.PointLight(0x00f2fe, 3.5, 6);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    // ─── 2. Materials (Soft Velvet Clay Palette) ────────────────────────────
    const matWhite = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#f8fafc"),
      roughness: 0.38,
      metalness: 0.05,
    });

    const matSky = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#7dd3fc"),
      roughness: 0.35,
      metalness: 0.08,
    });

    const matDeepSky = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#0ea5e9"),
      roughness: 0.32,
      metalness: 0.12,
    });

    const matGray = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#94a3b8"),
      roughness: 0.42,
      metalness: 0.06,
    });

    const matGlow = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#00f2fe"),
      emissive: new THREE.Color("#38bdf8"),
      emissiveIntensity: 2.5,
      roughness: 0.1,
    });

    // ─── 3. Organic Clay Sphere Cluster Formation (1:1 Cloud Structure) ────
    const sphereData: SphereConfig[] = [
      // Central Anchor Core Spheres (Large porcelain white & sky)
      { x:  0.0,  y:  0.25, z:  0.1,  radius: 0.88, colorType: "white",   speed: 1.5, phase: 0.0 },
      { x: -0.95, y: -0.15, z:  0.15, radius: 0.78, colorType: "sky",     speed: 1.8, phase: 0.8 },
      { x:  1.05, y: -0.1,  z:  0.1,  radius: 0.82, colorType: "white",   speed: 1.4, phase: 1.6 },
      { x:  0.35, y: -0.45, z:  0.3,  radius: 0.68, colorType: "deepSky", speed: 2.1, phase: 2.4 },
      { x: -0.45, y:  0.45, z:  0.25, radius: 0.65, colorType: "gray",    speed: 1.7, phase: 3.2 },

      // Medium Interlocking Clay Spheres
      { x: -0.4,  y: -0.3,  z:  0.4,  radius: 0.52, colorType: "white",   speed: 2.3, phase: 0.4 },
      { x:  0.65, y:  0.55, z: -0.1,  radius: 0.58, colorType: "sky",     speed: 1.6, phase: 1.2 },
      { x: -1.35, y:  0.1,  z: -0.1,  radius: 0.54, colorType: "white",   speed: 1.9, phase: 2.0 },
      { x:  1.45, y:  0.3,  z: -0.15, radius: 0.48, colorType: "gray",    speed: 2.0, phase: 2.8 },
      { x:  0.1,  y: -0.65, z: -0.2,  radius: 0.55, colorType: "sky",     speed: 1.5, phase: 3.6 },

      // Glowing Neon Energy Spheres (Nestled in crevices)
      { x: -0.25, y:  0.05, z:  0.55, radius: 0.36, colorType: "glow",    speed: 3.0, phase: 0.0 },
      { x:  0.55, y: -0.15, z:  0.45, radius: 0.38, colorType: "glow",    speed: 2.8, phase: 1.5 },
      { x: -0.85, y:  0.45, z: -0.2,  radius: 0.32, colorType: "glow",    speed: 3.2, phase: 3.0 },
      { x:  0.95, y: -0.55, z:  0.2,  radius: 0.34, colorType: "glow",    speed: 2.6, phase: 4.5 },

      // Small Accents & Floating Satellite Bubbles
      { x: -1.65, y: -0.35, z:  0.1,  radius: 0.28, colorType: "sky",     speed: 2.2, phase: 0.6 },
      { x:  1.75, y: -0.3,  z:  0.2,  radius: 0.30, colorType: "white",   speed: 2.4, phase: 1.4 },
      { x: -0.15, y:  0.88, z: -0.15, radius: 0.32, colorType: "white",   speed: 1.8, phase: 2.2 },
      { x:  1.2,  y:  0.75, z:  0.15, radius: 0.25, colorType: "gray",    speed: 2.5, phase: 3.0 },
      { x: -1.2,  y: -0.6,  z:  0.3,  radius: 0.26, colorType: "deepSky", speed: 2.0, phase: 3.8 },
      { x:  0.0,  y: -0.85, z:  0.25, radius: 0.24, colorType: "glow",    speed: 3.4, phase: 4.2 },
    ];

    const sphereMeshes: {
      mesh: THREE.Mesh;
      basePos: THREE.Vector3;
      baseScale: number;
      speed: number;
      phase: number;
    }[] = [];

    const baseGeo = new THREE.SphereGeometry(1, 32, 32);

    sphereData.forEach((item) => {
      let mat = matWhite;
      if (item.colorType === "sky") mat = matSky;
      else if (item.colorType === "deepSky") mat = matDeepSky;
      else if (item.colorType === "gray") mat = matGray;
      else if (item.colorType === "glow") mat = matGlow;

      const mesh = new THREE.Mesh(baseGeo, mat);
      mesh.position.set(item.x, item.y, item.z);
      mesh.scale.setScalar(item.radius);
      masterGroup.add(mesh);

      sphereMeshes.push({
        mesh,
        basePos: new THREE.Vector3(item.x, item.y, item.z),
        baseScale: item.radius,
        speed: item.speed,
        phase: item.phase,
      });
    });

    setIsLoaded(true);

    // ─── 4. Full 360° Drag & Hover Mouse Tracking ───────────────────────────
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotVelX = 0;
    let rotVelY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;

    // Squish wobble state
    let squishFactor = 1.0;
    let squishVel = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      // Trigger spring squish on click
      squishVel = -0.35;
      if (onSphereClick) onSphereClick();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        rotVelY = deltaX * 0.008;
        rotVelX = deltaY * 0.008;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      } else {
        // Hover tilt
        targetTiltY = nx * 0.45;
        targetTiltX = -ny * 0.35;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // ─── 5. Animation Loop ──────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Continuous 360° Drag Rotation + Inertia Damping
      masterGroup.rotation.y += rotVelY;
      masterGroup.rotation.x += rotVelX;
      rotVelX *= 0.94; // friction
      rotVelY *= 0.94;

      // Subtle Idle 360° Auto-spin when not dragged
      if (!isDragging && Math.abs(rotVelY) < 0.001) {
        masterGroup.rotation.y += 0.003;
      }

      // Hover Parallax Tilt interpolation
      if (!isDragging) {
        masterGroup.position.x += ((targetTiltY * 0.4) - masterGroup.position.x) * 0.06;
      }

      // Master Floating Levitation (Breathing float on Y)
      masterGroup.position.y = Math.sin(time * 1.5) * 0.1;

      // Spring Squish Physics (Damped Harmonic Oscillator)
      const springK = 0.12;
      const damp = 0.88;
      const squishForce = (1.0 - squishFactor) * springK;
      squishVel = (squishVel + squishForce) * damp;
      squishFactor += squishVel;

      // Pulse the inner light
      coreLight.intensity = 3.5 + Math.sin(time * 3) * 1.2;

      // Individual Sphere Breathing & Organic Wobble
      sphereMeshes.forEach((item) => {
        const breathing = 1.0 + Math.sin(time * item.speed + item.phase) * 0.035;
        const currentScale = item.baseScale * breathing * squishFactor;

        // Apply slight squash and stretch along Y/XZ
        const scaleY = currentScale * (2.0 - squishFactor);
        const scaleXZ = currentScale * (squishFactor);

        item.mesh.scale.set(scaleXZ, scaleY, scaleXZ);

        // Subtle micro-orbital oscillation
        const microFloat = Math.sin(time * item.speed * 0.8 + item.phase) * 0.02;
        item.mesh.position.y = item.basePos.y + microFloat;
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

    // ─── 7. Cleanup on unmount ──────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive, onSphereClick]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center select-none mx-auto cursor-grab active:cursor-grabbing touch-none",
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
