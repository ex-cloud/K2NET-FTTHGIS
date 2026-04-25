"use client";

import React from "react";

export interface HoveredFeature {
  code: string;
  type: string;
  status: string;
  health_status?: string; // MVT property names often use snake_case
  healthStatus?: string;  // Just in case
  x: number;
  y: number;
}

interface MapTooltipProps {
  feature: HoveredFeature | null;
}

/**
 * Lightweight tooltip that appears when hovering over map assets.
 * Uses data directly from MVT tile properties — NO additional API calls.
 */
export function MapTooltip({ feature }: MapTooltipProps) {
  if (!feature) return null;

  const hStatus = (feature.health_status || feature.healthStatus || "UP").toUpperCase();
  const lStatus = (feature.status || "PLAN").toUpperCase();
  
  const healthColor = getHealthColor(hStatus);
  const lifecycleColor = getLifecycleColor(lStatus);
  const typeLabel = getTypeLabel(feature.type);

  return (
    <div
      className="fixed z-9999 pointer-events-none select-none"
      style={{
        left: feature.x + 12,
        top: feature.y - 12,
      }}
    >
      <div className="bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] px-4 py-3 min-w-[180px] animate-in fade-in zoom-in-95 duration-150">
        {/* Type & Code */}
        <div className="flex flex-col mb-3">
          <span className="text-[9px] font-black tracking-[0.2em] text-zinc-500 uppercase mb-0.5">
            {typeLabel}
          </span>
          <span className="text-sm font-black font-mono tracking-tight text-white">
            {feature.code || "Unknown"}
          </span>
        </div>

        <div className="space-y-2">
          {/* Health Status (Operation) */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[9px] font-bold text-zinc-400 uppercase">Health</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${hStatus === 'DOWN' || hStatus === 'BROKEN' ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: healthColor }}
              />
              <span className="text-[10px] font-black uppercase" style={{ color: healthColor }}>
                {hStatus}
              </span>
            </div>
          </div>

          {/* Lifecycle Status (Admin) */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[9px] font-bold text-zinc-400 uppercase">Status</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white/5 border border-white/5" style={{ color: lifecycleColor }}>
              {lStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getHealthColor(status: string): string {
  switch (status) {
    case "UP": return "#22c55e"; // Green
    case "DEGRADED": return "#f59e0b"; // Yellow/Orange
    case "DOWN": return "#ef4444"; // Red
    case "BROKEN": return "#7f1d1d"; // Dark Red
    default: return "#94a3b8";
  }
}

function getLifecycleColor(status: string): string {
  switch (status) {
    case "PLAN": return "#94a3b8"; // Slate
    case "DEPLOYING": return "#3b82f6"; // Blue
    case "ACTIVE": return "#22c55e"; // Green
    case "MAINTENANCE": return "#eab308"; // Yellow
    case "RETIRED": return "#18181b"; // Zinc-900
    default: return "#94a3b8";
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "OLT": return "Backbone OLT";
    case "ODC": return "Distribution ODC";
    case "ODP": return "Access Point ODP";
    case "CUSTOMER": return "Subscriber";
    case "CABLE": return "Fiber Link";
    default: return type || "Network Asset";
  }
}
