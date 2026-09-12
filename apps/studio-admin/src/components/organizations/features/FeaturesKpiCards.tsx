import { Card } from "@k2net/ui";
import { Map, Radio, MessageSquare, Sparkles } from "lucide-react";
import type { AdoptionStats } from "./types";

interface FeaturesKpiCardsProps {
  stats: AdoptionStats;
  totalOrgs: number;
}

export function FeaturesKpiCards({ stats, totalOrgs }: FeaturesKpiCardsProps) {
  return (
    <div className="px-4 md:px-6 shrink-0 animate-in fade-in-50 duration-150">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GIS Spatial Core */}
        <Card className="p-4 flex flex-col justify-between gap-3 bg-card/60 border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              GIS Spatial Core
            </span>
            <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Map className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                {Math.round((stats.gisCore / totalOrgs) * 100)}%
              </p>
              <span className="text-xs font-mono text-muted-foreground">
                {stats.gisCore}/{totalOrgs} Tenants
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Core map engine active</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(stats.gisCore / totalOrgs) * 100}%` }}
            />
          </div>
        </Card>

        {/* OLT Telemetry Poller */}
        <Card className="p-4 flex flex-col justify-between gap-3 bg-card/60 border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              OLT Telemetry Poller
            </span>
            <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Radio className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                {Math.round((stats.oltPoller / totalOrgs) * 100)}%
              </p>
              <span className="text-xs font-mono text-muted-foreground">
                {stats.oltPoller}/{totalOrgs} Tenants
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">SNMP &amp; SSH telemetry active</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(stats.oltPoller / totalOrgs) * 100}%` }}
            />
          </div>
        </Card>

        {/* WhatsApp Engine */}
        <Card className="p-4 flex flex-col justify-between gap-3 bg-card/60 border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              WhatsApp Engine
            </span>
            <div className="h-6 w-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <MessageSquare className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                {Math.round((stats.whatsapp / totalOrgs) * 100)}%
              </p>
              <span className="text-xs font-mono text-blue-500">
                {stats.whatsapp}/{totalOrgs} Tenants
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Automated billing notices</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(stats.whatsapp / totalOrgs) * 100}%` }}
            />
          </div>
        </Card>

        {/* AI Fiber Copilot */}
        <Card className="p-4 flex flex-col justify-between gap-3 bg-card/60 border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              AI Fiber Copilot
            </span>
            <div className="h-6 w-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                {Math.round((stats.aiCopilot / totalOrgs) * 100)}%
              </p>
              <span className="text-xs font-mono text-purple-500">
                {stats.aiCopilot}/{totalOrgs} Tenants
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Automated cable routing AI</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${(stats.aiCopilot / totalOrgs) * 100}%` }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
