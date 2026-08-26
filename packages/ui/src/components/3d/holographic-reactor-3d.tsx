"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "../../utils";

export interface HolographicReactor3DProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  interactive?: boolean;
}

export function HolographicReactor3D({
  className,
  size = "md",
  interactive = true,
}: HolographicReactor3DProps) {
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
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.2);

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

    // Master Rotation Group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // ─── 1. Lights ──────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x064e3b, 1.3);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.6);
    dirLight1.position.set(6, 8, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x10b981, 2.4);
    dirLight2.position.set(-6, -4, 4);
    scene.add(dirLight2);

    const corePointLight = new THREE.PointLight(0x00f2fe, 4.2, 9);
    corePointLight.position.set(0, 0, 0);
    scene.add(corePointLight);

    // ─── 2. Materials ───────────────────────────────────────────────────────
    // Luminous Holographic Plasma Core
    const matPlasmaCore = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#00f2fe"),
      emissive: new THREE.Color("#10b981"),
      emissiveIntensity: 3.5,
      roughness: 0.1,
    });

    const matFrostedGlass = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#e0f2fe"),
      transmission: 0.85,
      roughness: 0.12,
      ior: 1.5,
      thickness: 0.5,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.88,
    });

    const matRingTeal = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#10b981"),
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });

    const matRingCyan = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#00f2fe"),
      transparent: true,
      opacity: 0.6,
    });

    const matLaserBeam = new THREE.LineBasicMaterial({
      color: new THREE.Color("#10b981"),
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });

    // ─── 3. Central Reactor Core & Containment Sphere ───────────────────────
    const coreGroup = new THREE.Group();
    masterGroup.add(coreGroup);

    // Inner Glowing Core
    const innerPlasma = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 2), matPlasmaCore);
    coreGroup.add(innerPlasma);

    // Outer Frosted Glass Shield
    const outerShield = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), matFrostedGlass);
    coreGroup.add(outerShield);

    // ─── 4. 4 Concentric Gimbal Rings ───────────────────────────────────────
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.035, 16, 48), matRingTeal);
    masterGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.035, 16, 48), matRingCyan);
    masterGroup.add(ring2);

    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.035, 16, 48), matRingTeal);
    masterGroup.add(ring3);

    // ─── 5. 6 Orbiting Data Prism Satellites & Laser Threads ────────────────
    const satCount = 6;
    const satRadius = 2.6;
    const satGeo = new THREE.OctahedronGeometry(0.12, 0);
    const satMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#f8fafc"),
      roughness: 0.2,
      metalness: 0.1,
    });

    const satellites: { mesh: THREE.Mesh; line: THREE.Line; angle: number; speed: number; yOff: number }[] = [];

    for (let i = 0; i < satCount; i++) {
      const angle = (i / satCount) * Math.PI * 2;
      const yOff = Math.sin(angle * 2) * 0.5;
      const pos = new THREE.Vector3(Math.cos(angle) * satRadius, yOff, Math.sin(angle) * satRadius);

      const mesh = new THREE.Mesh(satGeo, satMat);
      mesh.position.copy(pos);
      masterGroup.add(mesh);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), pos]);
      const line = new THREE.Line(lineGeo, matLaserBeam);
      masterGroup.add(line);

      satellites.push({
        mesh,
        line,
        angle,
        speed: 0.5 + (i % 2) * 0.3,
        yOff,
      });
    }

    // ─── 6. Stardust Cloud ──────────────────────────────────────────────────
    const starCount = 280;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);

    for (let p = 0; p < starCount; p++) {
      const r = 1.8 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      starPos[p * 3]     = r * Math.cos(theta) * Math.cos(phi);
      starPos[p * 3 + 1] = r * Math.sin(theta) * Math.cos(phi);
      starPos[p * 3 + 2] = r * Math.sin(phi);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: new THREE.Color("#00f2fe"),
      size: 0.035,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeo, starMat);
    masterGroup.add(starField);

    setIsLoaded(true);

    // ─── 7. Parallax & Drag Interaction ─────────────────────────────────────
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotVelX = 0;
    let rotVelY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let speedBoost = 1.0;

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      speedBoost = 2.5; // Kinetic pulse on click
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      if (isDragging) {
        rotVelY = (e.clientX - prevMouseX) * 0.008;
        rotVelX = (e.clientY - prevMouseY) * 0.008;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      } else {
        targetTiltY = nx * 0.5;
        targetTiltX = -ny * 0.38;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // ─── 8. Animation Loop ──────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Master 360 Drag Rotation + Inertia Damping
      masterGroup.rotation.y += rotVelY;
      masterGroup.rotation.x += rotVelX;
      rotVelX *= 0.94;
      rotVelY *= 0.94;

      // Parallax Tilt
      if (!isDragging) {
        masterGroup.position.x += ((targetTiltY * 0.4) - masterGroup.position.x) * 0.06;
        masterGroup.position.y = Math.sin(time * 1.5) * 0.1;
      }

      speedBoost += (1.0 - speedBoost) * 0.04;

      // Gimbal Differential Rotations
      ring1.rotation.x = time * 0.65 * speedBoost;
      ring1.rotation.z = time * 0.45 * speedBoost;

      ring2.rotation.y = time * 0.55 * speedBoost;
      ring2.rotation.x = Math.PI / 4 + time * 0.35 * speedBoost;

      ring3.rotation.z = time * 0.45 * speedBoost;
      ring3.rotation.y = Math.PI / 3 + time * 0.5 * speedBoost;

      // Core Plasma Micro-Rotation
      innerPlasma.rotation.y += 0.02 * speedBoost;
      outerShield.rotation.y -= 0.01 * speedBoost;
      corePointLight.intensity = (3.5 + Math.sin(time * 3.5) * 1.5) * speedBoost;

      // Satellites Update
      satellites.forEach((sat) => {
        const curAngle = sat.angle + time * 0.25 * sat.speed * speedBoost;
        const curY = sat.yOff + Math.sin(time * 2 + sat.angle) * 0.15;
        const curPos = new THREE.Vector3(Math.cos(curAngle) * satRadius, curY, Math.sin(curAngle) * satRadius);

        sat.mesh.position.copy(curPos);
        sat.mesh.rotation.y += 0.03;

        const posAttr = sat.line.geometry.attributes.position;
        const arr = posAttr.array as Float32Array;
        arr[3] = curPos.x;
        arr[4] = curPos.y;
        arr[5] = curPos.z;
        posAttr.needsUpdate = true;
      });

      starField.rotation.y -= 0.001;

      renderer.render(scene, camera);
    };
    animate();

    // ─── 9. Resize Observer ─────────────────────────────────────────────────
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

    // ─── 10. Cleanup ────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
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
