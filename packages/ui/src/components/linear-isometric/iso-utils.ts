// ─── Math Helpers for True Isometric 30° Axonometric Projection ──────────────
export const COS30 = Math.cos(Math.PI / 6); // ~0.8660
export const SIN30 = Math.sin(Math.PI / 6); // 0.5

export function toIso(x: number, y: number, z: number, originX = 140, originY = 140) {
  const sx = originX + (x - y) * COS30;
  const sy = originY + (x + y) * SIN30 - z;
  return `${sx.toFixed(1)},${sy.toFixed(1)}`;
}

export interface LinearFigureProps {
  className?: string;
  isHovered?: boolean;
  size?: "card" | "hero";
  interactive?: boolean;
}

export interface IsometricFigureMeta {
  id: string;
  fig: string;
  tag: string;
  title: string;
  desc: string;
  component: React.ReactNode;
}
