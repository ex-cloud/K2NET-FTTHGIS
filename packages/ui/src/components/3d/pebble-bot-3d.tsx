"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "../../utils";

export interface PebbleBot3DProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
}

export function PebbleBot3D({
  className,
  size = "md",
  interactive = true,
}: PebbleBot3DProps) {
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

    // ─── 1. Lights ──────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xfefce8, 1.4); // Soft warm ambient
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(5, 7, 6);
    scene.add(keyLight);

    const rimSky = new THREE.DirectionalLight(0x38bdf8, 2.0);
    rimSky.position.set(-6, -4, 4);
    scene.add(rimSky);

    const eyePointLight = new THREE.PointLight(0x38bdf8, 3.0, 5);
    eyePointLight.position.set(0, 0.1, 1.2);
    scene.add(eyePointLight);

    // ─── 2. Materials ───────────────────────────────────────────────────────
    // Matte Cream Ceramic Body
    const matCreamBody = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#fefae0"),
      roughness: 0.35,
      metalness: 0.05,
    });

    // Glossy Dark Glass Visor
    const matDarkVisor = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#090d16"),
      roughness: 0.1,
      metalness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    // Glowing Sky Blue LED Eyes
    const matEyeGlow = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#38bdf8"),
      emissive: new THREE.Color("#00f2fe"),
      emissiveIntensity: 3.5,
      roughness: 0.05,
    });

    // Satellite Ear Accent Ring
    const matEarGlow = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#38bdf8"),
      transparent: true,
      opacity: 0.8,
    });

    // ─── 3. Pebble Bot Head/Body ────────────────────────────────────────────
    const botGroup = new THREE.Group();
    masterGroup.add(botGroup);

    // Smooth Pebble Egg/Sphere Geometry
    const pebbleGeo = new THREE.SphereGeometry(1.25, 40, 36);
    // Deform into an organic smooth pebble (wider at base, cute rounded top)
    const posAttr = pebbleGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);

      // Slightly widen horizontal width and flatten front-to-back slightly
      posAttr.setX(i, vx * 1.08);
      posAttr.setY(i, vy * 0.98);
      posAttr.setZ(i, vz * 0.92);
    }
    pebbleGeo.computeVertexNormals();

    const bodyMesh = new THREE.Mesh(pebbleGeo, matCreamBody);
    botGroup.add(bodyMesh);

    // ─── 4. Glossy Curved Dark Glass Visor ──────────────────────────────────
    const visorGeo = new THREE.SphereGeometry(1.22, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.32);
    const visorMesh = new THREE.Mesh(visorGeo, matDarkVisor);
    visorMesh.rotation.x = Math.PI / 2;
    visorMesh.position.set(0, 0.08, 0.08);
    visorMesh.scale.set(0.72, 0.46, 0.82);
    botGroup.add(visorMesh);

    // ─── 5. Glowing Curved Blue LED Eye Line (Happy Visor Eyes) ─────────────
    const eyeGroup = new THREE.Group();
    botGroup.add(eyeGroup);
    eyeGroup.position.set(0, 0.08, 1.16);

    // Left Eye Arc (Happy smile curve `^`)
    const eyeCurveL = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.35, -0.04, 0),
      new THREE.Vector3(-0.22, 0.08, 0),
      new THREE.Vector3(-0.09, -0.04, 0)
    );
    const eyeGeoL = new THREE.TubeGeometry(eyeCurveL, 16, 0.032, 8, false);
    const eyeMeshL = new THREE.Mesh(eyeGeoL, matEyeGlow);
    eyeGroup.add(eyeMeshL);

    // Right Eye Arc (Happy smile curve `^`)
    const eyeCurveR = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0.09, -0.04, 0),
      new THREE.Vector3(0.22, 0.08, 0),
      new THREE.Vector3(0.35, -0.04, 0)
    );
    const eyeGeoR = new THREE.TubeGeometry(eyeCurveR, 16, 0.032, 8, false);
    const eyeMeshR = new THREE.Mesh(eyeGeoR, matEyeGlow);
    eyeGroup.add(eyeMeshR);

    // ─── 6. Two Floating Wireless Satellite Antenna Ears ────────────────────
    const earLGroup = new THREE.Group();
    masterGroup.add(earLGroup);
    earLGroup.position.set(-1.8, 0.35, 0);

    const earRGroup = new THREE.Group();
    masterGroup.add(earRGroup);
    earRGroup.position.set(1.8, 0.35, 0);

    const earGeo = new THREE.SphereGeometry(0.26, 24, 24);
    const earRingGeo = new THREE.TorusGeometry(0.38, 0.025, 16, 32);

    // Left Ear
    const earLMesh = new THREE.Mesh(earGeo, matCreamBody);
    earLGroup.add(earLMesh);
    const earLRing = new THREE.Mesh(earRingGeo, matEarGlow);
    earLRing.rotation.x = Math.PI / 3;
    earLGroup.add(earLRing);

    // Right Ear
    const earRMesh = new THREE.Mesh(earGeo, matCreamBody);
    earRGroup.add(earRMesh);
    const earRRing = new THREE.Mesh(earRingGeo, matEarGlow);
    earRRing.rotation.x = -Math.PI / 3;
    earRGroup.add(earRRing);

    // ─── 7. Ambient Stardust Sparkles ───────────────────────────────────────
    const dustCount = 180;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);

    for (let d = 0; d < dustCount; d++) {
      const r = 1.6 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      dustPos[d * 3]     = r * Math.cos(theta) * Math.cos(phi);
      dustPos[d * 3 + 1] = r * Math.sin(theta) * Math.cos(phi);
      dustPos[d * 3 + 2] = r * Math.sin(phi);
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: new THREE.Color("#38bdf8"),
      size: 0.035,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const dustCloud = new THREE.Points(dustGeo, dustMat);
    masterGroup.add(dustCloud);

    setIsLoaded(true);

    // ─── 8. Parallax, Gaze Tracking & Drag ───────────────────────────────────
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotVelX = 0;
    let rotVelY = 0;
    let gazeTargetX = 0;
    let gazeTargetY = 0;

    // Squish wobble spring
    let squishFactor = 1.0;
    let squishVel = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      squishVel = -0.32; // Happy bounce squish on click
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
        gazeTargetY = nx * 0.55;
        gazeTargetX = -ny * 0.45;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // ─── 9. Animation Loop ──────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Master Drag 360 Rotation + Inertia
      masterGroup.rotation.y += rotVelY;
      masterGroup.rotation.x += rotVelX;
      rotVelX *= 0.94;
      rotVelY *= 0.94;

      // Gaze Tracking (Pebble Bot head turns and looks at user cursor)
      if (!isDragging) {
        botGroup.rotation.y += (gazeTargetY - botGroup.rotation.y) * 0.08;
        botGroup.rotation.x += (gazeTargetX - botGroup.rotation.x) * 0.08;
        botGroup.rotation.z += ((-gazeTargetY * 0.25) - botGroup.rotation.z) * 0.06;
      }

      // Spring Squish Physics (Damped Harmonic Oscillator)
      const springK = 0.12;
      const damp = 0.88;
      const squishForce = (1.0 - squishFactor) * springK;
      squishVel = (squishVel + squishForce) * damp;
      squishFactor += squishVel;

      const scaleY = 1.0 * (2.0 - squishFactor);
      const scaleXZ = 1.0 * squishFactor;
      botGroup.scale.set(scaleXZ, scaleY, scaleXZ);

      // Body Floating Levitation
      masterGroup.position.y = Math.sin(time * 1.6) * 0.12;

      // Floating Satellite Antenna Ears (Independent Spring Levitation)
      earLGroup.position.y = 0.35 + Math.sin(time * 2.2 + 0.5) * 0.08;
      earLGroup.position.x = -1.8 - Math.sin(time * 1.4) * 0.04;
      earLRing.rotation.z += 0.02;

      earRGroup.position.y = 0.35 + Math.sin(time * 2.2 + 1.8) * 0.08;
      earRGroup.position.x = 1.8 + Math.sin(time * 1.4) * 0.04;
      earRRing.rotation.z -= 0.02;

      // Eye Glow Pulsing
      eyePointLight.intensity = 2.8 + Math.sin(time * 3.2) * 1.0;

      dustCloud.rotation.y -= 0.001;

      renderer.render(scene, camera);
    };
    animate();

    // ─── 10. Resize Observer ────────────────────────────────────────────────
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

    // ─── 11. Cleanup ────────────────────────────────────────────────────────
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
