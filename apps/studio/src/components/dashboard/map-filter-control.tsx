"use client";

import React from "react";
import { useMapStore } from "@/store/map-store";
import {
  Layers,
  Zap,
  Hexagon,
  Component,
  Cable,
  Users,
  ChevronDown,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function MapFilterControl() {
  const { layerVisibility, setLayerVisibility } = useMapStore();

  const filters = [
    {
      id: "OLT",
      label: "Backbone (OLT)",
      icon: Zap,
      color: "text-primary",
    },
    {
      id: "ODC",
      label: "Distribution (ODC)",
      icon: Hexagon,
      color: "text-blue-500",
    },
    {
      id: "ODP",
      label: "Access Node (ODP)",
      icon: Component,
      color: "text-cyan-500",
    },
    {
      id: "CUSTOMER",
      label: "Customer Premises",
      icon: Users,
      color: "text-purple-500",
    },
    {
      id: "CABLE",
      label: "Fiber Cables",
      icon: Cable,
      color: "text-slate-400",
    },
  ] as const;

  return (
    <div className="absolute top-[80px] right-4 z-30 pointer-events-auto w-[320px]">
      <div className="bg-background/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-4">
        <Collapsible defaultOpen={true}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-muted/50 transition-colors group">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Layer Filters</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-2 border-t border-border/10 space-y-4">
              {filters.map((filter) => {
                const Icon = filter.icon;
                const isVisible =
                  layerVisibility[filter.id as keyof typeof layerVisibility];

                return (
                  <div
                    key={filter.id}
                    className="flex items-center justify-between"
                  >
                    <Label
                      htmlFor={`filter-${filter.id}`}
                      className="flex items-center gap-2.5 text-[10px] w-full font-bold cursor-pointer hover:text-foreground transition-colors uppercase tracking-wider text-muted-foreground"
                    >
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-md bg-muted/30 ${filter.color}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      {filter.label}
                    </Label>
                    <Switch
                      id={`filter-${filter.id}`}
                      checked={isVisible}
                      onCheckedChange={(checked: boolean) =>
                        setLayerVisibility(
                          filter.id as keyof typeof layerVisibility,
                          checked,
                        )
                      }
                      className="scale-75 origin-right"
                    />
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
