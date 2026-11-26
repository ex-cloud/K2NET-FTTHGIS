import * as React from "react";
import {
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
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
import type {
  IamIntegrityFinding,
  IamIntegrityScanSummary,
} from "@/hooks/useSecuritySettings";
import {
  FindingStatusBadge,
  IamIntegrityConfirmDialogs,
  IamIntegrityStatsGrid,
  type TranslateFn,
} from "@/components/security/iam-integrity-parts";

export interface IamIntegrityMonitorCardProps {
  summary?: IamIntegrityScanSummary;
  isLoading: boolean;
  isScanning: boolean;
  isPurgingAll: boolean;
  onRescan: () => Promise<{ data?: IamIntegrityScanSummary }>;
  onPurgeAll: () => Promise<IamIntegrityScanSummary>;
  onPurgeSingle: (params: {
    realm: string;
    keycloakUserId: string;
  }) => Promise<IamIntegrityScanSummary>;
}

function buildColumns({
  t,
  purgingId,
  isPurgingAll,
  onSelectSingle,
}: {
  t: TranslateFn;
  purgingId: string | null;
  isPurgingAll: boolean;
  onSelectSingle: (item: IamIntegrityFinding) => void;
}): ColumnDef<IamIntegrityFinding>[] {
  return [
    {
      accessorKey: "username",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("security.iam_integrity_col_identity")} />
      ),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-foreground">
            {row.original.email || row.original.username || row.original.keycloakUserId}
          </div>
          <div className="text-[11px] font-mono text-muted-foreground">
            {row.original.keycloakUserId}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "realm",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("security.iam_integrity_col_realm")} />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-mono">
          {row.original.realm}
        </Badge>
      ),
    },
    {
      accessorKey: "findingType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("security.iam_integrity_col_status")} />
      ),
      cell: ({ row }) => <FindingStatusBadge kind={row.original.findingType} t={t} />,
    },
    {
      accessorKey: "ageHours",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("security.iam_integrity_col_age")} />
      ),
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground">
          {row.original.ageHours >= 0
            ? t("security.iam_integrity_age_hours", { hours: row.original.ageHours })
            : t("security.iam_integrity_age_unknown")}
        </span>
      ),
    },
    {
      accessorKey: "reason",
      header: () => (
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {t("security.iam_integrity_col_reason")}
        </span>
      ),
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground line-clamp-2 max-w-md">
          {row.original.reason || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => (
        <span className="text-right block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {t("security.iam_integrity_col_actions")}
        </span>
      ),
      cell: ({ row }) => {
        const item = row.original;
        if (!item.purgeable) {
          return (
            <div className="text-right">
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                {item.findingType === "ORPHAN_GRACE_PERIOD"
                  ? t("security.iam_integrity_grace_label")
                  : t("security.iam_integrity_protected_label")}
              </Badge>
            </div>
          );
        }
        const isBusy = purgingId === item.keycloakUserId || isPurgingAll;
        return (
          <div className="text-right">
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={isBusy}
              onClick={(e) => {
                e.stopPropagation();
                onSelectSingle(item);
              }}
              className="h-6 px-2 text-[11px] gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              {purgingId === item.keycloakUserId ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Trash2 className="size-3" />
              )}
              {t("security.iam_integrity_purge_btn")}
            </Button>
          </div>
        );
      },
    },
  ];
}

export function IamIntegrityMonitorCard({
  summary,
  isLoading,
  isScanning,
  isPurgingAll,
  onRescan,
  onPurgeAll,
  onPurgeSingle,
}: IamIntegrityMonitorCardProps) {
  const { t } = useTranslation();
  const [confirmAllOpen, setConfirmAllOpen] = React.useState(false);
  const [singleTarget, setSingleTarget] =
    React.useState<IamIntegrityFinding | null>(null);
  const [purgingId, setPurgingId] = React.useState<string | null>(null);

  const findings = summary?.findings ?? [];
  const purgeableCount = findings.filter((item) => item.purgeable).length;

  const handleRescan = async () => {
    try {
      const res = await onRescan();
      if (res.data) {
        toast.success(
          t("security.iam_integrity_scan_success", {
            kc: res.data.totalKeycloakUsers,
            db: res.data.totalDatabaseUsers,
          })
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const handleConfirmPurgeAll = async () => {
    setConfirmAllOpen(false);
    try {
      const res = await onPurgeAll();
      if (res.circuitBreakerTriggered) {
        toast.error(res.circuitBreakerReason || t("security.iam_integrity_circuit_alert"));
        return;
      }
      toast.success(t("security.iam_integrity_purge_all_success", { count: res.purgedCount }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const handleConfirmPurgeSingle = async () => {
    if (!singleTarget) return;
    const target = singleTarget;
    setSingleTarget(null);
    setPurgingId(target.keycloakUserId);
    try {
      await onPurgeSingle({ realm: target.realm, keycloakUserId: target.keycloakUserId });
      toast.success(
        t("security.iam_integrity_purge_single_success", {
          user: target.email || target.username || target.keycloakUserId,
        })
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setPurgingId(null);
    }
  };

  const columns = React.useMemo(
    () => buildColumns({ t, purgingId, isPurgingAll, onSelectSingle: setSingleTarget }),
    [isPurgingAll, purgingId, t]
  );

  return (
    <Card glowingEffect className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <UserCheck className="w-4 h-4 text-primary" />
            {t("security.iam_integrity_title")}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            {t("security.iam_integrity_desc")}
            {summary?.scannedAt ? (
              <span className="ml-2 font-mono text-[11px]">
                · {t("security.iam_integrity_last_scanned", { time: new Date(summary.scannedAt).toLocaleString() })}
              </span>
            ) : null}
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isScanning || isPurgingAll}
            onClick={handleRescan}
            className="h-7 px-2.5 text-xs font-medium gap-1.5"
          >
            {isScanning ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5 text-primary" />}
            {isScanning ? t("security.iam_integrity_scanning_btn") : t("security.iam_integrity_scan_btn")}
          </Button>

          {purgeableCount > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPurgingAll || isScanning}
              onClick={() => setConfirmAllOpen(true)}
              className="h-7 px-2.5 text-xs font-medium gap-1.5"
            >
              {isPurgingAll ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              {isPurgingAll ? t("security.iam_integrity_purging_btn") : t("security.iam_integrity_purge_all_btn", { count: purgeableCount })}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {summary?.circuitBreakerTriggered && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 flex items-start gap-2.5">
            <ShieldAlert className="size-4 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-destructive">
                {t("security.iam_integrity_circuit_alert")}
              </div>
              <p className="text-xs text-muted-foreground">{summary.circuitBreakerReason}</p>
            </div>
          </div>
        )}

        <IamIntegrityStatsGrid summary={summary} t={t} />

        <DataTable
          columns={columns}
          data={findings}
          isLoading={isLoading}
          density="compact"
          emptyState={{
            icon: <ShieldCheck className="size-8 mx-auto text-muted-foreground/50 mb-2" />,
            title: t("security.iam_integrity_empty_title"),
            description: t("security.iam_integrity_empty_desc"),
          }}
        />
      </CardContent>

      <IamIntegrityConfirmDialogs
        confirmAllOpen={confirmAllOpen}
        setConfirmAllOpen={setConfirmAllOpen}
        purgeableCount={purgeableCount}
        singleTarget={singleTarget}
        setSingleTarget={setSingleTarget}
        onConfirmAll={handleConfirmPurgeAll}
        onConfirmSingle={handleConfirmPurgeSingle}
        t={t}
      />
    </Card>
  );
}
