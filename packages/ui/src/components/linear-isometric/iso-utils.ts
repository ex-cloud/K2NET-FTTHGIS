// ─── Math Helpers for True Isometric 30° Axonometric Projection ──────────────
export const COS30 = Math.cos(Math.PI / 6); // ~0.8660
export const SIN30 = Math.sin(Math.PI / 6); // 0.5

export function toIso(x: number, y: number, z: number, originX = 140, originY = 140) {
  const sx = originX + (x - y) * COS30;
  const sy = originY + (x + y) * SIN30 - z;
  return `${sx.toFixed(1)},${sy.toFixed(1)}`;
}

export function toIsoPt(x: number, y: number, z: number, originX = 140, originY = 140) {
  return {
    x: originX + (x - y) * COS30,
    y: originY + (x + y) * SIN30 - z,
  };
}

/**
 * Returns an SVG path string for a 3D isometric rectangle with rounded corner bevels.
 */
export function isoRoundedRectPath(
  cx: number,
  cy: number,
  w: number,
  h: number,
  z: number,
  r: number,
  originX = 140,
  originY = 140
) {
  const x1 = cx - w / 2;
  const x2 = cx + w / 2;
  const y1 = cy - h / 2;
  const y2 = cy + h / 2;
  const rad = Math.min(r, w / 2 - 0.5, h / 2 - 0.5);

  const p1 = toIsoPt(x1 + rad, y1, z, originX, originY);
  const p2 = toIsoPt(x2 - rad, y1, z, originX, originY);
  const c2 = toIsoPt(x2, y1, z, originX, originY);
  const p3 = toIsoPt(x2, y1 + rad, z, originX, originY);
  const p4 = toIsoPt(x2, y2 - rad, z, originX, originY);
  const c3 = toIsoPt(x2, y2, z, originX, originY);
  const p5 = toIsoPt(x2 - rad, y2, z, originX, originY);
  const p6 = toIsoPt(x1 + rad, y2, z, originX, originY);
  const c4 = toIsoPt(x1, y2, z, originX, originY);
  const p7 = toIsoPt(x1, y2 - rad, z, originX, originY);
  const p8 = toIsoPt(x1, y1 + rad, z, originX, originY);
  const c1 = toIsoPt(x1, y1, z, originX, originY);

  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} Q ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p3.x.toFixed(1)} ${p3.y.toFixed(1)} L ${p4.x.toFixed(1)} ${p4.y.toFixed(1)} Q ${c3.x.toFixed(1)} ${c3.y.toFixed(1)} ${p5.x.toFixed(1)} ${p5.y.toFixed(1)} L ${p6.x.toFixed(1)} ${p6.y.toFixed(1)} Q ${c4.x.toFixed(1)} ${c4.y.toFixed(1)} ${p7.x.toFixed(1)} ${p7.y.toFixed(1)} L ${p8.x.toFixed(1)} ${p8.y.toFixed(1)} Q ${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Z`;
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
