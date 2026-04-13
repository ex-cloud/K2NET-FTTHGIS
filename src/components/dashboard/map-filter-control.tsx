"use client";

import React from "react";
import { useMapStore } from "@/store/map-store";
import { Layers, Zap, Hexagon, Component, Cable, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function MapFilterControl() {
  const { layerVisibility, setLayerVisibility } = useMapStore();

  const filters = [
    { id: "OLT", label: "Backbone (OLT)", icon: Zap, color: "text-emerald-500" },
    { id: "ODC", label: "Distribution (ODC)", icon: Hexagon, color: "text-blue-500" },
    { id: "ODP", label: "Access Node (ODP)", icon: Component, color: "text-cyan-500" },
    { id: "CUSTOMER", label: "Customer Premises", icon: Users, color: "text-purple-500" },
    { id: "CABLE", label: "Fiber Cables", icon: Cable, color: "text-slate-400" },
  ] as const;

  return (
    <div className="absolute top-4 right-16 z-30 pointer-events-auto">
      <div className="bg-zinc-950/90 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-4 w-60 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
          <Layers className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-black uppercase tracking-widest text-zinc-300">
            Layer Filters
          </span>
        </div>
        <div className="space-y-3">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isVisible = layerVisibility[filter.id as keyof typeof layerVisibility];

            return (
              <div key={filter.id} className="flex items-center justify-between">
                <Label
                  htmlFor={`filter-${filter.id}`}
                  className="flex items-center gap-2 text-[10px] w-full font-bold cursor-pointer hover:text-white transition-colors uppercase tracking-wider text-zinc-400"
                >
                  <Icon className={`w-3.5 h-3.5 ${filter.color}`} />
                  {filter.label}
                </Label>
                <Switch
                  id={`filter-${filter.id}`}
                  checked={isVisible}
                  onCheckedChange={(checked: boolean) =>
                    setLayerVisibility(filter.id as keyof typeof layerVisibility, checked)
                  }
                  className="scale-75 origin-right"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
