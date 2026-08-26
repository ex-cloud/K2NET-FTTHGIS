"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "../../utils";

export interface VoxelTopology3DProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  primaryColor?: string;  // Sky Blue / Emerald
  accentColor?: string;   // Neon glow
  coreColor?: string;     // Porcelain white
  interactive?: boolean;
}

interface NodePoint {
  x: number;
  y: number;
  z: number;
  angle: number;
  dist: number;
}

export function VoxelTopology3D({
  className,
  size = "md",
  primaryColor = "#38bdf8",
  accentColor = "#0ea5e9",
  coreColor = "#f8fafc",
  interactive = true,
}: VoxelTopology3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const sizeStyles = {
    sm: "w-full max-w-[260px] h-[160px]",
    md: "w-full max-w-[340px] h-[210px]",
    lg: "w-full max-w-[420px] h-[260px]",
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 210;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.2);

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

    // Master Rotation Group (receives mouse parallax tilt)
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // ─── 1. Modular Voxel Data Cube (Center Core) ───────────────────────────
    const coreGroup = new THREE.Group();
    masterGroup.add(coreGroup);

    // Initial Isometric Tilt for the core cube
    coreGroup.rotation.x = 0.45;
    coreGroup.rotation.y = -0.55;

    // Materials
    const matWhite = new THREE.MeshStandardMaterial({
      color: new THREE.Color(coreColor),
      roughness: 0.2,
      metalness: 0.1,
    });
    const matSky = new THREE.MeshStandardMaterial({
      color: new THREE.Color(primaryColor),
      roughness: 0.3,
      metalness: 0.2,
    });
    const matGlow = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentColor),
      emissive: new THREE.Color(primaryColor),
      emissiveIntensity: 1.6,
      roughness: 0.1,
    });

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const voxelMeshes: { mesh: THREE.Mesh; origX: number; origY: number; origZ: number; speed: number }[] = [];

    // Construct a rich subdivided 3x3x3 voxel block structure with varied heights & colors
    const blockSize = 0.26;
    const gap = 0.035;
    const step = blockSize + gap;

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // Skip inner core center block to create hollow internal glow chamber
          if (x === 0 && y === 0 && z === 0) continue;

          // Determine voxel scale and material style
          const isCorner = Math.abs(x) === 1 && Math.abs(y) === 1 && Math.abs(z) === 1;
          const isCenterFace = (Math.abs(x) + Math.abs(y) + Math.abs(z)) === 1;

          let mat = matWhite;
          let scaleX = blockSize;
          let scaleY = blockSize;
          let scaleZ = blockSize;

          if (isCorner) {
            mat = matSky;
            scaleX *= 0.9;
            scaleY *= 0.9;
            scaleZ *= 0.9;
          } else if (isCenterFace) {
            mat = matGlow;
            scaleX *= 1.05;
            scaleY *= 1.05;
            scaleZ *= 1.05;
          } else if ((x + y + z) % 2 === 0) {
            mat = matSky;
          }

          const mesh = new THREE.Mesh(boxGeo, mat);
          const posX = x * step;
          const posY = y * step;
          const posZ = z * step;

          mesh.position.set(posX, posY, posZ);
          mesh.scale.set(scaleX, scaleY, scaleZ);
          coreGroup.add(mesh);

          voxelMeshes.push({
            mesh,
            origX: posX,
            origY: posY,
            origZ: posZ,
            speed: 1.5 + Math.random() * 2,
          });
        }
      }
    }

    // Inner glowing core energy orb inside the voxel cube
    const innerLightSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      matGlow
    );
    coreGroup.add(innerLightSphere);

    // ─── 2. 16 Perimeter Nodes & Radial Optical Fiber Rays ──────────────────
    const nodesGroup = new THREE.Group();
    masterGroup.add(nodesGroup);

    const nodeCount = 16;
    const nodePoints: NodePoint[] = [];

    // Spatial node layout around perimeter with varying distances and depths
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      // Organic elliptical perimeter radius (aspect ratio wider on X than Y)
      const baseRadiusX = 2.4;
      const baseRadiusY = 1.6;
      const variation = Math.sin(angle * 3) * 0.25 + Math.cos(angle * 2) * 0.15;
      
      const px = Math.cos(angle) * (baseRadiusX + variation);
      const py = Math.sin(angle) * (baseRadiusY + variation * 0.8);
      const pz = Math.sin(angle * 2) * 0.35; // 3D depth tilt

      nodePoints.push({ x: px, y: py, z: pz, angle, dist: Math.sqrt(px * px + py * py) });
    }

    // Create 16 Radial Fiber Ray Lines & Traveling Photons
    const photonMeshes: { mesh: THREE.Mesh; start: THREE.Vector3; end: THREE.Vector3; progress: number; speed: number }[] = [];
    const sphereGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const photonGeo = new THREE.SphereGeometry(0.035, 12, 12);
    const ringGeo = new THREE.RingGeometry(0.11, 0.14, 24);

    nodePoints.forEach((pt, idx) => {
      const startPos = new THREE.Vector3(0, 0, 0);
      const endPos = new THREE.Vector3(pt.x, pt.y, pt.z);

      // Ray line
      const lineGeo = new THREE.BufferGeometry().setFromPoints([startPos, endPos]);
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(primaryColor),
        transparent: true,
        opacity: 0.38,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      nodesGroup.add(line);

      // Endpoint Node Bead (White Porcelain / Sky Glow)
      const nodeMat = (idx % 2 === 0) ? matWhite : matSky;
      const nodeMesh = new THREE.Mesh(sphereGeo, nodeMat);
      nodeMesh.position.copy(endPos);
      nodesGroup.add(nodeMesh);

      // Concentric Orbit Ring around Node
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(accentColor),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(endPos);
      ringMesh.lookAt(0, 0, 10);
      nodesGroup.add(ringMesh);

      // Traveling Photon Light Packet
      const photonMesh = new THREE.Mesh(photonGeo, matGlow);
      nodesGroup.add(photonMesh);

      photonMeshes.push({
        mesh: photonMesh,
        start: startPos,
        end: endPos,
        progress: (idx / nodeCount),
        speed: 0.008 + (idx % 3) * 0.003,
      });
    });

    // ─── 3. Organic 3D Boundary Ribbon Contour ──────────────────────────────
    const curvePoints = nodePoints.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    curvePoints.push(curvePoints[0]); // Close the loop

    const boundaryCurve = new THREE.CatmullRomCurve3(curvePoints, true, "catmullrom", 0.5);
    const boundaryPoints = boundaryCurve.getPoints(120);
    const boundaryGeo = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
    const boundaryMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(primaryColor),
      transparent: true,
      opacity: 0.45,
    });
    const boundaryLine = new THREE.Line(boundaryGeo, boundaryMat);
    nodesGroup.add(boundaryLine);

    // ─── 4. Lights ──────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(new THREE.Color(primaryColor), 2.2);
    dirLight1.position.set(4, 5, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight2.position.set(-4, -3, 4);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(new THREE.Color(accentColor), 2.5, 6);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    setIsLoaded(true);

    // ─── 5. Mouse Parallax & Interaction ────────────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      targetRotY = nx * 0.45;
      targetRotX = -ny * 0.35;
      mouseX = nx;
      mouseY = ny;
    };

    if (interactive) {
      container.addEventListener("mousemove", onMouseMove);
    }

    // ─── 6. Animation Loop ──────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Master Parallax Smoothing
      masterGroup.rotation.y += (targetRotY - masterGroup.rotation.y) * 0.08;
      masterGroup.rotation.x += (targetRotX - masterGroup.rotation.x) * 0.08;

      // Master Floating Levitation (Breathing)
      masterGroup.position.y = Math.sin(time * 1.8) * 0.06;

      // Voxel Cube Internal Micro-rotation & Spring Pulse
      coreGroup.rotation.y += 0.005;
      coreGroup.rotation.x = 0.45 + Math.sin(time * 1.2) * 0.05;

      // Micro-bounce on individual voxels
      voxelMeshes.forEach((item, i) => {
        const pulse = Math.sin(time * item.speed + i) * 0.018;
        item.mesh.position.x = item.origX + (item.origX !== 0 ? Math.sign(item.origX) * pulse : 0);
        item.mesh.position.y = item.origY + (item.origY !== 0 ? Math.sign(item.origY) * pulse : 0);
        item.mesh.position.z = item.origZ + (item.origZ !== 0 ? Math.sign(item.origZ) * pulse : 0);
      });

      // Animate Traveling Photons along the 16 radial rays
      photonMeshes.forEach((p) => {
        p.progress = (p.progress + p.speed) % 1;
        p.mesh.position.lerpVectors(p.start, p.end, p.progress);
      });

      // Subtle undulation on outer boundary curve
      const posAttr = boundaryGeo.attributes.position;
      const bArray = posAttr.array as Float32Array;
      for (let j = 0; j < boundaryPoints.length; j++) {
        const idx = j * 3;
        const wave = Math.sin(time * 2 + j * 0.15) * 0.04;
        bArray[idx + 2] = boundaryPoints[j].z + wave;
      }
      posAttr.needsUpdate = true;

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

    // ─── 8. Clean up on unmount ─────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (interactive) {
        container.removeEventListener("mousemove", onMouseMove);
      }

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
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
