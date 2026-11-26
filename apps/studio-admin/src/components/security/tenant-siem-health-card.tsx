import * as React from "react";
import {
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Webhook,
  XCircle,
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
import type { TenantSiemOverviewItem } from "@/hooks/useSecuritySettings";

export interface TenantSiemHealthCardProps {
  items: TenantSiemOverviewItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function TenantSiemHealthCard({
  items,
  isLoading,
  onRefresh,
}: TenantSiemHealthCardProps) {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnDef<TenantSiemOverviewItem>[]>(
    () => [
      {
        accessorKey: "organizationName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.siem_overview.col_org")} />
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
        accessorKey: "endpointName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.siem_overview.col_endpoint")} />
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5 max-w-[260px]">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-foreground truncate">
                {row.original.endpointName}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                {row.original.targetFormat}
              </Badge>
            </div>
            <div className="text-[11px] font-mono text-muted-foreground truncate">
              {row.original.targetUrl}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "minSeverity",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.siem_overview.col_severity")} />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] font-mono">
            {row.original.minSeverity}+
          </Badge>
        ),
      },
      {
        accessorKey: "autoDisabled",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.siem_overview.col_status")} />
        ),
        cell: ({ row }) => {
          if (row.original.autoDisabled) {
            return (
              <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/10 text-[10px] gap-1">
                <XCircle className="size-3" />
                {t("security.siem_overview.status_auto_disabled")}
              </Badge>
            );
          }
          if (row.original.isActive) {
            return (
              <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[10px] gap-1">
                <CheckCircle2 className="size-3" />
                {t("security.siem_overview.status_active")}
              </Badge>
            );
          }
          return (
            <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
              <ShieldAlert className="size-3" />
              {t("security.siem_overview.status_paused")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "lastDeliveryStatus",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.siem_overview.col_last_delivery")} />
        ),
        cell: ({ row }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.original.lastDeliveryAt
              ? `${row.original.lastDeliveryStatus || "OK"} (${row.original.lastHttpStatus ?? "-"})`
              : "-"}
          </span>
        ),
      },
      {
        accessorKey: "dlqCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.siem_overview.col_dlq")} />
        ),
        cell: ({ row }) => (
          <span className="text-xs font-mono font-semibold text-foreground">
            {row.original.dlqCount ?? 0}
          </span>
        ),
      },
    ],
    [t]
  );

  return (
    <Card className="border-border/60 bg-card shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Webhook className="size-4 text-primary" />
            {t("security.siem_overview.title")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("security.siem_overview.desc")}
          </CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isLoading}
          onClick={onRefresh}
          className="gap-1.5 shrink-0"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          {t("security.siem_overview.refresh_btn")}
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          density="compact"
          emptyState={{
            icon: <Webhook className="size-6 mx-auto text-muted-foreground/60 mb-2" />,
            title: t("security.siem_overview.empty_title"),
            description: t("security.siem_overview.empty_desc"),
          }}
        />
      </CardContent>
    </Card>
  );
}
