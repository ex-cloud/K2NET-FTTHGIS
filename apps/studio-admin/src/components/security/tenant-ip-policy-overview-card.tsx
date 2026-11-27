import * as React from "react";
import { CheckCircle2, Eye, Globe, RefreshCw, ShieldAlert } from "lucide-react";
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
import type { TenantIpPolicyOverviewItem } from "@/hooks/useSecuritySettings";

export interface TenantIpPolicyOverviewCardProps {
  items: TenantIpPolicyOverviewItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function TenantIpPolicyOverviewCard({
  items,
  isLoading,
  onRefresh,
}: TenantIpPolicyOverviewCardProps) {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnDef<TenantIpPolicyOverviewItem>[]>(
    () => [
      {
        accessorKey: "organizationName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.ip_policy_overview.col_org")} />
        ),
        cell: ({ row }) => (
          <div>
            <div className="text-xs font-semibold text-foreground">{row.original.organizationName}</div>
            <div className="text-[11px] font-mono text-muted-foreground">{row.original.organizationSlug}</div>
          </div>
        ),
      },
      {
        accessorKey: "ipPolicyMode",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.ip_policy_overview.col_mode")} />
        ),
        cell: ({ row }) => {
          const mode = row.original.ipPolicyMode;
          if (mode === "ENFORCE") {
            return (
              <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[10px] gap-1">
                <CheckCircle2 className="size-3" />
                {t("security.ip_policy_overview.mode_enforce")}
              </Badge>
            );
          }
          if (mode === "MONITOR_ONLY") {
            return (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Eye className="size-3" />
                {t("security.ip_policy_overview.mode_monitor")}
              </Badge>
            );
          }
          return (
            <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
              <ShieldAlert className="size-3" />
              {t("security.ip_policy_overview.mode_disabled")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "cidrCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.ip_policy_overview.col_cidrs")} />
        ),
        cell: ({ row }) => (
          <span className="text-xs font-mono font-semibold text-foreground">{row.original.cidrCount}</span>
        ),
      },
      {
        accessorKey: "allowedCountries",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.ip_policy_overview.col_countries")} />
        ),
        cell: ({ row }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.original.allowedCountries && row.original.allowedCountries.length > 0
              ? row.original.allowedCountries.join(", ")
              : t("security.ip_policy_overview.all_countries")}
          </span>
        ),
      },
      {
        accessorKey: "allowBreakGlassIpBypass",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.ip_policy_overview.col_break_glass")} />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] font-mono">
            {row.original.allowBreakGlassIpBypass
              ? t("security.ip_policy_overview.bypass_enabled")
              : t("security.ip_policy_overview.bypass_strict")}
          </Badge>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("security.ip_policy_overview.col_updated")} />
        ),
        cell: ({ row }) => (
          <span className="text-[11px] font-mono text-muted-foreground">
            {row.original.updatedAt ? new Date(row.original.updatedAt).toLocaleString() : "-"}
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
            <Globe className="size-4 text-primary" />
            {t("security.ip_policy_overview.title")}
          </CardTitle>
          <CardDescription className="text-xs">{t("security.ip_policy_overview.desc")}</CardDescription>
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
          {t("security.ip_policy_overview.refresh_btn")}
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          density="compact"
          emptyState={{
            icon: <Globe className="size-6 mx-auto text-muted-foreground/60 mb-2" />,
            title: t("security.ip_policy_overview.empty_title"),
            description: t("security.ip_policy_overview.empty_desc"),
          }}
        />
      </CardContent>
    </Card>
  );
}
