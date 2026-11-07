import * as React from "react";
import { generateQrMatrix } from "./qr-generator";

export interface QrSvgProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrSvg({ value, size = 180, className = "" }: QrSvgProps) {
  const matrix = React.useMemo(() => {
    try {
      return generateQrMatrix(value);
    } catch {
      return [];
    }
  }, [value]);

  if (!matrix || matrix.length === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center bg-muted/40 rounded border border-border text-xs text-muted-foreground"
      >
        QR Unavailable
      </div>
    );
  }

  const matrixSize = matrix.length;
  // Add 4-module quiet zone border standard
  const quietZone = 4;
  const viewBoxSize = matrixSize + quietZone * 2;

  // Construct SVG path for all dark modules
  let pathD = "";
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        const x = c + quietZone;
        const y = r + quietZone;
        pathD += `M${x},${y}h1v1h-1z `;
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      width={size}
      height={size}
      className={`rounded bg-white p-1.5 shadow-sm ${className}`}
      shapeRendering="crispEdges"
      aria-label="TOTP QR Code"
    >
      <rect width="100%" height="100%" fill="#ffffff" />
      <path d={pathD} fill="#000000" />
    </svg>
  );
}

