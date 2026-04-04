"use client";

import React from "react";

interface HoveredFeature {
  code: string;
  type: string;
  status: string;
  x: number;
  y: number;
}

interface MapTooltipProps {
  feature: HoveredFeature | null;
}

/**
 * Lightweight tooltip that appears when hovering over map assets.
 * Uses data directly from MVT tile properties — NO additional API calls.
 * Positioned at the cursor location using CSS transform.
 */
export function MapTooltip({ feature }: MapTooltipProps) {
  if (!feature) return null;

  const statusColor = getStatusColor(feature.status);
  const typeLabel = getTypeLabel(feature.type);

  return (
    <div
      className="fixed z-[9999] pointer-events-none select-none"
      style={{
        left: feature.x + 12,
        top: feature.y - 12,
      }}
    >
      <div className="bg-background/95 backdrop-blur-md border border-border/60 rounded-lg shadow-2xl px-3 py-2.5 min-w-[140px] animate-in fade-in zoom-in-95 duration-150">
        {/* Type Badge */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
            {typeLabel}
          </span>
        </div>

        {/* Asset Code */}
        <div className="text-sm font-bold font-mono tracking-tight text-foreground leading-tight mb-1.5">
          {feature.code || "Unknown"}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ color: statusColor }}
          >
            {feature.status || "UNKNOWN"}
          </span>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  const s = (status || "").toUpperCase();
  if (["DOWN", "FIBERCUT", "BROKEN", "CRITICAL"].includes(s)) return "#ef4444";
  if (s === "MAINTENANCE") return "#f59e0b";
  if (["UP", "ACTIVE", "ONLINE"].includes(s)) return "#22c55e";
  return "#94a3b8";
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "OLT":
      return "Backbone / OLT";
    case "ODC":
      return "Distribution / ODC";
    case "ODP":
      return "Access / ODP";
    case "CUSTOMER":
      return "Customer";
    case "CABLE":
      return "Fiber Cable";
    default:
      return type || "Asset";
  }
}

export type { HoveredFeature };
