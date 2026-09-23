import * as React from "react";
import { Activity, Layers, Users, Network, HardDrive } from "lucide-react";
import { Card, Progress } from "@k2net/ui";
import { type Project } from "../../hooks/useProjects";

interface ProjectUsageWidgetProps {
  projects: Project[];
}

export function ProjectUsageWidget({ projects }: ProjectUsageWidgetProps) {
  const totalSubscribers = projects.reduce((acc, p) => acc + (p.totalSubscribers || 0), 0);
  const totalCableKm = projects.reduce((acc, p) => acc + (p.cableLengthKm || 0), 0);
  const totalOdc = projects.reduce((acc, p) => acc + (p.odcCount || 0), 0);
  const totalOdp = projects.reduce((acc, p) => acc + (p.odpCount || 0), 0);

  const subscriberQuota = 10000;
  const projectQuota = 10;
  const subscriberPercent = Math.min(100, Math.round((totalSubscribers / subscriberQuota) * 100));
  const projectPercent = Math.min(100, Math.round((projects.length / projectQuota) * 100));

  return (
    <Card className="p-4 border-border/60 bg-card/80 backdrop-blur-xs shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-foreground">Pemakaian Kuota Organisasi</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          PRO PLAN
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Project Quota */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              Proyek Aktif
            </span>
            <span className="font-mono font-bold text-foreground">
              {projects.length} / {projectQuota}
            </span>
          </div>
          <Progress value={projectPercent} className="h-1.5" />
          <span className="text-[10px] text-muted-foreground block text-right font-mono">
            {projectPercent}% terpakai
          </span>
        </div>

        {/* Subscriber Quota */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              Total Pelanggan
            </span>
            <span className="font-mono font-bold text-foreground">
              {totalSubscribers.toLocaleString()} / {subscriberQuota.toLocaleString()}
            </span>
          </div>
          <Progress value={subscriberPercent} className="h-1.5" />
          <span className="text-[10px] text-muted-foreground block text-right font-mono">
            {subscriberPercent}% terpakai
          </span>
        </div>

        {/* Cable Metric */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/40 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Network className="h-3.5 w-3.5 text-muted-foreground" />
              Total Bentang Kabel
            </span>
            <span className="text-sm font-bold font-mono text-foreground">
              {totalCableKm.toFixed(1)} Km
            </span>
          </div>
          <span className="text-[10px] text-primary font-mono">
            Mapped GIS
          </span>
        </div>

        {/* Enclosure Metric */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/40 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
              Total ODC / ODP
            </span>
            <span className="text-sm font-bold font-mono text-foreground">
              {totalOdc} ODC / {totalOdp} ODP
            </span>
          </div>
          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">
            Online
          </span>
        </div>
      </div>
    </Card>
  );
}
