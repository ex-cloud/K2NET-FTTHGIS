"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "../../utils";

export interface PrismOrigami3DProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
}

export function PrismOrigami3D({
  className,
  size = "md",
  interactive = true,
}: PrismOrigami3DProps) {
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

    // Master Group (Isometric view)
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);
    masterGroup.rotation.x = Math.PI / 7;
    masterGroup.rotation.y = Math.PI / 4.5;

    // ─── 1. Lights ──────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xf8fafc, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.8);
    dirLight1.position.set(6, 9, 7);
    scene.add(dirLight1);

    // Rainbow / Iridescent Dispersion Rim Lights
    const rimCyan = new THREE.DirectionalLight(0x00f2fe, 2.2);
    rimCyan.position.set(-6, -4, 4);
    scene.add(rimCyan);

    const rimMagenta = new THREE.DirectionalLight(0xf472b6, 1.8);
    rimMagenta.position.set(4, -6, -4);
    scene.add(rimMagenta);

    const coreLight = new THREE.PointLight(0x38bdf8, 4.0, 8);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    // ─── 2. Materials ───────────────────────────────────────────────────────
    // Polished Porcelain White Ceramic
    const matCeramic = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#f8fafc"),
      roughness: 0.15,
      metalness: 0.1,
    });

    // Frosted Crystal Glass with Rainbow Transmission
    const matCrystalGlass = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#e0f2fe"),
      transmission: 0.88,
      opacity: 0.92,
      transparent: true,
      roughness: 0.08,
      ior: 1.55,
      thickness: 0.6,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    // Glowing Neon Blue Energy Matrix Core
    const matEnergyGlow = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#00f2fe"),
      emissive: new THREE.Color("#38bdf8"),
      emissiveIntensity: 3.0,
      roughness: 0.05,
    });

    const matEnergyBeam = new THREE.LineBasicMaterial({
      color: new THREE.Color("#00f2fe"),
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    // ─── 3. Floating Origami Crystal Shards & Energy Beams ──────────────────
    const shardsGroup = new THREE.Group();
    masterGroup.add(shardsGroup);

    // Shard Definitions (Positions & Geometric Forms)
    const shardConfigs = [
      // Central Main Prism (Octahedron)
      { type: "octa", pos: [0, 0, 0], scale: 0.95, mat: "glass", speed: 1.2, rot: [0, 0, 0] },
      // Surrounding Satellite Shards (Tetrahedrons & Pyramids)
      { type: "tetra", pos: [-1.2, 0.8, 0.4], scale: 0.55, mat: "ceramic", speed: 1.5, rot: [0.4, 0.2, 0.6] },
      { type: "tetra", pos: [1.3, 0.7, -0.3], scale: 0.58, mat: "glass", speed: 1.4, rot: [-0.3, 0.5, 0.2] },
      { type: "octa", pos: [0.2, -1.2, 0.6], scale: 0.52, mat: "ceramic", speed: 1.7, rot: [0.5, -0.4, 0.3] },
      { type: "tetra", pos: [-1.1, -0.8, -0.5], scale: 0.48, mat: "glass", speed: 1.6, rot: [0.2, 0.6, -0.4] },
      { type: "pyra", pos: [1.4, -0.6, 0.5], scale: 0.46, mat: "ceramic", speed: 1.8, rot: [-0.4, 0.3, 0.7] },
      { type: "pyra", pos: [-0.3, 1.4, -0.6], scale: 0.44, mat: "glass", speed: 1.3, rot: [0.6, -0.2, 0.5] },
      { type: "tetra", pos: [0.0, 0.0, 1.3], scale: 0.42, mat: "ceramic", speed: 1.9, rot: [0.3, 0.4, -0.5] },
      { type: "tetra", pos: [0.0, 0.0, -1.3], scale: 0.42, mat: "glass", speed: 1.5, rot: [-0.5, 0.2, 0.4] },
    ];

    const octaGeo = new THREE.OctahedronGeometry(1, 0);
    const tetraGeo = new THREE.TetrahedronGeometry(1, 0);
    const pyraGeo = new THREE.ConeGeometry(0.8, 1.2, 4);

    const shardMeshes: {
      mesh: THREE.Mesh;
      origPos: THREE.Vector3;
      speed: number;
      rotSpeed: THREE.Vector3;
    }[] = [];

    shardConfigs.forEach((cfg) => {
      let geo: THREE.BufferGeometry = octaGeo;
      if (cfg.type === "tetra") geo = tetraGeo;
      else if (cfg.type === "pyra") geo = pyraGeo;

      const mat = cfg.mat === "glass" ? matCrystalGlass : matCeramic;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      mesh.scale.setScalar(cfg.scale);
      mesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      shardsGroup.add(mesh);

      shardMeshes.push({
        mesh,
        origPos: new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]),
        speed: cfg.speed,
        rotSpeed: new THREE.Vector3(0.005 * cfg.speed, 0.008 * cfg.speed, 0.004 * cfg.speed),
      });
    });

    // Central Floating Energy Matrix Core (Inner glowing diamond)
    const energyCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), matEnergyGlow);
    shardsGroup.add(energyCore);

    // ─── 4. Interconnecting Laser Energy Beams ──────────────────────────────
    const beamLines: { line: THREE.Line; startIdx: number; endIdx: number }[] = [];
    const beamPairs = [
      [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8],
      [1, 2], [2, 5], [5, 3], [3, 4], [4, 1], [6, 1], [6, 2],
    ];

    beamPairs.forEach(([a, b]) => {
      const p1 = shardMeshes[a].origPos;
      const p2 = shardMeshes[b].origPos;
      const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const line = new THREE.Line(geo, matEnergyBeam);
      shardsGroup.add(line);
      beamLines.push({ line, startIdx: a, endIdx: b });
    });

    // ─── 5. Ambient Rainbow Refraction Stardust ──────────────────────────────
    const starCount = 240;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);

    for (let p = 0; p < starCount; p++) {
      const r = 1.2 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      starPos[p * 3]     = r * Math.cos(theta) * Math.cos(phi);
      starPos[p * 3 + 1] = r * Math.sin(theta) * Math.cos(phi);
      starPos[p * 3 + 2] = r * Math.sin(phi);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: new THREE.Color("#38bdf8"),
      size: 0.038,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeo, starMat);
    masterGroup.add(starField);

    setIsLoaded(true);

    // ─── 6. Parallax & Drag Interaction ─────────────────────────────────────
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotVelX = 0;
    let rotVelY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let expandFactor = 1.0;

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      expandFactor = 1.45; // Micro-explosion expansion on click
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
        targetTiltX = -ny * 0.4;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // ─── 7. Animation Loop ──────────────────────────────────────────────────
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

      expandFactor += (1.0 - expandFactor) * 0.06;

      // Pulse Core Matrix Light
      coreLight.intensity = (3.5 + Math.sin(time * 3.5) * 1.5) * expandFactor;
      energyCore.rotation.y += 0.02;
      energyCore.rotation.x += 0.015;

      // Floating Shards Oscillation & Micro-Rotation
      shardMeshes.forEach((s, idx) => {
        const floatY = Math.sin(time * s.speed + idx * 0.8) * 0.08;
        const currentExpansion = idx === 0 ? 1.0 : expandFactor;

        s.mesh.position.x = s.origPos.x * currentExpansion;
        s.mesh.position.y = (s.origPos.y + floatY) * currentExpansion;
        s.mesh.position.z = s.origPos.z * currentExpansion;

        s.mesh.rotation.x += s.rotSpeed.x;
        s.mesh.rotation.y += s.rotSpeed.y;
        s.mesh.rotation.z += s.rotSpeed.z;
      });

      // Update Laser Energy Beams connecting the shards
      beamLines.forEach((b) => {
        const pA = shardMeshes[b.startIdx].mesh.position;
        const pB = shardMeshes[b.endIdx].mesh.position;
        const posAttr = b.line.geometry.attributes.position;
        const arr = posAttr.array as Float32Array;

        arr[0] = pA.x; arr[1] = pA.y; arr[2] = pA.z;
        arr[3] = pB.x; arr[4] = pB.y; arr[5] = pB.z;
        posAttr.needsUpdate = true;
      });

      starField.rotation.y -= 0.0012;

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
