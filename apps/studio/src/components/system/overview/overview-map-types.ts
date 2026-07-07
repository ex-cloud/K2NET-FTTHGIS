import type React from "react";

/**
 * A sub-node is a small contextual chip that expands around a parent node when selected.
 */
export interface SubNode {
  id: string;
  name: string;
  details: string;
  icon: React.ComponentType<{ className?: string }>;
  xOffset: number; // pixel offset from parent center (X)
  yOffset: number; // pixel offset from parent center (Y)
}

/**
 * A logical connection line drawn between two parent nodes.
 */
export interface ParentConnection {
  from: string;
  to: string;
  dashed: boolean;
}
