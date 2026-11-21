import * as React from "react";
import {
  EnterpriseCommandCenterShell,
  Button,
  toast,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { useSearchParams } from "@/lib/navigation-compat";
import {
  usePlatformModules,
  useUpdateModuleStatus,
  useOrphanAudit,
  type PlatformModuleItem,
  type ModuleStatus,
} from "@/hooks/usePlatformModules";
import { ModuleDetailDrawer } from "@/components/modules/ModuleDetailDrawer";
import { ModuleDirectoryTable } from "@/components/modules/ModuleDirectoryTable";
import { ModuleFeatureTogglesView } from "@/components/modules/ModuleFeatureTogglesView";
import { ModuleEntitlementsMatrixView } from "@/components/modules/ModuleEntitlementsMatrixView";
import { ModuleIntegrityAuditView } from "@/components/modules/ModuleIntegrityAuditView";
import { ModuleKpiGrid } from "@/components/modules/ModuleKpiGrid";
import { ModuleToolbar } from "@/components/modules/ModuleToolbar";
import {
  Boxes,
  RefreshCw,
  Sliders,
  Layers,
  ShieldAlert,
} from "lucide-react";

function filterModuleItem(
  mod: PlatformModuleItem,
  scope: string,
  status: string,
  query: string
): boolean {
  if (scope !== "ALL" && mod.scope !== scope) return false;
  if (status !== "ALL" && mod.status !== status) return false;
  if (!query) return true;

  const q = query.toLowerCase();
  const permissionsText = (mod.permissions || [])
    .map((p) => `${p.code} ${p.name || ""} ${p.description || ""}`)
    .join(" ")
    .toLowerCase();

  return Boolean(
    mod.code?.toLowerCase().includes(q) ||
    mod.name?.toLowerCase().includes(q) ||
    mod.description?.toLowerCase().includes(q) ||
    mod.serviceTarget?.toLowerCase().includes(q) ||
    mod.scope?.toLowerCase().includes(q) ||
    mod.status?.toLowerCase().includes(q) ||
    mod.category?.toLowerCase().includes(q) ||
    mod.minPlanTier?.toLowerCase().includes(q) ||
    mod.licenseFlag?.toLowerCase().includes(q) ||
    permissionsText.includes(q)
  );
}

function resolveShellHeader(tab: string, t: (key: string) => string) {
  if (tab === "toggles") {
    return {
      title: t("modules.toggles_title"),
      subtitle: t("modules.toggles_desc"),
      icon: <Sliders className="h-5 w-5 text-foreground" />,
    };
  }
  if (tab === "entitlements") {
    return {
      title: t("modules.entitlements_title"),
      subtitle: t("modules.entitlements_desc"),
      icon: <Layers className="h-5 w-5 text-foreground" />,
    };
  }
  if (tab === "audit") {
    return {
      title: t("modules.audit_title"),
      subtitle: t("modules.audit_desc"),
      icon: <ShieldAlert className="h-5 w-5 text-foreground" />,
    };
  }
  return {
    title: t("modules.page_title"),
    subtitle: t("modules.page_subtitle"),
    icon: <Boxes className="h-5 w-5 text-foreground" />,
  };
}

export default function PlatformModulesPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const urlScope = searchParams.get("scope");
  const urlTab = searchParams.get("tab") || "directory";

  const [scopeFilter, setScopeFilter] = React.useState<string>(
    urlScope === "SYSTEM" || urlScope === "TENANT" ? urlScope : "ALL"
  );
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const [selectedModule, setSelectedModule] = React.useState<PlatformModuleItem | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    if (urlScope === "SYSTEM" || urlScope === "TENANT") {
      setScopeFilter(urlScope);
    }
  }, [urlScope]);

  // Reset status filter to ALL on tab change to prevent getting trapped in other views
  React.useEffect(() => {
    setStatusFilter("ALL");
  }, [urlTab]);

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

  const { data: audit, isLoading: isAuditLoading, refetch: refetchAudit } = useOrphanAudit(true);
  const updateStatusMutation = useUpdateModuleStatus();

  const modules = React.useMemo(
    () => (Array.isArray(rawModules) ? rawModules : []),
    [rawModules]
  );

  const cleanQuery = searchQuery.trim();
  const filteredModules = React.useMemo(
    () => modules.filter((m) => filterModuleItem(m, scopeFilter, statusFilter, cleanQuery)),
    [modules, scopeFilter, statusFilter, cleanQuery]
  );

  const matrixModules = React.useMemo(
    () => modules.filter((m) => filterModuleItem(m, scopeFilter, "ALL", cleanQuery)),
    [modules, scopeFilter, cleanQuery]
  );

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

  const handleQuickStatusChange = async (mod: PlatformModuleItem, newStatus: ModuleStatus) => {
    if (mod.status === newStatus) return;
    try {
      await updateStatusMutation.mutateAsync({
        code: mod.code,
        status: newStatus,
        reason: `Quick toggle from feature switchboard to ${newStatus}`,
      });
      toast.success(t("modules.toast_status_updated"));
    } catch {
      toast.error(t("modules.toast_status_failed"));
    }
  };

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

  const headerActions = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        refetch();
        refetchAudit();
      }}
      disabled={isFetching || isAuditLoading}
      className="gap-1.5 text-xs h-7 px-2.5 font-medium"
    >
      <RefreshCw className={`size-3.5 ${isFetching || isAuditLoading ? "animate-spin" : ""}`} />
      {t("modules.action_refresh")}
    </Button>
  );

  const shellHeader = resolveShellHeader(urlTab, t);

  return (
    <EnterpriseCommandCenterShell
      title={shellHeader.title}
      description={shellHeader.subtitle}
      icon={shellHeader.icon}
      metaChips={metaChips}
      actions={headerActions}
      kpiGrid={<ModuleKpiGrid modules={modules} audit={audit} isLoading={isLoading} />}
      toolbar={
        <ModuleToolbar
          urlTab={urlTab}
          scopeFilter={scopeFilter}
          onScopeChange={setScopeFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      }
    >
      {urlTab === "directory" && (
        <ModuleDirectoryTable
          modules={filteredModules}
          isLoading={isLoading}
          onInspect={handleInspect}
        />
      )}

      {urlTab === "toggles" && (
        <ModuleFeatureTogglesView
          modules={filteredModules}
          isLoading={isLoading}
          isMutating={updateStatusMutation.isPending}
          onStatusChange={handleQuickStatusChange}
        />
      )}

      {urlTab === "entitlements" && (
        <ModuleEntitlementsMatrixView modules={matrixModules} />
      )}

      {urlTab === "audit" && (
        <ModuleIntegrityAuditView
          modules={modules}
          audit={audit}
          isLoading={isAuditLoading}
          onRefresh={() => refetchAudit()}
        />
      )}

      <ModuleDetailDrawer
        module={selectedModule}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </EnterpriseCommandCenterShell>
  );
}
