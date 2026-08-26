import type React from "react";

/**
 * A sub-node is a small contextual chip that expands around a parent node when selected.
 */
export interface SubNode {
  id: string;
  name: string;
  details: string;
  icon: React.ComponentType<{ className?: string }>;
  xOffset: number; // pixel offset from parent center (X) — used for CSS calc() on HTML elements only
  yOffset: number; // pixel offset from parent center (Y) — used for CSS calc() on HTML elements only
}

/**
 * A logical connection line drawn between two parent nodes.
 */
export interface ParentConnection {
  from: string;
  to: string;
  dashed: boolean;
}

/**
 * Configuration for a single gateway orbit node that expands from the Go Gateways cluster.
 */
export interface GatewayOrbitNode {
  id: string;
  name: string;
  /** Docker service name used to match against GatewayServiceStatus[] */
  gatewayName: string;
  port: number;
  icon: React.ComponentType<{ className?: string }>;
  /** Angle in degrees: 0 = right, -90 = top, 90 = bottom, 180 = left */
  angle: number;
  /** Radius in pixels from orbit center (allows multi-ring concentric orbits) */
  radius?: number;
  /** IDs of parent nodes this orbit gateway connects to (for smart routing lines) */
  connectsTo: string[];
}
