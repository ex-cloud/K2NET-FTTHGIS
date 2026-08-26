"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  VoxelTopology3D,
  CloudNetClay3D,
  AetherJelly3D,
  PebbleBot3D,
  FiberGlobe3D,
  CyberWaveform3D,
} from "@k2net/ui";
import { useUIStore, type Ai3DModelType } from "@/store/ui-store";

export type Ai3DMascotVariant = Ai3DModelType;

interface AiSpatialNetworkGraphicProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: Ai3DMascotVariant;
}

/**
 * AiSpatialNetworkGraphic
 * High-fidelity 3D Interactive AI Mascot & Graphic Renderer supporting all 6 curated concepts:
 * 1. "voxel": Voxel Data Matrix Cube with 16 Radial Fiber Beams
 * 2. "cloud": CloudNet Clay (Organic Metaball Cloud ala Cloudflare Agent Lee)
 * 3. "jelly": Aether Jelly (Biomorphic Fiber Jellyfish / Coral Node)
 * 4. "pebble": Pebble Bot (Cute Ceramic Companion with Floating Satellite Ears)
 * 5. "globe": 3D Fiber Earth Globe (Global FTTH GIS Network Telemetry)
 * 6. "waveform": Cyber Waveform Mesh (Parametric Optical Wave Surface Dynamics)
 */
export function AiSpatialNetworkGraphic({
  className,
  size = "md",
  variant,
}: AiSpatialNetworkGraphicProps) {
  const storeVariant = useUIStore((state) => state.aiMascotVariant);
  const activeVariant = variant || storeVariant || "voxel";

  return (
    <div className={cn("relative flex items-center justify-center select-none mx-auto", className)}>
      {activeVariant === "voxel" && (
        <VoxelTopology3D
          size={size}
          primaryColor="#38bdf8"
          accentColor="#00f2fe"
          coreColor="#f8fafc"
          interactive={true}
        />
      )}
      {activeVariant === "cloud" && (
        <CloudNetClay3D
          size={size}
          interactive={true}
        />
      )}
      {activeVariant === "jelly" && (
        <AetherJelly3D
          size={size}
          interactive={true}
        />
      )}
      {activeVariant === "pebble" && (
        <PebbleBot3D
          size={size}
          interactive={true}
        />
      )}
      {activeVariant === "globe" && (
        <FiberGlobe3D
          size={size}
          interactive={true}
        />
      )}
      {activeVariant === "waveform" && (
        <CyberWaveform3D
          size={size}
          interactive={true}
        />
      )}
    </div>
  );
}
