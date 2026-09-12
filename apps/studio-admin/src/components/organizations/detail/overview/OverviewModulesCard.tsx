import { Badge, Card } from "@k2net/ui";
import { Database, Radio, Activity, Cpu, Zap } from "lucide-react";
import type { EnrichedOrganization } from "../../types";
import { cn } from "@/lib/utils";

interface OverviewModulesCardProps {
  org: EnrichedOrganization;
}

export function OverviewModulesCard({ org }: OverviewModulesCardProps) {
  const activeCount = Object.values(org.featureFlags || {}).filter(Boolean).length;

  return (
    <Card className="lg:col-span-2 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
            B2B Module Entitlements &amp; Feature Flags
          </h4>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono px-1.5 py-0.2">
            {activeCount} of 5 Active
          </Badge>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          Instant Tenant Sync
        </span>
      </div>

      <div className="space-y-2.5">
        {/* GIS Core */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 border border-border/50 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Database className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">GIS Spatial Mapping Core</span>
                <Badge variant="outline" className="border-border text-[9px] font-mono px-1 py-0">CORE</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                PostGIS spatial rendering, ODC/ODP splitters, dan fiber cable route tracing.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px]">
            ENABLED
          </Badge>
        </div>

        {/* OLT Poller */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 border border-border/50 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
              <Radio className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Dedicated SNMP OLT Poller</span>
                <Badge variant="outline" className="border-border text-[9px] font-mono px-1 py-0">DAEMON</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Background SNMP daemon polling live optical RX/TX power dan ONT alarms.
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-[10px]",
              org.featureFlags?.oltPoller
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-muted text-muted-foreground"
            )}
          >
            {org.featureFlags?.oltPoller ? "ENABLED" : "DISABLED"}
          </Badge>
        </div>

        {/* WhatsApp Engine */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 border border-border/50 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">WhatsApp &amp; SMS Gateway Engine</span>
                <Badge variant="outline" className="border-border text-[9px] font-mono px-1 py-0">GATEWAY</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Notifikasi tagihan invoice otomatis, blast broadcast tiket, dan SMS OTP via port 5001.
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-[10px]",
              org.featureFlags?.whatsappEngine
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-muted text-muted-foreground"
            )}
          >
            {org.featureFlags?.whatsappEngine ? "ENABLED" : "DISABLED"}
          </Badge>
        </div>

        {/* AI Copilot */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 border border-border/50 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
              <Cpu className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">AI Fiber Copilot &amp; Diagnostics</span>
                <Badge variant="outline" className="border-border text-[9px] font-mono px-1 py-0">AI ADD-ON</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Analisis kerusakan kabel fiber optik otomatis dan asisten troubleshooting NOC cerdas.
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-[10px]",
              org.featureFlags?.aiCopilot
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-muted text-muted-foreground"
            )}
          >
            {org.featureFlags?.aiCopilot ? "ENABLED" : "TIER LOCKED"}
          </Badge>
        </div>

        {/* Sandbox Mode */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 border border-border/50 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Sandbox &amp; Simulation Mode</span>
                <Badge variant="outline" className="border-border text-[9px] font-mono px-1 py-0">TESTING</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Lingkungan uji isolasi untuk pelatihan teknisi, simulasi OLT dan topologi.
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-[10px]",
              org.featureFlags?.sandboxMode
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-muted text-muted-foreground"
            )}
          >
            {org.featureFlags?.sandboxMode ? "ENABLED" : "DISABLED"}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
