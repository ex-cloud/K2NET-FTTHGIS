"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "../../utils";

export interface TopographicCity3DProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  interactive?: boolean;
}

export function TopographicCity3D({
  className,
  size = "md",
  interactive = true,
}: TopographicCity3DProps) {
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
    camera.position.set(0, 5.0, 7.5);
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

    // Master Group (Isometric orientation)
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);
    masterGroup.rotation.y = Math.PI / 4;

    // ─── 1. Lights ──────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x064e3b, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight1.position.set(6, 9, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x10b981, 2.6);
    dirLight2.position.set(-6, -4, 4);
    scene.add(dirLight2);

    const cityLight = new THREE.PointLight(0x38bdf8, 3.5, 8);
    cityLight.position.set(0, 2, 0);
    scene.add(cityLight);

    // ─── 2. Materials ───────────────────────────────────────────────────────
    // Dark Ceramic Isometric Building Blocks
    const matBuilding = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#0f172a"),
      roughness: 0.2,
      metalness: 0.3,
    });

    const matBuildingHighlight = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#f8fafc"),
      roughness: 0.15,
      metalness: 0.1,
    });

    // Glowing Contour Elevation Terraces
    const matTerrace = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#022c22"),
      roughness: 0.4,
      metalness: 0.1,
    });

    const matContourLine = new THREE.LineBasicMaterial({
      color: new THREE.Color("#10b981"),
      transparent: true,
      opacity: 0.75,
    });

    const matFiberLine = new THREE.LineBasicMaterial({
      color: new THREE.Color("#38bdf8"),
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    const matBeacon = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#10b981"),
      emissive: new THREE.Color("#00f2fe"),
      emissiveIntensity: 3.5,
      roughness: 0.05,
    });

    // ─── 3. Stacked Topographic GIS Elevation Contour Plates ────────────────
    const terraceGroup = new THREE.Group();
    masterGroup.add(terraceGroup);

    const terraceHeights = [0.15, 0.3, 0.45];
    const terraceRadii = [3.0, 2.2, 1.4];

    terraceRadii.forEach((radius, i) => {
      const segs = 6; // Hexagonal / GIS polygon shape
      const geo = new THREE.CylinderGeometry(radius, radius, 0.08, segs);
      const mesh = new THREE.Mesh(geo, matTerrace);
      mesh.position.y = -0.4 + i * 0.12;
      terraceGroup.add(mesh);

      // Edge wireframe contour line
      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(edges, matContourLine);
      line.position.copy(mesh.position);
      terraceGroup.add(line);
    });

    // ─── 4. Isometric 3D City Buildings & Rooftop Beacons ───────────────────
    const buildingsGroup = new THREE.Group();
    masterGroup.add(buildingsGroup);

    const buildingConfigs = [
      { x: 0, z: 0, w: 0.6, h: 1.8, d: 0.6, hl: true },      // Central Datacenter Tower
      { x: -0.8, z: 0.6, w: 0.45, h: 1.2, d: 0.45, hl: false },
      { x: 0.9, z: -0.5, w: 0.5, h: 1.4, d: 0.5, hl: true },
      { x: -0.7, z: -0.8, w: 0.4, h: 0.9, d: 0.4, hl: false },
      { x: 0.8, z: 0.8, w: 0.42, h: 1.1, d: 0.42, hl: false },
      { x: 1.4, z: 0.2, w: 0.35, h: 0.7, d: 0.35, hl: false },
      { x: -1.3, z: -0.2, w: 0.38, h: 0.8, d: 0.38, hl: false },
      { x: 0.2, z: -1.3, w: 0.35, h: 0.65, d: 0.35, hl: false },
      { x: -0.2, z: 1.4, w: 0.36, h: 0.75, d: 0.36, hl: false },
    ];

    const beaconGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const rooftopBeacons: THREE.Vector3[] = [];

    buildingConfigs.forEach((cfg) => {
      const geo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
      const mesh = new THREE.Mesh(geo, cfg.hl ? matBuildingHighlight : matBuilding);
      mesh.position.set(cfg.x, -0.4 + cfg.h / 2, cfg.z);
      buildingsGroup.add(mesh);

      // Edge wireframe for high-tech GIS look
      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(edges, matContourLine);
      line.position.copy(mesh.position);
      buildingsGroup.add(line);

      // Rooftop Beacon Node
      const beaconPos = new THREE.Vector3(cfg.x, -0.4 + cfg.h + 0.05, cfg.z);
      const beacon = new THREE.Mesh(beaconGeo, matBeacon);
      beacon.position.copy(beaconPos);
      buildingsGroup.add(beacon);

      rooftopBeacons.push(beaconPos);
    });

    // ─── 5. Fiber Optic Distribution Cables Between Buildings ──────────────
    const cableConnections = [
      [0, 1], [0, 2], [0, 3], [0, 4],
      [1, 6], [2, 5], [3, 7], [4, 8],
      [1, 8], [2, 4],
    ];

    cableConnections.forEach(([a, b]) => {
      const pA = rooftopBeacons[a];
      const pB = rooftopBeacons[b];
      const curve = new THREE.QuadraticBezierCurve3(
        pA,
        pA.clone().add(pB).multiplyScalar(0.5).setY(Math.min(pA.y, pB.y) - 0.2), // Catenary sag
        pB
      );
      const points = curve.getPoints(24);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeo, matFiberLine);
      buildingsGroup.add(line);
    });

    // ─── 6. Ambient GIS Coordinates Dust ────────────────────────────────────
    const dustCount = 200;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);

    for (let p = 0; p < dustCount; p++) {
      dustPos[p * 3]     = (Math.random() - 0.5) * 6;
      dustPos[p * 3 + 1] = Math.random() * 3;
      dustPos[p * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: new THREE.Color("#10b981"),
      size: 0.035,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const dustCloud = new THREE.Points(dustGeo, dustMat);
    masterGroup.add(dustCloud);

    setIsLoaded(true);

    // ─── 7. Parallax & Drag Interaction ─────────────────────────────────────
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotVelX = 0;
    let rotVelY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let pulseWave = 1.0;

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      pulseWave = 2.4; // GIS scan pulse on click
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

      if (!isDragging && Math.abs(rotVelY) < 0.001) {
        masterGroup.rotation.y += 0.002;
      }

      // Parallax Tilt
      if (!isDragging) {
        masterGroup.position.x += ((targetTiltY * 0.35) - masterGroup.position.x) * 0.06;
        masterGroup.position.y = Math.sin(time * 1.4) * 0.08;
      }

      pulseWave += (1.0 - pulseWave) * 0.05;
      cityLight.intensity = (3.0 + Math.sin(time * 3) * 1.2) * pulseWave;

      dustCloud.rotation.y -= 0.0008;

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
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.LineSegments || obj instanceof THREE.Points) {
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
