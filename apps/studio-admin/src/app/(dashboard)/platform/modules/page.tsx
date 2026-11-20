import * as React from "react";
import {
  PageLayout,
  PageHero,
  MetricCard,
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
import { useSearchParams } from "@/lib/navigation-compat";
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
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from "lucide-react";

export default function PlatformModulesPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const urlScope = searchParams.get("scope");
  const urlTab = searchParams.get("tab");

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
  const { data: audit } = useOrphanAudit(true);

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

  const orphanAlertCount =
    (audit?.orphanPermissions?.length || 0) + (audit?.unmappedModules?.length || 0);

  const handleInspect = (mod: PlatformModuleItem) => {
    setSelectedModule(mod);
    setDrawerOpen(true);
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
            className="text-[10px] gap-1 font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
          >
            <AlertTriangle className="size-3 text-amber-500" />
            {t("modules.status_maintenance")}
          </Badge>
        );
      case "DISABLED":
        return (
          <Badge
            variant="outline"
            className="text-[10px] gap-1 font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
          >
            <XCircle className="size-3 text-rose-500" />
            {t("modules.status_disabled")}
          </Badge>
        );
    }
  };

  const getTierBadge = (tier: string) => {
    let style = "bg-muted text-muted-foreground border-border";
    if (tier === "STARTER") style = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
    if (tier === "PRO") style = "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30";
    if (tier === "ENTERPRISE") style = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";

    return (
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${style}`}>
        {tier}
      </span>
    );
  };

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* 1. Standard 2-Layer PageHero Header */}
      <PageHero
        eyebrow={t("nav.plane_platform")}
        title={t("modules.page_title")}
        icon={Boxes}
        subtitle={t("modules.page_subtitle")}
        actions={
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
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5 text-xs h-7 px-2.5 font-medium"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              {t("modules.action_refresh")}
            </Button>
          </>
        }
      />

      {/* 2. 5 Metric KPI Cards (Groove variant) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard
          variant="groove"
          label={t("modules.kpi_total_modules")}
          value={isLoading ? <Skeleton className="h-7 w-12" /> : totalCount}
          icon={Boxes}
        />
        <MetricCard
          variant="groove"
          label={t("modules.kpi_active_modules")}
          value={isLoading ? <Skeleton className="h-7 w-12" /> : activeCount}
          icon={CheckCircle2}
        />
        <MetricCard
          variant="groove"
          label={t("modules.kpi_maintenance_modules")}
          value={isLoading ? <Skeleton className="h-7 w-12" /> : maintenanceCount}
          icon={AlertTriangle}
        />
        <MetricCard
          variant="groove"
          label={t("modules.kpi_disabled_modules")}
          value={isLoading ? <Skeleton className="h-7 w-12" /> : disabledCount}
          icon={XCircle}
        />
        <MetricCard
          variant="groove"
          label={t("modules.kpi_orphan_status")}
          value={
            audit ? (
              audit.healthy ? (
                <span className="text-xs font-semibold text-primary flex items-center gap-1">
                  <ShieldCheck className="size-4" />
                  {t("modules.kpi_healthy")}
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="size-4" />
                  {orphanAlertCount} Alerts
                </span>
              )
            ) : (
              <Skeleton className="h-6 w-20" />
            )
          }
          icon={ShieldCheck}
        />
      </div>

      {/* 3. Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card">
        {/* Scope Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted border border-border/80">
          {(["ALL", "SYSTEM", "TENANT"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScopeFilter(s)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
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

        <div className="flex items-center gap-2">
          {/* Status Select */}
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

          {/* Search Input */}
          <div className="relative w-full sm:w-[220px]">
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

      {/* 4. Modules Data Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
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
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
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
                        <span className="px-1.5 py-0.5 rounded bg-muted border border-border text-[11px]">
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
                        {mod.scope === "TENANT" ? getTierBadge(mod.minPlanTier) : (
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
                          className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted hover:bg-muted/80 border border-border text-foreground transition-colors"
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
      </div>

      {/* 5. Detail & Governance Drawer */}
      <ModuleDetailDrawer
        module={selectedModule}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      {/* 6. Orphan Audit Dialog */}
      <ModuleOrphanAuditDialog
        open={auditDialogOpen}
        onOpenChange={setAuditDialogOpen}
      />
    </PageLayout>
  );
}
