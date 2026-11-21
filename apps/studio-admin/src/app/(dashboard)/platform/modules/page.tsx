import * as React from "react";
import {
  EnterpriseCommandCenterShell,
  EnterpriseKpiGrid,
  RichKpiCard,
  Button,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { useSearchParams, useRouter } from "@/lib/navigation-compat";
import {
  usePlatformModules,
  useOrphanAudit,
  type PlatformModuleItem,
  type ModuleStatus,
} from "@/hooks/usePlatformModules";
import { ModuleDetailDrawer } from "@/components/modules/ModuleDetailDrawer";
import { ModuleOrphanAuditDialog } from "@/components/modules/ModuleOrphanAuditDialog";
import {
  Boxes,
  Search,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Server,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Sliders,
  Layers,
} from "lucide-react";

export default function PlatformModulesPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlScope = searchParams.get("scope");
  const urlTab = searchParams.get("tab") || "directory";

  const [scopeFilter, setScopeFilter] = React.useState<string>(
    urlScope === "SYSTEM" || urlScope === "TENANT" ? urlScope : "ALL"
  );
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const [selectedModule, setSelectedModule] = React.useState<PlatformModuleItem | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = React.useState(urlTab === "audit");

  React.useEffect(() => {
    if (urlScope === "SYSTEM" || urlScope === "TENANT") {
      setScopeFilter(urlScope);
    }
  }, [urlScope]);

  React.useEffect(() => {
    if (urlTab === "audit") {
      setAuditDialogOpen(true);
    }
  }, [urlTab]);

  // Fetch modules with active filters
  const {
    data: rawModules = [],
    isLoading,
    isFetching,
    refetch,
  } = usePlatformModules({
    scope: scopeFilter,
    status: statusFilter,
    search: searchQuery.trim() || undefined,
  });

  // Fetch orphan audit KPI
  const { data: audit, refetch: refetchAudit } = useOrphanAudit(true);

  // Safe guarded arrays
  const modules = React.useMemo(
    () => (Array.isArray(rawModules) ? rawModules : []),
    [rawModules]
  );

  // Computed metrics
  const totalCount = modules.length;
  const activeCount = modules.filter((m) => m.status === "ACTIVE").length;
  const maintenanceCount = modules.filter((m) => m.status === "MAINTENANCE").length;
  const disabledCount = modules.filter((m) => m.status === "DISABLED").length;

  const systemModulesCount = modules.filter((m) => m.scope === "SYSTEM").length;
  const tenantModulesCount = modules.filter((m) => m.scope === "TENANT").length;

  const orphanAlertCount =
    (audit?.orphanPermissions?.length || 0) + (audit?.unmappedModules?.length || 0);

  const handleInspect = (mod: PlatformModuleItem) => {
    setSelectedModule(mod);
    setDrawerOpen(true);
  };

  const handleTabChange = (tab: string) => {
    if (tab === "audit") {
      setAuditDialogOpen(true);
      return;
    }
    router.push(`/platform/modules${tab === "directory" ? "" : `?tab=${tab}`}`);
  };

  const getStatusBadge = (status: ModuleStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge
            variant="outline"
            className="text-[10px] gap-1 font-medium bg-primary/10 text-primary border-primary/30"
          >
            <CheckCircle2 className="size-3 text-primary" />
            {t("modules.status_active")}
          </Badge>
        );
      case "MAINTENANCE":
        return (
          <Badge
            variant="outline"
            className="text-[10px] gap-1 font-medium bg-muted text-foreground border-border"
          >
            <AlertTriangle className="size-3 text-foreground" />
            {t("modules.status_maintenance")}
          </Badge>
        );
      case "DISABLED":
        return (
          <Badge
            variant="outline"
            className="text-[10px] gap-1 font-medium bg-destructive/10 text-destructive border-destructive/30"
          >
            <XCircle className="size-3 text-destructive" />
            {t("modules.status_disabled")}
          </Badge>
        );
    }
  };

  const getTierBadge = (tier: string) => {
    let style = "bg-muted text-muted-foreground border-border";
    if (tier === "STARTER") style = "bg-muted text-foreground font-semibold border-border/80";
    if (tier === "PRO") style = "bg-foreground/10 text-foreground font-semibold border-border";
    if (tier === "ENTERPRISE") style = "bg-foreground text-background font-bold border-foreground";

    return (
      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${style}`}>
        {tier}
      </span>
    );
  };

  // 1. Meta chips for header line
  const metaChips = [
    { label: t("modules.meta_total"), count: totalCount },
    { label: t("modules.meta_active"), count: activeCount },
    {
      label: t("modules.meta_maintenance"),
      count: maintenanceCount,
      variant: maintenanceCount > 0 ? ("destructive" as const) : ("muted" as const),
    },
    {
      label: t("modules.meta_disabled"),
      count: disabledCount,
      variant: disabledCount > 0 ? ("destructive" as const) : ("muted" as const),
    },
    {
      label: t("modules.meta_alerts"),
      count: orphanAlertCount,
      variant: orphanAlertCount > 0 ? ("destructive" as const) : ("default" as const),
    },
  ];

  // 2. Action buttons for header
  const headerActions = (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setAuditDialogOpen(true)}
        className="gap-1.5 text-xs h-7 px-2.5 font-medium"
      >
        <ShieldAlert className="size-3.5 text-primary" />
        {t("modules.action_audit_orphans")}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          refetch();
          refetchAudit();
        }}
        disabled={isFetching}
        className="gap-1.5 text-xs h-7 px-2.5 font-medium"
      >
        <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
        {t("modules.action_refresh")}
      </Button>
    </>
  );

  // 3. 4 Rich KPI Cards with glowingEffect and Sparkline
  const activePct = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;
  const kpiGrid = (
    <EnterpriseKpiGrid columns={4}>
      {/* KPI 1: Active Modules */}
      <RichKpiCard
        title={t("modules.kpi_active_modules")}
        value={isLoading ? <Skeleton className="h-7 w-12" /> : activeCount}
        subValue={t("modules.kpi_active_ratio", { pct: activePct })}
        description={t("modules.kpi_active_desc")}
        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
        sparklineCount={activeCount}
        sparklineLabel={t("modules.kpi_active_modules")}
        sparklineMeta={`${activeCount} / ${totalCount}`}
        sparklineVariant="active"
      />

      {/* KPI 2: Platform Scope */}
      <RichKpiCard
        title={t("modules.scope_system")}
        value={isLoading ? <Skeleton className="h-7 w-12" /> : systemModulesCount}
        subValue={t("modules.kpi_platform_ratio", { count: systemModulesCount, total: totalCount })}
        description={t("modules.kpi_platform_desc")}
        icon={<Server className="h-3.5 w-3.5" />}
        sparklineCount={systemModulesCount}
        sparklineLabel={t("modules.scope_system")}
        sparklineMeta={`${systemModulesCount} Engines`}
        sparklineVariant="resolved"
      />

      {/* KPI 3: Tenant Scope */}
      <RichKpiCard
        title={t("modules.scope_tenant")}
        value={isLoading ? <Skeleton className="h-7 w-12" /> : tenantModulesCount}
        subValue={t("modules.kpi_tenant_ratio", { count: tenantModulesCount, total: totalCount })}
        description={t("modules.kpi_tenant_desc")}
        icon={<Building2 className="h-3.5 w-3.5" />}
        sparklineCount={tenantModulesCount}
        sparklineLabel={t("modules.scope_tenant")}
        sparklineMeta={`${tenantModulesCount} Modules`}
        sparklineVariant="active"
      />

      {/* KPI 4: Integrity Status */}
      <RichKpiCard
        title={t("modules.kpi_orphan_status")}
        value={
          orphanAlertCount === 0 ? (
            <span className="text-primary font-bold">HEALTHY</span>
          ) : (
            <span className="text-destructive font-bold">{orphanAlertCount} ALERTS</span>
          )
        }
        subValue={
          orphanAlertCount === 0
            ? t("modules.kpi_integrity_ratio")
            : t("modules.kpi_discrepancy")
        }
        description={t("modules.kpi_integrity_desc")}
        icon={
          orphanAlertCount === 0 ? (
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          ) : (
            <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
          )
        }
        sparklineCount={orphanAlertCount === 0 ? 7 : orphanAlertCount}
        sparklineLabel={t("modules.meta_healthy")}
        sparklineMeta={orphanAlertCount === 0 ? "0 Orphans" : `${orphanAlertCount} Alerts`}
        sparklineVariant={orphanAlertCount === 0 ? "resolved" : "urgent"}
        sparklineColor={orphanAlertCount === 0 ? "primary" : "destructive"}
      />
    </EnterpriseKpiGrid>
  );

  // 4. Backdrop-blur Sticky Toolbar
  const toolbar = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Scope Filter Tabs */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/60 border border-border/80">
        {(["ALL", "SYSTEM", "TENANT"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScopeFilter(s)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              scopeFilter === s
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "ALL"
              ? t("modules.scope_all")
              : s === "SYSTEM"
              ? t("modules.scope_system")
              : t("modules.scope_tenant")}
          </button>
        ))}
      </div>

      {/* Status & Search Controls */}
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-7 text-xs w-[140px] bg-background border-border">
            <SelectValue placeholder={t("modules.status_all")} />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border text-foreground text-xs">
            <SelectItem value="ALL">{t("modules.status_all")}</SelectItem>
            <SelectItem value="ACTIVE">{t("modules.status_active")}</SelectItem>
            <SelectItem value="MAINTENANCE">{t("modules.status_maintenance")}</SelectItem>
            <SelectItem value="DISABLED">{t("modules.status_disabled")}</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative w-full sm:w-[240px]">
          <Search className="absolute left-2.5 top-1.5 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("modules.search_placeholder")}
            className="h-7 pl-8 text-xs bg-background border-border"
          />
        </div>
      </div>
    </div>
  );

  return (
    <EnterpriseCommandCenterShell
      title={t("modules.page_title")}
      description={t("modules.page_subtitle")}
      icon={<Boxes className="h-5 w-5 text-foreground" />}
      metaChips={metaChips}
      actions={headerActions}
      kpiGrid={kpiGrid}
      toolbar={toolbar}
    >
      {/* 5. Modules Data Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-muted/40 border-b border-border/80 sticky top-0 z-10 backdrop-blur-xs">
            <tr className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-4">{t("modules.table_code")}</th>
              <th className="py-2.5 px-4">{t("modules.table_name")}</th>
              <th className="py-2.5 px-4">{t("modules.table_scope")}</th>
              <th className="py-2.5 px-4">{t("modules.table_min_tier")}</th>
              <th className="py-2.5 px-4">{t("modules.table_target")}</th>
              <th className="py-2.5 px-4">{t("modules.table_permissions")}</th>
              <th className="py-2.5 px-4">{t("modules.table_status")}</th>
              <th className="py-2.5 px-4 text-right">{t("modules.table_actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-36" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-12" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-28" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-10" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="py-3 px-4 text-right"><Skeleton className="h-6 w-14 ml-auto" /></td>
                </tr>
              ))
            ) : modules.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground space-y-1">
                  <Boxes className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                  <span className="font-semibold block text-foreground">
                    {t("modules.empty_search_title")}
                  </span>
                  <p className="text-[11px]">
                    {t("modules.empty_search_desc")}
                  </p>
                </td>
              </tr>
            ) : (
              modules.map((mod) => {
                const permCount = mod.permissions?.length ?? mod.permissionsCount ?? 0;
                return (
                  <tr
                    key={mod.code || mod.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="py-2.5 px-4 font-mono font-semibold text-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/80 text-[11px]">
                        {mod.code}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-foreground">{mod.name}</div>
                      {mod.description && (
                        <div className="text-[11px] text-muted-foreground line-clamp-1">
                          {mod.description}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge
                        variant={mod.scope === "SYSTEM" ? "secondary" : "outline"}
                        className="text-[10px] tracking-wide uppercase font-semibold"
                      >
                        {mod.scope}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4">
                      {mod.scope === "TENANT" ? (
                        getTierBadge(mod.minPlanTier)
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                        <Server className="size-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{mod.serviceTarget}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleInspect(mod)}
                        className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted/80 hover:bg-muted border border-border text-foreground transition-colors"
                      >
                        {permCount}
                      </button>
                    </td>
                    <td className="py-2.5 px-4">
                      {getStatusBadge(mod.status)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleInspect(mod)}
                        className="gap-1 text-[11px] h-6 px-2 font-medium"
                      >
                        <ExternalLink className="size-3 text-muted-foreground" />
                        {t("modules.action_inspect")}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 6. Detail & Governance Drawer */}
      <ModuleDetailDrawer
        module={selectedModule}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      {/* 7. Orphan Audit Dialog */}
      <ModuleOrphanAuditDialog
        open={auditDialogOpen}
        onOpenChange={setAuditDialogOpen}
      />
    </EnterpriseCommandCenterShell>
  );
}
