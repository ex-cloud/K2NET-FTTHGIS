"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "../../utils";

export interface VoxelTopology3DProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  primaryColor?: string; // Sky Blue (#38bdf8)
  accentColor?: string;  // Glowing Neon Cyan (#00f2fe)
  coreColor?: string;    // Porcelain White (#f8fafc)
  interactive?: boolean;
}

export function VoxelTopology3D({
  className,
  size = "md",
  primaryColor = "#38bdf8",
  accentColor = "#00f2fe",
  coreColor = "#f8fafc",
  interactive = true,
}: VoxelTopology3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const sizeStyles = {
    sm: "w-[260px] h-[220px]",
    md: "w-[320px] h-[260px]",
    lg: "w-[420px] h-[340px]",
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 260;

    // Scene & Camera (calibrated FOV and distance to prevent any clipping)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0, 9.8);

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

    // Master Rotation Group (receives smooth mouse parallax tilt)
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // ─── 1. Lights Setup ────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.8);
    dirLight1.position.set(5, 8, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(new THREE.Color(primaryColor), 2.2);
    dirLight2.position.set(-6, -4, 5);
    scene.add(dirLight2);

    const corePointLight = new THREE.PointLight(new THREE.Color(accentColor), 4.5, 10);
    corePointLight.position.set(0, 0, 0);
    scene.add(corePointLight);

    // ─── 2. Materials (Porcelain White + Sky Blue + Glowing Cyan Neon) ───────
    const matWhite = new THREE.MeshStandardMaterial({
      color: new THREE.Color(coreColor),
      roughness: 0.18,
      metalness: 0.1,
    });

    const matSky = new THREE.MeshStandardMaterial({
      color: new THREE.Color(primaryColor),
      roughness: 0.25,
      metalness: 0.15,
    });

    const matDarkAccent = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#0284c7"),
      roughness: 0.3,
      metalness: 0.2,
    });

    const matNeonGlow = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentColor),
      emissive: new THREE.Color(accentColor),
      emissiveIntensity: 2.8,
      roughness: 0.05,
    });

    const matSoftGlow = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentColor),
      transparent: true,
      opacity: 0.85,
    });

    // ─── 3. High-Fidelity Isometric Voxel Data Core Cube ────────────────────
    const coreGroup = new THREE.Group();
    masterGroup.add(coreGroup);

    // Set genuine isometric perspective angles
    coreGroup.rotation.x = Math.PI / 6.2; // ~29°
    coreGroup.rotation.y = Math.PI / 4.0; // 45° corner facing camera

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const voxelMeshes: { mesh: THREE.Mesh; origX: number; origY: number; origZ: number; speed: number }[] = [];

    // Construct 3x3x3 modular voxel grid
    const bSize = 0.34;
    const gap = 0.042;
    const step = bSize + gap;

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue; // Hollow core chamber

          const isCorner = Math.abs(x) === 1 && Math.abs(y) === 1 && Math.abs(z) === 1;
          const isFaceCenter = (Math.abs(x) + Math.abs(y) + Math.abs(z)) === 1;

          let mat = matWhite;
          let sX = bSize;
          let sY = bSize;
          let sZ = bSize;

          if (isCorner) {
            mat = (x + y + z > 0) ? matSky : matDarkAccent;
            sX *= 0.94;
            sY *= 0.94;
            sZ *= 0.94;
          } else if (isFaceCenter) {
            mat = matNeonGlow;
            sX *= 1.04;
            sY *= 1.04;
            sZ *= 1.04;
          } else {
            // Edge blocks
            mat = ((x + y + z) % 2 === 0) ? matSky : matWhite;
          }

          const mesh = new THREE.Mesh(boxGeo, mat);
          const posX = x * step;
          const posY = y * step;
          const posZ = z * step;

          mesh.position.set(posX, posY, posZ);
          mesh.scale.set(sX, sY, sZ);
          coreGroup.add(mesh);

          voxelMeshes.push({
            mesh,
            origX: posX,
            origY: posY,
            origZ: posZ,
            speed: 1.8 + Math.random() * 1.5,
          });
        }
      }
    }

    // Glowing Neon Aperture Frames on the 3 visible isometric faces
    const apertureSize = bSize * 1.25;
    const apertureGeo = new THREE.RingGeometry(apertureSize * 0.32, apertureSize * 0.48, 4); // Diamond/Square ring

    // Top Face Aperture (+Y)
    const topAperture = new THREE.Mesh(apertureGeo, matSoftGlow);
    topAperture.position.set(0, step * 1.55, 0);
    topAperture.rotation.x = -Math.PI / 2;
    topAperture.rotation.z = Math.PI / 4;
    coreGroup.add(topAperture);

    // Front Right Face Aperture (+X)
    const rightAperture = new THREE.Mesh(apertureGeo, matSoftGlow);
    rightAperture.position.set(step * 1.55, 0, 0);
    rightAperture.rotation.y = Math.PI / 2;
    rightAperture.rotation.z = Math.PI / 4;
    coreGroup.add(rightAperture);

    // Front Left Face Aperture (+Z)
    const leftAperture = new THREE.Mesh(apertureGeo, matSoftGlow);
    leftAperture.position.set(0, 0, step * 1.55);
    leftAperture.rotation.z = Math.PI / 4;
    coreGroup.add(leftAperture);

    // Inner Glowing Core Sphere
    const innerLightOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 20, 20),
      matNeonGlow
    );
    coreGroup.add(innerLightOrb);

    // ─── 4. 16 Radial Fiber Beams & 16 Orbiting Data Beads ──────────────────
    const nodesGroup = new THREE.Group();
    masterGroup.add(nodesGroup);

    const nodeCount = 16;
    const nodeRadius = 2.65;
    const photonMeshes: { mesh: THREE.Mesh; start: THREE.Vector3; end: THREE.Vector3; progress: number; speed: number }[] = [];

    const sphereGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const photonGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const ringGeo = new THREE.RingGeometry(0.14, 0.18, 24);

    const nodePositions: THREE.Vector3[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      // Beautiful circular distribution with subtle depth variation
      const px = Math.cos(angle) * nodeRadius;
      const py = Math.sin(angle) * nodeRadius;
      const pz = Math.sin(angle * 2) * 0.25;

      const endPos = new THREE.Vector3(px, py, pz);
      const startPos = new THREE.Vector3(0, 0, 0);
      nodePositions.push(endPos);

      // Layer 1: Base Radial Laser Line
      const lineGeo = new THREE.BufferGeometry().setFromPoints([startPos, endPos]);
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(primaryColor),
        transparent: true,
        opacity: 0.55,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      nodesGroup.add(line);

      // Layer 2: Glowing Core Endpoint Bead (Porcelain White & Sky Blue)
      const beadMat = (i % 2 === 0) ? matWhite : matSky;
      const bead = new THREE.Mesh(sphereGeo, beadMat);
      bead.position.copy(endPos);
      nodesGroup.add(bead);

      // Layer 3: Concentric Neon Halo Ring around each bead
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(accentColor),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const halo = new THREE.Mesh(ringGeo, haloMat);
      halo.position.copy(endPos);
      halo.lookAt(0, 0, 10);
      nodesGroup.add(halo);

      // Layer 4: Traveling Photon Light Packet
      const photon = new THREE.Mesh(photonGeo, matNeonGlow);
      nodesGroup.add(photon);

      photonMeshes.push({
        mesh: photon,
        start: startPos,
        end: endPos,
        progress: (i / nodeCount),
        speed: 0.01 + (i % 4) * 0.003,
      });
    }

    // ─── 5. Glowing Outer Boundary Spherical Ribbon & Particle Cloud ─────────
    // A. Closed Spline Wave Ribbon
    const curvePoints = [...nodePositions, nodePositions[0]];
    const boundaryCurve = new THREE.CatmullRomCurve3(curvePoints, true, "catmullrom", 0.5);
    const boundaryPoints = boundaryCurve.getPoints(140);
    const boundaryGeo = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
    const boundaryMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(accentColor),
      transparent: true,
      opacity: 0.65,
    });
    const boundaryLine = new THREE.Line(boundaryGeo, boundaryMat);
    nodesGroup.add(boundaryLine);

    // B. Ambient Nebula Particles (600 glowing dust points on the outer shell)
    const particleCount = 450;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount; p++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.8;
      const r = nodeRadius * (0.95 + Math.random() * 0.25);

      particlePositions[p * 3]     = r * Math.cos(theta) * Math.cos(phi);
      particlePositions[p * 3 + 1] = r * Math.sin(theta) * Math.cos(phi);
      particlePositions[p * 3 + 2] = r * Math.sin(phi) * 0.8;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color(accentColor),
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particleCloud = new THREE.Points(particleGeo, particleMat);
    nodesGroup.add(particleCloud);

    setIsLoaded(true);

    // ─── 6. Mouse Parallax & Gyroscopic Tracking ────────────────────────────
    let targetRotY = 0;
    let targetRotX = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      targetRotY = nx * 0.55;
      targetRotX = -ny * 0.4;
    };

    if (interactive) {
      container.addEventListener("mousemove", onMouseMove);
    }

    // ─── 7. Animation Loop (60-120 FPS) ─────────────────────────────────────
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Master Parallax Smoothing
      masterGroup.rotation.y += (targetRotY - masterGroup.rotation.y) * 0.08;
      masterGroup.rotation.x += (targetRotX - masterGroup.rotation.x) * 0.08;

      // Master Floating Levitation (Breathing)
      masterGroup.position.y = Math.sin(time * 1.6) * 0.08;

      // Voxel Cube Internal Micro-rotation & Aperture Pulse
      coreGroup.rotation.y += 0.004;
      coreGroup.rotation.x = Math.PI / 6.2 + Math.sin(time * 1.2) * 0.04;

      // Pulse the apertures and point light
      const pulseIntensity = 3.5 + Math.sin(time * 3) * 1.2;
      corePointLight.intensity = pulseIntensity;

      // Dynamic Spring Bounce on individual voxels
      voxelMeshes.forEach((item, i) => {
        const pulse = Math.sin(time * item.speed + i * 0.4) * 0.022;
        item.mesh.position.x = item.origX + (item.origX !== 0 ? Math.sign(item.origX) * pulse : 0);
        item.mesh.position.y = item.origY + (item.origY !== 0 ? Math.sign(item.origY) * pulse : 0);
        item.mesh.position.z = item.origZ + (item.origZ !== 0 ? Math.sign(item.origZ) * pulse : 0);
      });

      // Animate Traveling Photons along the 16 radial rays
      photonMeshes.forEach((p) => {
        p.progress = (p.progress + p.speed) % 1;
        p.mesh.position.lerpVectors(p.start, p.end, p.progress);
      });

      // Ambient Particle Cloud Rotation
      particleCloud.rotation.z += 0.0015;

      // Subtle Undulation on Outer Boundary Curve
      const posAttr = boundaryGeo.attributes.position;
      const bArray = posAttr.array as Float32Array;
      for (let j = 0; j < boundaryPoints.length; j++) {
        const idx = j * 3;
        const wave = Math.sin(time * 2.2 + j * 0.18) * 0.05;
        bArray[idx + 2] = boundaryPoints[j].z + wave;
      }
      posAttr.needsUpdate = true;

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

    // ─── 9. Clean up on unmount ─────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (interactive) {
        container.removeEventListener("mousemove", onMouseMove);
      }

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
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
  }, [accentColor, coreColor, interactive, primaryColor]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center select-none mx-auto overflow-hidden",
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
