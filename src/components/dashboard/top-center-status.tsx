"use client";

import { Globe } from "lucide-react";
import { useMapStore } from "@/store/map-store";

export function TopCenterStatus() {
  const { mapCenter } = useMapStore();

  const formatCoord = (val: number) => val.toFixed(4);

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-background/50 backdrop-blur-md border border-white/10 dark:border-white/5 rounded-full px-4 py-1.5 text-[10px] font-medium text-muted-foreground shadow-sm pointer-events-auto z-10">
      <span className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Systems Operational
      </span>
      <span className="h-3 w-px bg-border/50"></span>
      <span className="hidden sm:inline font-mono">
        Lat: {formatCoord(mapCenter.lat)}°, Long: {formatCoord(mapCenter.lng)}°
        (Z: {mapCenter.zoom.toFixed(1)})
      </span>
      <span className="h-3 w-px bg-border/50"></span>
      <div className="flex items-center gap-1">
        <Globe className="w-3 h-3" />
        <span>Network Topology Active</span>
      </div>
    </div>
  );
}
