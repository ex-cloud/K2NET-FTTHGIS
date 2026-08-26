"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { VoxelTopology3D } from "@k2net/ui";

interface AiSpatialNetworkGraphicProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * AiSpatialNetworkGraphic
 * High-fidelity 3D Interactive Spatial Voxel Topology Core with Centralized
 * Modular Data Cube & 16 Radial Fiber Optic Beams matching the modern 3D benchmark.
 */
export function AiSpatialNetworkGraphic({
  className,
  size = "md",
}: AiSpatialNetworkGraphicProps) {
  return (
    <div className={cn("relative flex items-center justify-center select-none mx-auto", className)}>
      <VoxelTopology3D
        size={size}
        primaryColor="#38bdf8"
        accentColor="#0ea5e9"
        coreColor="#f8fafc"
        interactive={true}
      />
    </div>
  );
}
