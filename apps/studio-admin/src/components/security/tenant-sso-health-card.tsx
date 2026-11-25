import * as React from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Play,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableColumnHeader,
  type ColumnDef,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import type { TenantSsoHealthSummary } from "@/hooks/useSecuritySettings";

export interface TenantSsoHealthCardProps {
  items: TenantSsoHealthSummary[];
  isLoading: boolean;
  onRunAll: () => Promise<TenantSsoHealthSummary[]>;
  isRunningAll: boolean;
  onRunSingle: (configId: string) => Promise<TenantSsoHealthSummary>;
}

function getNearestExpiryDays(item: TenantSsoHealthSummary): number | null {
  const candidates = [
    item.tlsCertDaysRemaining,
    item.samlCertDaysRemaining,
    item.clientSecretDaysRemaining,
  ].filter((v): v is number => typeof v === "number");
  if (candidates.length === 0) return null;
  return Math.min(...candidates);
}

export function TenantSsoHealthCard({
  items,
  isLoading,
  onRunAll,
  isRunningAll,
  onRunSingle,
}: TenantSsoHealthCardProps) {
  const { t } = useTranslation();
  const [probingId, setProbingId] = React.useState<string | null>(null);

  const handleRunAll = async () => {
    try {
      const updated = await onRunAll();
      toast.success(t("security.sso_health_run_all_success", { count: updated.length }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRunSingle = React.useCallback(
    async (item: TenantSsoHealthSummary) => {
      if (probingId) return;
      setProbingId(item.configId);
      try {
        await onRunSingle(item.configId);
        toast.success(
          t("security.sso_health_run_single_success", {
            org: item.organizationName || item.organizationSlug,
          })
        );
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : String(err));
      } finally {
        setProbingId(null);
      }
    },
    [onRunSingle, probingId, t]
  );

  const columns = React.useMemo<ColumnDef<TenantSsoHealthSummary>[]>(
    () => [
      {
        accessorKey: "organizationName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.sso_health_col_org")} />
        ),
        cell: ({ row }) => (
          <div>
            <div className="text-xs font-semibold text-foreground">
              {row.original.organizationName}
            </div>
            <div className="text-[11px] font-mono text-muted-foreground">
              {row.original.organizationSlug}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "providerType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.sso_health_col_provider")} />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] font-mono">
            {row.original.providerType}
          </Badge>
        ),
      },
      {
        accessorKey: "healthStatus",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.sso_health_col_status")} />
        ),
        cell: ({ row }) => {
          const st = row.original.healthStatus;
          if (st === "HEALTHY") {
            return (
              <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[10px] gap-1">
                <CheckCircle2 className="size-3" />
                {t("security.sso_health_status_healthy")}
              </Badge>
            );
          }
          if (st === "DEGRADED") {
            return (
              <Badge variant="outline" className="border-border text-foreground bg-muted text-[10px] gap-1">
                <AlertTriangle className="size-3" />
                {t("security.sso_health_status_degraded")}
              </Badge>
            );
          }
          if (st === "UNHEALTHY") {
            return (
              <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/10 text-[10px] gap-1">
                <ShieldAlert className="size-3" />
                {t("security.sso_health_status_unhealthy")}
              </Badge>
            );
          }
          return (
            <Badge variant="outline" className="border-border text-muted-foreground text-[10px] gap-1">
              <Clock className="size-3" />
              {t("security.sso_health_status_unknown")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "lastHealthLatencyMs",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.sso_health_col_latency")} />
        ),
        cell: ({ row }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {typeof row.original.lastHealthLatencyMs === "number"
              ? `${row.original.lastHealthLatencyMs}ms`
              : "—"}
          </span>
        ),
      },
      {
        id: "nearestExpiry",
        header: () => (
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t("security.sso_health_col_expiry")}
          </span>
        ),
        cell: ({ row }) => {
          const minDays = getNearestExpiryDays(row.original);
          if (minDays === null) {
            return (
              <span className="text-[11px] text-muted-foreground">
                {t("security.sso_health_no_expiry")}
              </span>
            );
          }
          if (minDays <= 0) {
            return (
              <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/10 text-[10px] font-mono">
                {t("security.sso_health_expired")}
              </Badge>
            );
          }
          return (
            <Badge
              variant="outline"
              className={
                minDays <= 30
                  ? "border-border text-foreground bg-muted text-[10px] font-mono"
                  : "border-primary/30 text-primary bg-primary/10 text-[10px] font-mono"
              }
            >
              {t("security.sso_health_days_remaining", { days: minDays })}
            </Badge>
          );
        },
      },
      {
        accessorKey: "lastHealthCheckAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.sso_health_col_checked")} />
        ),
        cell: ({ row }) => (
          <span className="text-[11px] font-mono text-muted-foreground">
            {row.original.lastHealthCheckAt
              ? new Date(row.original.lastHealthCheckAt).toLocaleString()
              : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => (
          <span className="text-right block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t("security.sso_health_col_actions")}
          </span>
        ),
        cell: ({ row }) => {
          const isProbing = probingId === row.original.configId;
          return (
            <div className="text-right">
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={isProbing || isRunningAll}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRunSingle(row.original);
                }}
                className="h-6 px-2 text-[11px] gap-1"
              >
                {isProbing ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Play className="size-3 text-primary" />
                )}
                {t("security.sso_health_run_single_btn")}
              </Button>
            </div>
          );
        },
      },
    ],
    [handleRunSingle, isRunningAll, probingId, t]
  );

  return (
    <Card glowingEffect className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Activity className="w-4 h-4 text-primary" />
            {t("security.sso_health_title")}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            {t("security.sso_health_desc")}
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isRunningAll}
          onClick={handleRunAll}
          className="h-7 px-2.5 text-xs font-medium gap-1.5 shrink-0"
        >
          {isRunningAll ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5 text-primary" />
          )}
          {isRunningAll
            ? t("security.sso_health_running_all_btn")
            : t("security.sso_health_run_all_btn")}
        </Button>
      </CardHeader>
      <CardContent className="pt-5">
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          density="compact"
          emptyState={{
            icon: <ShieldCheck className="size-8 mx-auto text-muted-foreground/50 mb-2" />,
            title: t("security.sso_health_empty_title"),
            description: t("security.sso_health_empty_desc"),
          }}
        />
      </CardContent>
    </Card>
  );
}
