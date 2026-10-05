import {
  Activity,
  AlertTriangle,
  Calendar,
  UserCheck,
} from "lucide-react";
import { Card } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { TenantAuditStats, ActorActivityDto } from "../../types/tenant-audit";

interface TenantAuditStatsCardsProps {
  stats: TenantAuditStats | null;
  isLoading: boolean;
}

function Events24hCard({ count, isLoading }: { count: number; isLoading: boolean }) {
  const { t } = useTranslation();
  return (
    <Card className="p-4 border-border/60 bg-card/60 backdrop-blur-xs shadow-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wider">
          {t("security.audit_events_24h")}
        </span>
        <div className="p-1.5 rounded-md bg-primary/10 text-primary border border-primary/20">
          <Activity className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="space-y-0.5">
        {isLoading ? (
          <div className="h-6 w-16 bg-muted/60 animate-pulse rounded" />
        ) : (
          <div className="text-xl font-bold font-mono text-foreground tracking-tight">
            {count.toLocaleString()}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">
          {t("security.audit_events_24h_desc")}
        </p>
      </div>
    </Card>
  );
}

function Events7dCard({ count, isLoading }: { count: number; isLoading: boolean }) {
  const { t } = useTranslation();
  return (
    <Card className="p-4 border-border/60 bg-card/60 backdrop-blur-xs shadow-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wider">
          {t("security.audit_events_7d")}
        </span>
        <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
          <Calendar className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="space-y-0.5">
        {isLoading ? (
          <div className="h-6 w-16 bg-muted/60 animate-pulse rounded" />
        ) : (
          <div className="text-xl font-bold font-mono text-foreground tracking-tight">
            {count.toLocaleString()}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">
          {t("security.audit_events_7d_desc")}
        </p>
      </div>
    </Card>
  );
}

function WarningsAnomaliesCard({ count, isLoading }: { count: number; isLoading: boolean }) {
  const { t } = useTranslation();
  const hasWarnings = count > 0;
  return (
    <Card className="p-4 border-border/60 bg-card/60 backdrop-blur-xs shadow-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wider">
          {t("security.audit_warn_errors")}
        </span>
        <div
          className={`p-1.5 rounded-md border ${
            hasWarnings
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="space-y-0.5">
        {isLoading ? (
          <div className="h-6 w-16 bg-muted/60 animate-pulse rounded" />
        ) : (
          <div
            className={`text-xl font-bold font-mono tracking-tight ${
              hasWarnings ? "text-amber-600 dark:text-amber-400" : "text-foreground"
            }`}
          >
            {count.toLocaleString()}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">
          {hasWarnings
            ? t("security.audit_anomalies_detected")
            : t("security.audit_system_healthy")}
        </p>
      </div>
    </Card>
  );
}

function TopContributorCard({
  topActor,
  isLoading,
}: {
  topActor?: ActorActivityDto;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const actorName = topActor?.actorEmail || topActor?.actorId || t("common.none");
  const actionText = topActor
    ? `${topActor.eventCount} ${t("security.audit_actions")}`
    : t("security.audit_no_activity");

  return (
    <Card className="p-4 border-border/60 bg-card/60 backdrop-blur-xs shadow-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wider">
          {t("security.audit_top_operator")}
        </span>
        <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <UserCheck className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="space-y-0.5">
        {isLoading ? (
          <div className="h-6 w-24 bg-muted/60 animate-pulse rounded" />
        ) : (
          <div className="text-sm font-bold font-mono text-foreground tracking-tight truncate max-w-[180px]">
            {actorName}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground font-mono">
          {actionText}
        </p>
      </div>
    </Card>
  );
}

export function TenantAuditStatsCards({ stats, isLoading }: TenantAuditStatsCardsProps) {
  const topActor = stats?.topActors?.[0];
  const events24h = stats?.totalEvents24h ?? 0;
  const events7d = stats?.totalEvents7d ?? 0;
  const warnErrors24h = stats?.totalWarnErrors24h ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      <Events24hCard count={events24h} isLoading={isLoading} />
      <Events7dCard count={events7d} isLoading={isLoading} />
      <WarningsAnomaliesCard count={warnErrors24h} isLoading={isLoading} />
      <TopContributorCard topActor={topActor} isLoading={isLoading} />
    </div>
  );
}
