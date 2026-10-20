import * as React from "react";
import { Map, Flame, PenTool, Radio, Compass, ExternalLink } from "lucide-react";
import { useTranslation } from "@k2net/i18n";

interface TenantMobileGisTabProps {
  onNavigate: (href: string) => void;
  onClose: () => void;
  projectId?: string;
}

export function TenantMobileGisTab({
  onNavigate,
  onClose,
  projectId,
}: TenantMobileGisTabProps) {
  const { t } = useTranslation();

  const mapTools = [
    {
      title: t("gis.map_title", { defaultValue: "GIS Spatial Map" }),
      desc: t("gis.map_subtitle", { defaultValue: "Fiber asset visualization, ODC, ODP, and cables" }),
      icon: Map,
      href: projectId ? `/project/${projectId}/infrastructure/topology` : "/projects",
    },
    {
      title: t("gis.heatmap_title", { defaultValue: "Optical Attenuation Heatmap" }),
      desc: t("gis.heatmap_subtitle", { defaultValue: "Optical signal attenuation and coverage mapping" }),
      icon: Flame,
      href: projectId ? `/project/${projectId}/gis/heatmap` : "/projects",
    },
    {
      title: t("gis.canvas_builder_title", { defaultValue: "CAD Canvas Designer" }),
      desc: t("gis.canvas_builder_subtitle", { defaultValue: "Design and plot new FTTH network routes" }),
      icon: PenTool,
      href: projectId ? `/project/${projectId}/gis/canvas` : "/projects",
    },
    {
      title: t("inventory.telemetry_title", { defaultValue: "Live OLT Telemetry" }),
      desc: t("inventory.olt_subtitle", { defaultValue: "Real-time GPON / EPON uplink monitoring" }),
      icon: Radio,
      href: projectId ? `/project/${projectId}/core/olt` : "/projects",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-primary" />
          <span className="text-xs font-bold text-foreground">
            {t("gis.quick_access_gis", { defaultValue: "GIS Spatial Quick Access" })}
          </span>
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
