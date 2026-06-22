"use client";

import React from "react";
import { Layers, Activity, Image as ImageIcon } from "lucide-react";
import { useMapStore, MapStyleMode } from "@/store/map-store";
import { cn } from "@/lib/utils";

interface StyleButtonProps {
  mode: MapStyleMode;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

function StyleButton({ icon: Icon, label, active, onClick }: StyleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
        active
          ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105"
          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50",
      )}
    >
      <Icon
        className={cn("w-3.5 h-3.5", active ? "text-white" : "text-zinc-400")}
      />
      <span>{label}</span>
    </button>
  );
}

export function MapStyleSelector() {
  const { mapStyle, setMapStyle } = useMapStore();

  return (
    <div className="absolute top-32 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-white/60 dark:bg-zinc-950/40 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/50 rounded-full p-1 shadow-xl z-20 pointer-events-auto">
      <StyleButton
        mode="base"
        icon={Layers}
        label="Base Map"
        active={mapStyle === "base"}
        onClick={() => setMapStyle("base")}
      />
      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
      <StyleButton
        mode="topology"
        icon={Activity}
        label="Topology View"
        active={mapStyle === "topology"}
        onClick={() => setMapStyle("topology")}
      />
      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
      <StyleButton
        mode="satellite"
        icon={ImageIcon}
        label="Satellite"
        active={mapStyle === "satellite"}
        onClick={() => setMapStyle("satellite")}
      />
    </div>
  );
}
