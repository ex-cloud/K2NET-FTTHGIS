"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "../../utils";

export interface AstrolabeCore3DProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
}

export function AstrolabeCore3D({
  className,
  size = "md",
  interactive = true,
}: AstrolabeCore3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const sizeStyles = {
    sm: "w-[260px] h-[220px]",
    md: "w-[340px] h-[280px]",
    lg: "w-[440px] h-[360px]",
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 280;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.4);

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

    // Master Rotation Group (Parallax + 360 Drag)
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // ─── 1. Lights ──────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xf0fdfa, 1.3);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.6);
    dirLight1.position.set(6, 8, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x6366f1, 2.0); // Electric Indigo rim
    dirLight2.position.set(-6, -4, 5);
    scene.add(dirLight2);

    const coreLight = new THREE.PointLight(0x2dd4bf, 4.0, 8); // Pastel Teal core
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    // ─── 2. Materials ───────────────────────────────────────────────────────
    // Matte White Porcelain Sphere
    const matPorcelain = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#f8fafc"),
      roughness: 0.22,
      metalness: 0.08,
    });

    // Iridescent Thin Glass Ring Materials
    const matRingTeal = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#5eead4"),
      transmission: 0.82,
      roughness: 0.1,
      metalness: 0.2,
      ior: 1.5,
      thickness: 0.4,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.85,
    });

    const matRingIndigo = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#818cf8"),
      transmission: 0.82,
      roughness: 0.1,
      metalness: 0.2,
      ior: 1.5,
      thickness: 0.4,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.85,
    });

    const matRingSky = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#38bdf8"),
      transmission: 0.85,
      roughness: 0.08,
      metalness: 0.25,
      ior: 1.5,
      thickness: 0.4,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.9,
    });

    // Glowing Satellite Nodes & Lasers
    const matGlowCore = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#2dd4bf"),
      emissive: new THREE.Color("#6366f1"),
      emissiveIntensity: 2.8,
      roughness: 0.05,
    });

    const matLaser = new THREE.LineBasicMaterial({
      color: new THREE.Color("#2dd4bf"),
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });

    // ─── 3. Central Core Porcelain Sphere with Internal Luminous Core ───────
    const coreGroup = new THREE.Group();
    masterGroup.add(coreGroup);

    // Central Sphere
    const centralSphere = new THREE.Mesh(new THREE.SphereGeometry(0.85, 36, 36), matPorcelain);
    coreGroup.add(centralSphere);

    // Equator Inset Glowing Ring
    const equatorRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.86, 0.035, 16, 48),
      matGlowCore
    );
    equatorRing.rotation.x = Math.PI / 2;
    coreGroup.add(equatorRing);

    // ─── 4. 3 Concentric Kinetic Astrolabe Glass Rings ───────────────────────
    // Ring 1 (Inner, Teal, spins on X/Z axis)
    const ring1Group = new THREE.Group();
    masterGroup.add(ring1Group);
    const ring1Mesh = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.045, 16, 64), matRingTeal);
    ring1Group.add(ring1Mesh);

    // Ring 2 (Middle, Indigo, spins on Y/X axis)
    const ring2Group = new THREE.Group();
    masterGroup.add(ring2Group);
    const ring2Mesh = new THREE.Mesh(new THREE.TorusGeometry(1.68, 0.045, 16, 64), matRingIndigo);
    ring2Group.add(ring2Mesh);

    // Ring 3 (Outer, Sky Blue, spins on Z/Y axis)
    const ring3Group = new THREE.Group();
    masterGroup.add(ring3Group);
    const ring3Mesh = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.045, 16, 64), matRingSky);
    ring3Group.add(ring3Mesh);

    // ─── 5. 8 Floating Satellite Bead Nodes & Laser Threads ─────────────────
    const satellitesGroup = new THREE.Group();
    masterGroup.add(satellitesGroup);

    const satCount = 8;
    const satRadius = 2.5;
    const satMeshes: { mesh: THREE.Mesh; line: THREE.Line; angle: number; speed: number; yOffset: number }[] = [];
    const satGeo = new THREE.SphereGeometry(0.09, 16, 16);

    for (let i = 0; i < satCount; i++) {
      const angle = (i / satCount) * Math.PI * 2;
      const yOff = Math.sin(angle * 2) * 0.45;
      const pos = new THREE.Vector3(Math.cos(angle) * satRadius, yOff, Math.sin(angle) * satRadius);

      // Satellite Bead
      const satMesh = new THREE.Mesh(satGeo, (i % 2 === 0) ? matPorcelain : matGlowCore);
      satMesh.position.copy(pos);
      satellitesGroup.add(satMesh);

      // Laser thread from center to satellite
      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), pos]);
      const line = new THREE.Line(lineGeo, matLaser);
      satellitesGroup.add(line);

      satMeshes.push({
        mesh: satMesh,
        line,
        angle,
        speed: 0.6 + (i % 3) * 0.2,
        yOffset: yOff,
      });
    }

    // ─── 6. Ambient Stardust Particles ───────────────────────────────────────
    const starCount = 300;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);

    for (let p = 0; p < starCount; p++) {
      const r = 1.5 + Math.random() * 2.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      starPos[p * 3]     = r * Math.cos(theta) * Math.cos(phi);
      starPos[p * 3 + 1] = r * Math.sin(theta) * Math.cos(phi);
      starPos[p * 3 + 2] = r * Math.sin(phi);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: new THREE.Color("#2dd4bf"),
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
      speedBoost = 2.4; // Kinetic acceleration on click
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
        masterGroup.position.x += ((targetTiltY * 0.45) - masterGroup.position.x) * 0.06;
        masterGroup.position.y = Math.sin(time * 1.5) * 0.1;
      }

      speedBoost += (1.0 - speedBoost) * 0.04;

      // Kinetic Astrolabe Multi-Axis Differential Rotations
      ring1Group.rotation.x = time * 0.65 * speedBoost;
      ring1Group.rotation.z = time * 0.45 * speedBoost;

      ring2Group.rotation.y = time * 0.55 * speedBoost;
      ring2Group.rotation.x = Math.PI / 3 + time * 0.35 * speedBoost;

      ring3Group.rotation.z = time * 0.45 * speedBoost;
      ring3Group.rotation.y = Math.PI / 4 + time * 0.5 * speedBoost;

      // Central Sphere micro-pulse
      coreLight.intensity = (3.5 + Math.sin(time * 3) * 1.2) * speedBoost;

      // Satellite Orbits & Laser Threads Update
      satMeshes.forEach((sat) => {
        const curAngle = sat.angle + time * 0.25 * sat.speed * speedBoost;
        const curY = sat.yOffset + Math.sin(time * 2 + sat.angle) * 0.15;
        const curPos = new THREE.Vector3(Math.cos(curAngle) * satRadius, curY, Math.sin(curAngle) * satRadius);

        sat.mesh.position.copy(curPos);

        const posAttr = sat.line.geometry.attributes.position;
        const arr = posAttr.array as Float32Array;
        arr[3] = curPos.x;
        arr[4] = curPos.y;
        arr[5] = curPos.z;
        posAttr.needsUpdate = true;
      });

      // Stardust field rotation
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
