"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  VoxelTopology3D,
  CloudNetClay3D,
  AetherJelly3D,
  AstrolabeCore3D,
  PrismOrigami3D,
  PebbleBot3D,
} from "@k2net/ui";
import { useUIStore, type Ai3DMascotType } from "@/store/ui-store";

export type Ai3DMascotVariant = Ai3DMascotType;

interface AiSpatialNetworkGraphicProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: Ai3DMascotVariant;
}

/**
 * AiSpatialNetworkGraphic
 * High-fidelity 3D Interactive AI Mascot Renderer supporting all 6 distinct concepts:
 * 1. "voxel": Voxel Data Matrix Cube with 16 Radial Fiber Beams
 * 2. "cloud": CloudNet Clay (Organic Metaball Cloud ala Cloudflare Agent Lee)
 * 3. "jelly": Aether Jelly (Biomorphic Fiber Jellyfish / Coral Node)
 * 4. "astrolabe": Astrolabe Core (Kinetic Multi-Axis Iridescent Rings)
 * 5. "prism": Prism Origami (Floating Crystal Shards Gateway)
 * 6. "pebble": Pebble Bot (Cute Ceramic Companion with Floating Satellite Ears)
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
      {activeVariant === "astrolabe" && (
        <AstrolabeCore3D
          size={size}
          interactive={true}
        />
      )}
      {activeVariant === "prism" && (
        <PrismOrigami3D
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
    </div>
  );
}
