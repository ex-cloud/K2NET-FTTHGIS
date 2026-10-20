import * as React from "react";
import {
  Sparkles,
  FileText,
  Activity,
  PhoneCall,
  ExternalLink,
  ChevronRight,
  Radio,
  Map,
} from "lucide-react";
import { Badge, Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

interface TenantMobileHelpTabProps {
  onNavigate: (url: string) => void;
  onOpenAi: () => void;
  projectId?: string;
}

export function TenantMobileHelpTab({
  onNavigate,
  onOpenAi,
  projectId,
}: TenantMobileHelpTabProps) {
  const { t } = useTranslation();

  const helpItems = [
    {
      title: t("help.copilot_title", { defaultValue: "AI Network Copilot" }),
      desc: t("help.copilot_desc", { defaultValue: "Intelligent guidance for topology, attenuation parameters, and FTTH diagnostics." }),
      icon: Sparkles,
      action: onOpenAi,
    },
    {
      title: t("help.optical_standards_title", { defaultValue: "Optical Power Standards (ITU-T G.652D)" }),
      desc: t("help.optical_standards_desc", { defaultValue: "Fiber loss limits, splice loss (<0.05dB), and connector loss (<0.3dB)." }),
      icon: Activity,
      action: () => onNavigate(projectId ? `/project/${projectId}/issues/tickets` : "/projects"),
    },
    {
      title: t("help.sop_title", { defaultValue: "Cable Installation & FAT SOP" }),
      desc: t("help.sop_desc", { defaultValue: "Drop cable deployment standards, bending radius, and ODP tagging." }),
      icon: FileText,
      action: () => onNavigate(projectId ? `/project/${projectId}/gis/canvas` : "/projects"),
    },
    {
      title: t("help.gis_guide_title", { defaultValue: "Web-GIS Spatial Map Manual" }),
      desc: t("help.gis_guide_desc", { defaultValue: "Cable routing simulation, shortest path analysis, and MVT vector layers." }),
      icon: Map,
      action: () => onNavigate(projectId ? `/project/${projectId}/infrastructure/topology` : "/projects"),
    },
    {
      title: t("help.olt_telemetry_title", { defaultValue: "OLT Telemetry Monitoring" }),
      desc: t("help.olt_telemetry_desc", { defaultValue: "Real-time PON uplink monitoring, SFP temperature, and poller health." }),
      icon: Radio,
      action: () => onNavigate(projectId ? `/project/${projectId}/core/olt` : "/projects"),
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in-0 duration-200">
      {/* Header with Health Badge */}
      <div className="flex items-center justify-between p-3.5 border-b border-border/60 bg-muted/20">
        <span className="text-xs font-bold text-foreground">
          {t("common.help_support", { defaultValue: "Help & Support" })}
        </span>
        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-medium flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          {t("common.all_systems_operational", { defaultValue: "All systems operational" })}
        </Badge>
      </div>

      {/* Help Navigation Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {helpItems.map((item) => {
          const ItemIcon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              onClick={item.action}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/60 hover:bg-muted/60 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <ItemIcon className="size-4 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-relaxed">
                    {item.desc}
                  </span>
                </div>
              </div>
              <ChevronRight className="size-3.5 text-muted-foreground/60 shrink-0 group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          );
        })}

        {/* NOC Escalation 24/7 Banner */}
        <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">
              {t("help.noc_escalation_title", { defaultValue: "24/7 NOC Escalation Support" })}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {t("help.noc_escalation_desc", {
              defaultValue: "For gateway routing issues, poller telemetry anomalies, or database synchronization, reach out directly to the K2NET NOC team.",
            })}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open("https://wa.me/6281234567890", "_blank")}
              className="flex-1 h-7 text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1.5 cursor-pointer"
            >
              <PhoneCall className="size-3" /> WhatsApp NOC
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open("mailto:support@kdua.net", "_blank")}
              className="flex-1 h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
            >
              <ExternalLink className="size-3" /> support@kdua.net
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
