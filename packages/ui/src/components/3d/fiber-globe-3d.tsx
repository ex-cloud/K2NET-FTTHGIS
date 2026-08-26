"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "../../utils";

export interface FiberGlobe3DProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  interactive?: boolean;
}

export function FiberGlobe3D({
  className,
  size = "md",
  interactive = true,
}: FiberGlobe3DProps) {
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
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
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

    // Master Rotation Group (Parallax + 360 Drag)
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);
    masterGroup.rotation.x = 0.22; // Natural orbital axial tilt

    // ─── 1. Lights ──────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x064e3b, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.6);
    dirLight1.position.set(6, 8, 7);
    scene.add(dirLight1);

    const rimEmerald = new THREE.DirectionalLight(0x10b981, 2.8);
    rimEmerald.position.set(-6, -4, 4);
    scene.add(rimEmerald);

    const rimCyan = new THREE.DirectionalLight(0x00f2fe, 2.2);
    rimCyan.position.set(5, -6, -5);
    scene.add(rimCyan);

    // ─── 2. Materials ───────────────────────────────────────────────────────
    // Dark Obsidian Glass Globe Core
    const matGlobeCore = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#051622"),
      roughness: 0.25,
      metalness: 0.4,
      clearcoat: 0.9,
      clearcoatRoughness: 0.15,
      transmission: 0.4,
      transparent: true,
      opacity: 0.95,
    });

    // Glowing Emerald/Cyan Landmass Dots
    const matLandDots = new THREE.PointsMaterial({
      color: new THREE.Color("#38bdf8"),
      size: 0.045,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    // Glowing Beacons (City / OLT Nodes)
    const matBeacon = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#10b981"),
      emissive: new THREE.Color("#00f2fe"),
      emissiveIntensity: 3.5,
      roughness: 0.1,
    });

    const matHalo = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#10b981"),
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    const matArc = new THREE.LineBasicMaterial({
      color: new THREE.Color("#10b981"),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const matPhoton = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffffff"),
    });

    // ─── 3. Globe Sphere & Continental Landmass Point Cloud ─────────────────
    const globeRadius = 1.95;
    const globeMesh = new THREE.Mesh(new THREE.SphereGeometry(globeRadius, 48, 48), matGlobeCore);
    masterGroup.add(globeMesh);

    // Generate ~1200 Fibonacci Landmass Grid Points on Sphere Surface
    const dotCount = 1400;
    const dotPositions = new Float32Array(dotCount * 3);
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < dotCount; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / dotCount);
      const r = globeRadius + 0.02;

      dotPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      dotPositions[i * 3 + 1] = r * Math.cos(phi);
      dotPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }

    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPositions, 3));
    const dotCloud = new THREE.Points(dotGeo, matLandDots);
    masterGroup.add(dotCloud);

    // ─── 4. Major Global OLT / Telemetry Hub Coordinates & Arcs ─────────────
    // Lat / Long helpers to 3D Sphere Vector
    const latLongToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    // Major Telecommunication Hubs
    const hubs = [
      { name: "Jakarta", lat: -6.2, lon: 106.8 },
      { name: "Singapore", lat: 1.35, lon: 103.8 },
      { name: "Tokyo", lat: 35.67, lon: 139.65 },
      { name: "Sydney", lat: -33.86, lon: 151.2 },
      { name: "Frankfurt", lat: 50.11, lon: 8.68 },
      { name: "London", lat: 51.5, lon: -0.12 },
      { name: "New York", lat: 40.71, lon: -74.0 },
      { name: "San Francisco", lat: 37.77, lon: -122.41 },
      { name: "Dubai", lat: 25.2, lon: 55.27 },
      { name: "São Paulo", lat: -23.55, lon: -46.63 },
    ];

    const beaconGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const haloGeo = new THREE.RingGeometry(0.08, 0.14, 24);

    const beaconObjects: { mesh: THREE.Mesh; halo: THREE.Mesh; pos: THREE.Vector3 }[] = [];

    hubs.forEach((hub) => {
      const pos = latLongToVector3(hub.lat, hub.lon, globeRadius + 0.04);
      const beaconMesh = new THREE.Mesh(beaconGeo, matBeacon);
      beaconMesh.position.copy(pos);
      masterGroup.add(beaconMesh);

      const haloMesh = new THREE.Mesh(haloGeo, matHalo);
      haloMesh.position.copy(pos);
      haloMesh.lookAt(pos.clone().multiplyScalar(2));
      masterGroup.add(haloMesh);

      beaconObjects.push({ mesh: beaconMesh, halo: haloMesh, pos });
    });

    // ─── 5. 3D Curved Optical Fiber Arcs & Traveling Photons ────────────────
    const arcConnections = [
      [0, 1], // Jakarta - Singapore
      [1, 2], // Singapore - Tokyo
      [1, 8], // Singapore - Dubai
      [1, 3], // Singapore - Sydney
      [8, 4], // Dubai - Frankfurt
      [4, 5], // Frankfurt - London
      [5, 6], // London - New York
      [6, 7], // New York - San Francisco
      [7, 2], // San Francisco - Tokyo
      [6, 9], // New York - São Paulo
      [0, 3], // Jakarta - Sydney
    ];

    const photonObjects: {
      mesh: THREE.Mesh;
      curve: THREE.QuadraticBezierCurve3;
      progress: number;
      speed: number;
    }[] = [];

    const photonGeo = new THREE.SphereGeometry(0.04, 12, 12);

    arcConnections.forEach(([iA, iB], arcIdx) => {
      const pA = beaconObjects[iA].pos;
      const pB = beaconObjects[iB].pos;

      // Calculate midpoint elevated in orbit for parabolic arc
      const mid = pA.clone().add(pB).multiplyScalar(0.5);
      const distance = pA.distanceTo(pB);
      const elevation = globeRadius + Math.max(0.4, distance * 0.45);
      mid.normalize().multiplyScalar(elevation);

      const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
      const points = curve.getPoints(36);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeo, matArc);
      masterGroup.add(line);

      // Light Packet / Traveling Photon
      const photon = new THREE.Mesh(photonGeo, matPhoton);
      masterGroup.add(photon);

      photonObjects.push({
        mesh: photon,
        curve,
        progress: (arcIdx / arcConnections.length),
        speed: 0.008 + (arcIdx % 3) * 0.003,
      });
    });

    // ─── 6. Globe Atmospheric Orbital Particle Halo ────────────────────────
    const haloParticleCount = 120;
    const haloParticleGeo = new THREE.BufferGeometry();
    const haloPos = new Float32Array(haloParticleCount * 3);

    for (let p = 0; p < haloParticleCount; p++) {
      const r = globeRadius + 0.3 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      haloPos[p * 3]     = r * Math.cos(theta) * Math.cos(phi);
      haloPos[p * 3 + 1] = r * Math.sin(theta) * Math.cos(phi);
      haloPos[p * 3 + 2] = r * Math.sin(phi);
    }

    haloParticleGeo.setAttribute("position", new THREE.BufferAttribute(haloPos, 3));

    const haloParticleMat = new THREE.PointsMaterial({
      color: new THREE.Color("#10b981"),
      size: 0.032,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(haloParticleGeo, haloParticleMat);
    masterGroup.add(starField);

    setIsLoaded(true);

    // ─── 7. 360 Drag & Mouse Parallax Interaction ───────────────────────────
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotVelX = 0;
    let rotVelY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let pulseBoost = 1.0;

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      pulseBoost = 1.8;
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
        targetTiltY = nx * 0.4;
        targetTiltX = -ny * 0.3;
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
        masterGroup.rotation.y += 0.0035; // Continuous smooth orbital spin
      }

      // Parallax Tilt
      if (!isDragging) {
        masterGroup.position.x += ((targetTiltY * 0.35) - masterGroup.position.x) * 0.06;
        masterGroup.position.y = Math.sin(time * 1.2) * 0.08;
      }

      pulseBoost += (1.0 - pulseBoost) * 0.05;

      // Animate Beacon Halo Pulses
      beaconObjects.forEach((b, i) => {
        const scale = 1.0 + Math.sin(time * 3.5 + i) * 0.35 * pulseBoost;
        b.halo.scale.set(scale, scale, scale);
      });

      // Animate Traveling Light Photons across Fiber Arcs
      photonObjects.forEach((p) => {
        p.progress = (p.progress + p.speed * pulseBoost) % 1;
        const pt = p.curve.getPoint(p.progress);
        p.mesh.position.copy(pt);
      });

      // Stardust Field Slow Counter-Rotation
      starField.rotation.y -= 0.0008;

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
