import * as React from "react";
import { Map, Flame, PenTool, Radio, Compass, ExternalLink } from "lucide-react";

interface TenantMobileGisTabProps {
  onNavigate: (href: string) => void;
  onClose: () => void;
  projectId?: string;
}

export function TenantMobileGisTab({
  onNavigate,
  onClose,
  projectId = "proj-bdg-01",
}: TenantMobileGisTabProps) {
  const mapTools = [
    {
      title: "Peta Spasial MapLibre (GIS)",
      desc: "Visualisasi aset fiber, ODC, ODP, dan kabel",
      icon: Map,
      href: `/project/${projectId}/gis/topology`,
    },
    {
      title: "Optical Attenuation Heatmap",
      desc: "Pemetaan redaman optik dan coverage signal",
      icon: Flame,
      href: `/project/${projectId}/gis/heatmap`,
    },
    {
      title: "CAD Canvas Builder",
      desc: "Desain dan plotting jaringan FTTH baru",
      icon: PenTool,
      href: `/project/${projectId}/gis/canvas`,
    },
    {
      title: "Live OLT Telemetry",
      desc: "Monitoring status uplink OLT real-time",
      icon: Radio,
      href: `/project/${projectId}/core/olt`,
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-primary" />
          <span className="text-xs font-bold text-foreground">Akses Cepat Modul Spasial GIS</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
        {mapTools.map((tool, idx) => {
          const Icon = tool.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onNavigate(tool.href);
                onClose();
              }}
              className="flex items-center justify-between w-full p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary/20 transition-colors shrink-0">
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-col text-left truncate">
                  <span className="text-xs font-semibold text-foreground truncate">{tool.title}</span>
                  <span className="text-[11px] text-muted-foreground truncate">{tool.desc}</span>
                </div>
              </div>
              <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
