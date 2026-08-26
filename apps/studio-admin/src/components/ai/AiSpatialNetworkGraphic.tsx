"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { PebbleBot3D } from "@k2net/ui";

interface AiSpatialNetworkGraphicProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * AiSpatialNetworkGraphic
 * High-fidelity 3D Interactive AI Mascot (Pebble Bot Companion).
 * Ceramic pebble robot with responsive cursor gaze tracking, satellite ears, and LED eye line.
 */
export function AiSpatialNetworkGraphic({
  className,
  size = "md",
}: AiSpatialNetworkGraphicProps) {
  return (
    <div className={cn("relative flex items-center justify-center select-none mx-auto", className)}>
      <PebbleBot3D
        size={size}
        interactive={true}
      />
    </div>
  );
}
