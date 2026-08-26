"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "../../utils";

export interface AetherJelly3DProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
}

export function AetherJelly3D({
  className,
  size = "md",
  interactive = true,
}: AetherJelly3DProps) {
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

    // Master Rotation Group (Parallax + 360 Drag)
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // ─── 1. Lights ──────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xe0f2fe, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.4);
    dirLight1.position.set(5, 8, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 2.0); // Lilac backlight
    dirLight2.position.set(-6, -5, -4);
    scene.add(dirLight2);

    const coreLight = new THREE.PointLight(0x00f2fe, 4.0, 8); // Cyan core glow
    coreLight.position.set(0, 0.2, 0);
    scene.add(coreLight);

    // ─── 2. Materials ───────────────────────────────────────────────────────
    // Frosted Translucent Glass Dome
    const matGlassDome = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#e0f2fe"),
      transmission: 0.85,
      opacity: 0.9,
      transparent: true,
      roughness: 0.15,
      ior: 1.45,
      thickness: 0.8,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
    });

    // Matte White Ceramic Base Accent
    const matCeramic = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#f8fafc"),
      roughness: 0.25,
      metalness: 0.08,
    });

    // Glowing Lilac / Cyan Core Organ
    const matCoreGlow = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#c084fc"),
      emissive: new THREE.Color("#00f2fe"),
      emissiveIntensity: 3.2,
      roughness: 0.05,
    });

    // Fiber Optic Tendril Material
    const matTendril = new THREE.LineBasicMaterial({
      color: new THREE.Color("#38bdf8"),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const matPhoton = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#00f2fe"),
    });

    // ─── 3. Biomorphic Jellyfish Dome & Inner Coral Organ ───────────────────
    const bodyGroup = new THREE.Group();
    masterGroup.add(bodyGroup);

    // Outer Glass Dome (Hemisphere with smooth bevel rim)
    const domeGeo = new THREE.SphereGeometry(1.2, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const domeMesh = new THREE.Mesh(domeGeo, matGlassDome);
    domeMesh.rotation.x = Math.PI; // Flip dome so rim is at bottom
    domeMesh.position.y = 0.6;
    bodyGroup.add(domeMesh);

    // Ceramic Rim Ring at the base of the dome
    const rimGeo = new THREE.TorusGeometry(1.15, 0.06, 16, 48);
    const rimMesh = new THREE.Mesh(rimGeo, matCeramic);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.6;
    bodyGroup.add(rimMesh);

    // Inner Glowing Core (Multi-lobed coral organ)
    const innerCoreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), matCoreGlow);
    innerCoreMesh.position.y = 0.5;
    bodyGroup.add(innerCoreMesh);

    for (let c = 0; c < 4; c++) {
      const subAngle = (c / 4) * Math.PI * 2;
      const subOrb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), matCoreGlow);
      subOrb.position.set(Math.cos(subAngle) * 0.35, 0.4, Math.sin(subAngle) * 0.35);
      bodyGroup.add(subOrb);
    }

    // ─── 4. 12 Fiber-Optic Tendrils with Traveling Light Waves ──────────────
    const tendrilCount = 12;
    const tendrilSegments = 24;
    const tendrilLength = 2.4;
    const tendrils: {
      line: THREE.Line;
      geo: THREE.BufferGeometry;
      baseAngle: number;
      baseRadius: number;
      speed: number;
      phase: number;
    }[] = [];

    const photonMeshes: { mesh: THREE.Mesh; tendrilIdx: number; progress: number; speed: number }[] = [];
    const photonGeo = new THREE.SphereGeometry(0.032, 12, 12);

    for (let t = 0; t < tendrilCount; t++) {
      const baseAngle = (t / tendrilCount) * Math.PI * 2;
      const baseRadius = 0.75 + (t % 2) * 0.35;

      const points: THREE.Vector3[] = [];
      for (let s = 0; s <= tendrilSegments; s++) {
        const py = 0.6 - (s / tendrilSegments) * tendrilLength;
        points.push(new THREE.Vector3(Math.cos(baseAngle) * baseRadius, py, Math.sin(baseAngle) * baseRadius));
      }

      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, matTendril);
      bodyGroup.add(line);

      tendrils.push({
        line,
        geo,
        baseAngle,
        baseRadius,
        speed: 1.8 + (t % 3) * 0.4,
        phase: (t / tendrilCount) * Math.PI * 2,
      });

      // Photons traveling down the fiber tendrils
      const photon = new THREE.Mesh(photonGeo, matPhoton);
      bodyGroup.add(photon);
      photonMeshes.push({
        mesh: photon,
        tendrilIdx: t,
        progress: (t / tendrilCount),
        speed: 0.012 + (t % 3) * 0.004,
      });
    }

    // ─── 5. Ambient Bioluminescent Particle Cloud ───────────────────────────
    const pCount = 200;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);

    for (let p = 0; p < pCount; p++) {
      const r = 0.8 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      pPositions[p * 3]     = r * Math.cos(theta) * Math.cos(phi);
      pPositions[p * 3 + 1] = (Math.random() - 0.6) * 3.0;
      pPositions[p * 3 + 2] = r * Math.sin(theta) * Math.cos(phi);
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: new THREE.Color("#00f2fe"),
      size: 0.035,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const pCloud = new THREE.Points(pGeo, pMat);
    masterGroup.add(pCloud);

    setIsLoaded(true);

    // ─── 6. Mouse Parallax & 360 Drag Interaction ───────────────────────────
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotVelX = 0;
    let rotVelY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let bloomBoost = 1.0;

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      bloomBoost = 1.45; // Tendril bloom pulse on click
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

    // ─── 7. Animation Loop (Swimming Physics & Wave Tendrils) ───────────────
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Master 360 Rotation + Inertia Damping
      masterGroup.rotation.y += rotVelY;
      masterGroup.rotation.x += rotVelX;
      rotVelX *= 0.94;
      rotVelY *= 0.94;

      if (!isDragging && Math.abs(rotVelY) < 0.001) {
        masterGroup.rotation.y += 0.002;
      }

      // Parallax Tilt
      if (!isDragging) {
        masterGroup.rotation.z += ((-targetTiltY * 0.25) - masterGroup.rotation.z) * 0.06;
      }

      // Swimming Harmonic Levitation (Jellyfish Propulsion Cycle)
      const swimCycle = Math.sin(time * 2.0);
      const swimPropulsion = Math.max(0, swimCycle);
      masterGroup.position.y = Math.sin(time * 1.5) * 0.15 + swimPropulsion * 0.08;

      // Bell Dome Expansion & Contraction
      const bellScaleY = 1.0 + swimCycle * 0.08;
      const bellScaleXZ = 1.0 - swimCycle * 0.05;
      domeMesh.scale.set(bellScaleXZ, bellScaleY, bellScaleXZ);

      // Pulse Core Glow
      bloomBoost += (1.0 - bloomBoost) * 0.05;
      coreLight.intensity = (3.5 + Math.sin(time * 3) * 1.5) * bloomBoost;

      // Animate Undulating Fiber-Optic Tendrils (Physics Wave Propagation)
      tendrils.forEach((t) => {
        const posAttr = t.geo.attributes.position;
        const arr = posAttr.array as Float32Array;

        for (let s = 0; s <= tendrilSegments; s++) {
          const segProgress = s / tendrilSegments;
          const wavePhase = time * t.speed + t.phase + segProgress * 4.0;
          const swayX = Math.sin(wavePhase) * (0.08 + segProgress * 0.25) * bloomBoost;
          const swayZ = Math.cos(wavePhase * 0.8) * (0.08 + segProgress * 0.25) * bloomBoost;

          const currentRadius = t.baseRadius * (1.0 + (1.0 - segProgress) * (bellScaleXZ - 1.0));
          const bx = Math.cos(t.baseAngle) * currentRadius + swayX;
          const by = 0.6 - segProgress * tendrilLength;
          const bz = Math.sin(t.baseAngle) * currentRadius + swayZ;

          arr[s * 3]     = bx;
          arr[s * 3 + 1] = by;
          arr[s * 3 + 2] = bz;
        }
        posAttr.needsUpdate = true;
      });

      // Animate Traveling Light Packets down the fiber tendrils
      photonMeshes.forEach((p) => {
        p.progress = (p.progress + p.speed) % 1;
        const targetTendril = tendrils[p.tendrilIdx];
        if (targetTendril) {
          const arr = targetTendril.geo.attributes.position.array as Float32Array;
          const segIdx = Math.floor(p.progress * tendrilSegments);
          p.mesh.position.set(arr[segIdx * 3], arr[segIdx * 3 + 1], arr[segIdx * 3 + 2]);
        }
      });

      // Ambient particle rotation
      pCloud.rotation.y -= 0.001;

      renderer.render(scene, camera);
    };
    animate();

    // ─── 8. Resize Observer ─────────────────────────────────────────────────
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

    // ─── 9. Cleanup ─────────────────────────────────────────────────────────
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
