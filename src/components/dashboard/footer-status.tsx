"use client";

import { Globe } from "lucide-react";
import { useMapStore } from "@/store/map-store";

export function FooterStatus() {
  const { mapCenter } = useMapStore();

  return (
    <footer className="h-10 px-6 flex items-center justify-between bg-background/80 backdrop-blur border-t border-border/40 text-[10px] font-medium text-muted-foreground fixed bottom-0 left-0 right-0 z-50">
      <div className="flex gap-4 items-center">
        <span className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Core Engine: Synchronized
        </span>
        <span className="hidden sm:inline">
          LAT: {mapCenter.lat.toFixed(4)}°, LONG: {mapCenter.lng.toFixed(4)}°
        </span>
      </div>
      <div className="flex gap-4 uppercase tracking-widest hidden sm:flex">
        <span>© 2026 FTTH GIS v1.0.0</span>
      </div>
      <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded border border-border/50">
        <Globe className="w-3 h-3" />
        <span>Gis Data Active</span>
      </div>
    </footer>
  );
}
