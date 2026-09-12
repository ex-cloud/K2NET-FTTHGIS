import { Badge, Card } from "@k2net/ui";
import { Zap, AlertTriangle, ExternalLink } from "lucide-react";
import { getTenantUrl } from "@/lib/domain";
import type { EnrichedOrganization } from "../../types";
import type { TenantSubscriptionSummary } from "@/hooks/useTenantSubscription";

interface OverviewIdentityCardProps {
  org: EnrichedOrganization;
  summary: TenantSubscriptionSummary | null;
  usedOlts: number;
  effectiveMaxOlts: number;
  usedOdps: number;
  effectiveMaxOdps: number;
  activeStatus: string;
}

export function OverviewIdentityCard({
  org,
  summary,
  usedOlts,
  effectiveMaxOlts,
  usedOdps,
  effectiveMaxOdps,
  activeStatus,
}: OverviewIdentityCardProps) {
  const isBoosterActive = summary?.isBoosterActive ?? false;

  return (
    <>
      {/* Booster Notification Banner */}
      {isBoosterActive && (
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between text-xs text-foreground">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="font-bold">Emergency Quota Booster Aktif:</span>
            <span className="text-foreground/80">
              +{summary?.boosterOdps} ODP &amp; +{summary?.boosterOlts} OLT (Sisa {summary?.boosterDaysRemaining} hari).
            </span>
          </div>
          <Badge variant="outline" className="border-amber-500/40 text-amber-500 font-mono text-[10px]">
            BURSTING ACTIVE
          </Badge>
        </div>
      )}

      {/* Master Identity Card */}
      <Card className="p-4 md:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold font-mono text-sm shadow-xs shrink-0">
              {org.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  {org.name}
                </h2>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded border border-border/60">
                  slug: {org.slug}
                </span>
                <a
                  href={getTenantUrl(org.slug)}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary flex items-center gap-1 text-[11px] text-muted-foreground hover:underline font-mono transition-colors"
                >
                  <span>subdomain portal</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                {org.description || "Enterprise FTTH ISP Tenant Environment"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {summary?.isOverQuota && (
              <Badge variant="destructive" className="font-mono text-[10px] gap-1 px-2 py-0.5">
                <AlertTriangle className="h-3 w-3" />
                <span>OVER_QUOTA</span>
              </Badge>
            )}
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px] gap-1 px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span>{activeStatus}</span>
            </Badge>
            <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-500 font-mono text-[10px] font-semibold px-2 py-0.5">
              {summary?.planTier ?? org.planTier} PLAN
            </Badge>
          </div>
        </div>

        {/* Key Properties Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-border/50 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">Lead PIC</span>
            <span className="font-semibold text-foreground truncate block">{org.picName}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">SLA Support</span>
            <span className="font-semibold text-primary block">{org.slaTier}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">Hardware Slots</span>
            <span className="font-mono text-foreground block">{usedOlts}/{effectiveMaxOlts} OLTs</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">ODP Quota</span>
            <span className="font-mono text-foreground block">{usedOdps}/{effectiveMaxOdps}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">MinIO Storage</span>
            <span className="font-mono text-foreground block">{org.usedStorageGb}/{org.maxStorageGb} GB</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">API Latency</span>
            <span className="font-mono text-primary block">{org.apiLatencyMs} ms</span>
          </div>
        </div>
      </Card>
    </>
  );
}
