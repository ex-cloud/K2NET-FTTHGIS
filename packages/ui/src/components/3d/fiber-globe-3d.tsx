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
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    // Adjusted distance for balanced, non-oversized proportions
    camera.position.set(0, 0, 8.8);

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
    const ambientLight = new THREE.AmbientLight(isDark ? 0x064e3b : 0xe0f2fe, isDark ? 1.4 : 2.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, isDark ? 2.6 : 3.0);
    dirLight1.position.set(6, 8, 7);
    scene.add(dirLight1);

    const rimEmerald = new THREE.DirectionalLight(isDark ? 0x10b981 : 0x059669, 2.5);
    rimEmerald.position.set(-6, -4, 4);
    scene.add(rimEmerald);

    const rimCyan = new THREE.DirectionalLight(isDark ? 0x00f2fe : 0x0284c7, 2.2);
    rimCyan.position.set(5, -6, -5);
    scene.add(rimCyan);

    // ─── 2. Materials (Theme Adaptive) ──────────────────────────────────────
    // Globe Core: Obsidian Glass (Dark) vs Translucent Crystal Pearl (Light)
    const matGlobeCore = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(isDark ? "#061320" : "#f1f5f9"),
      roughness: isDark ? 0.25 : 0.15,
      metalness: isDark ? 0.35 : 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transmission: isDark ? 0.4 : 0.82,
      transparent: true,
      opacity: isDark ? 0.95 : 0.85,
    });

    // Continental Landmass Dots
    const matLandDots = new THREE.PointsMaterial({
      color: new THREE.Color(isDark ? "#38bdf8" : "#0284c7"),
      size: 0.038,
      transparent: true,
      opacity: isDark ? 0.9 : 0.95,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    // Glowing Beacons (City / OLT Nodes)
    const matBeacon = new THREE.MeshStandardMaterial({
      color: new THREE.Color(isDark ? "#10b981" : "#059669"),
      emissive: new THREE.Color(isDark ? "#00f2fe" : "#0284c7"),
      emissiveIntensity: isDark ? 3.0 : 1.8,
      roughness: 0.1,
    });

    const matHalo = new THREE.MeshBasicMaterial({
      color: new THREE.Color(isDark ? "#10b981" : "#059669"),
      transparent: true,
      opacity: isDark ? 0.5 : 0.4,
      side: THREE.DoubleSide,
    });

    const matArc = new THREE.LineBasicMaterial({
      color: new THREE.Color(isDark ? "#10b981" : "#0284c7"),
      transparent: true,
      opacity: isDark ? 0.75 : 0.85,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    const matPhoton = new THREE.MeshBasicMaterial({
      color: new THREE.Color(isDark ? "#ffffff" : "#0284c7"),
    });

    // ─── 3. Globe Sphere & Continental Landmass Point Cloud ─────────────────
    // Compact, balanced radius (1.38)
    const globeRadius = 1.38;
    const globeMesh = new THREE.Mesh(new THREE.SphereGeometry(globeRadius, 48, 48), matGlobeCore);
    masterGroup.add(globeMesh);

    // Generate ~1200 Fibonacci Landmass Grid Points on Sphere Surface
    const dotCount = 1300;
    const dotPositions = new Float32Array(dotCount * 3);
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < dotCount; i++) {
      const theta = (2 * Math.PI * i) / goldenRatio;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / dotCount);
      const r = globeRadius + 0.018;

      dotPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      dotPositions[i * 3 + 1] = r * Math.cos(phi);
      dotPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }

    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPositions, 3));
    const dotCloud = new THREE.Points(dotGeo, matLandDots);
    masterGroup.add(dotCloud);

    // ─── 4. Major Global OLT / Telemetry Hub Coordinates & Arcs ─────────────
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

    const beaconGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const haloGeo = new THREE.RingGeometry(0.065, 0.11, 24);

    const beaconObjects: { mesh: THREE.Mesh; halo: THREE.Mesh; pos: THREE.Vector3 }[] = [];

    hubs.forEach((hub) => {
      const pos = latLongToVector3(hub.lat, hub.lon, globeRadius + 0.03);
      const beaconMesh = new THREE.Mesh(beaconGeo, matBeacon);
      beaconMesh.position.copy(pos);

      const haloMesh = new THREE.Mesh(haloGeo, matHalo);
      haloMesh.position.copy(pos);
      haloMesh.lookAt(new THREE.Vector3(0, 0, 0));

      masterGroup.add(beaconMesh);
      masterGroup.add(haloMesh);
      beaconObjects.push({ mesh: beaconMesh, halo: haloMesh, pos });
    });

    // ─── 5. 3D Parabolic Curved Fiber Arcs Between Telemetry Hubs ───────────
    const createFiberArc = (v1: THREE.Vector3, v2: THREE.Vector3) => {
      const distance = v1.distanceTo(v2);
      const mid = v1.clone().add(v2).multiplyScalar(0.5);
      const midLength = mid.length();
      const altitude = globeRadius + distance * 0.32;
      mid.normalize().multiplyScalar(altitude);

      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const points = curve.getPoints(36);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcLine = new THREE.Line(arcGeo, matArc);
      masterGroup.add(arcLine);

      const photonGeo = new THREE.SphereGeometry(0.038, 8, 8);
      const photonMesh = new THREE.Mesh(photonGeo, matPhoton);
      masterGroup.add(photonMesh);

      return { curve, mesh: photonMesh, progress: Math.random(), speed: 0.005 + Math.random() * 0.005 };
    };

    const hubPairs = [
      [0, 1], // Jakarta - Singapore
      [1, 2], // Singapore - Tokyo
      [2, 7], // Tokyo - SF
      [7, 6], // SF - NY
      [6, 5], // NY - London
      [5, 4], // London - Frankfurt
      [4, 8], // Frankfurt - Dubai
      [8, 1], // Dubai - Singapore
      [1, 3], // Singapore - Sydney
      [6, 9], // NY - Sao Paulo
    ];

    const photonObjects: { curve: THREE.QuadraticBezierCurve3; mesh: THREE.Mesh; progress: number; speed: number }[] = [];

    hubPairs.forEach(([i1, i2]) => {
      if (beaconObjects[i1] && beaconObjects[i2]) {
        const obj = createFiberArc(beaconObjects[i1].pos, beaconObjects[i2].pos);
        photonObjects.push(obj);
      }
    });

    // ─── 6. Globe Atmospheric Orbital Particle Halo ────────────────────────
    const haloParticleCount = 100;
    const haloParticleGeo = new THREE.BufferGeometry();
    const haloPos = new Float32Array(haloParticleCount * 3);

    for (let p = 0; p < haloParticleCount; p++) {
      const r = globeRadius + 0.2 + Math.random() * 0.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      haloPos[p * 3]     = r * Math.cos(theta) * Math.cos(phi);
      haloPos[p * 3 + 1] = r * Math.sin(theta) * Math.cos(phi);
      haloPos[p * 3 + 2] = r * Math.sin(phi);
    }

    haloParticleGeo.setAttribute("position", new THREE.BufferAttribute(haloPos, 3));

    const haloParticleMat = new THREE.PointsMaterial({
      color: new THREE.Color(isDark ? "#10b981" : "#0284c7"),
      size: 0.028,
      transparent: true,
      opacity: isDark ? 0.65 : 0.75,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
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
      rotVelX = 0;
      rotVelY = 0;
      pulseBoost = 2.0;
    };

    const onPointerMove = (e: PointerEvent) => {
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
        masterGroup.rotation.y += 0.0032; // Continuous smooth orbital spin
      }

      // Parallax Tilt
      if (!isDragging) {
        masterGroup.position.x += (targetTiltY * 0.35 - masterGroup.position.x) * 0.06;
        masterGroup.position.y = Math.sin(time * 1.2) * 0.06;
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
  }, [interactive, isDark]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center select-none cursor-grab active:cursor-grabbing",
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
