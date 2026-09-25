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

interface TenantMobileHelpTabProps {
  onNavigate: (url: string) => void;
  onOpenAi: () => void;
  projectId?: string;
}

export function TenantMobileHelpTab({
  onNavigate,
  onOpenAi,
  projectId = "proj-bdg-01",
}: TenantMobileHelpTabProps) {
  const helpItems = [
    {
      title: "AI Network Copilot",
      desc: "Panduan cerdas topologi, parameter redaman, dan diagnosa jaringan FTTH.",
      icon: Sparkles,
      action: onOpenAi,
    },
    {
      title: "Standar Redaman Optik (ITU-T G.652D)",
      desc: "Batas toleransi loss serat optik, splicing loss (<0.05dB), dan connector (<0.3dB).",
      icon: Activity,
      action: () => onNavigate(`/project/${projectId}/issues/tickets`),
    },
    {
      title: "SOP Penarikan Kabel & FAT",
      desc: "Prosedur baku instalasi drop core, bending radius, dan tagging kode ODP.",
      icon: FileText,
      action: () => onNavigate(`/project/${projectId}/gis/canvas`),
    },
    {
      title: "Panduan Peta Spasial Web-GIS",
      desc: "Simulasi penarikan kabel baru, identifikasi rute tercepat, dan layer MVT.",
      icon: Map,
      action: () => onNavigate(`/project/${projectId}/gis/topology`),
    },
    {
      title: "Monitoring Telemetri OLT",
      desc: "Pemantauan uplink PON, status SFP temperatur, dan sinkronisasi poller.",
      icon: Radio,
      action: () => onNavigate(`/project/${projectId}/core/olt`),
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in-0 duration-200">
      {/* Header with Health Badge */}
      <div className="flex items-center justify-between p-3.5 border-b border-border/60 bg-muted/20">
        <span className="text-xs font-bold text-foreground">Help &amp; Support</span>
        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-medium flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          All systems operational
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
              Bantuan NOC Escalation 24/7
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Jika mengalami kendala routing gateway, anomali poller OLT, atau sinkronisasi database, hubungi tim NOC K2NET.
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
