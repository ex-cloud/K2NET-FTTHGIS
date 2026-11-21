import * as React from "react";
import { EnterpriseKpiGrid, RichKpiCard, Skeleton } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { CheckCircle2, Server, Building2, ShieldCheck, ShieldAlert } from "lucide-react";
import type { PlatformModuleItem, OrphanAuditResult } from "@/hooks/usePlatformModules";

interface ModuleKpiGridProps {
  modules: PlatformModuleItem[];
  audit?: OrphanAuditResult;
  isLoading: boolean;
  isAuditLoading?: boolean;
}

export function ModuleKpiGrid({
  modules,
  audit,
  isLoading,
  isAuditLoading,
}: ModuleKpiGridProps) {
  const { t } = useTranslation();

  const totalCount = modules.length;
  const activeCount = modules.filter((m) => m.status === "ACTIVE").length;
  const systemModulesCount = modules.filter((m) => m.scope === "SYSTEM").length;
  const tenantModulesCount = modules.filter((m) => m.scope === "TENANT").length;

  const isAuditPending = isAuditLoading || !audit;
  const orphanAlertCount = audit
    ? (audit.orphanPermissions?.length || 0) + (audit.unmappedModules?.length || 0)
    : 0;

  const activePct = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;
  const isHealthy = Boolean(audit?.healthy) && orphanAlertCount === 0;

  return (
    <EnterpriseKpiGrid columns={4}>
      <RichKpiCard
        title={t("modules.kpi_active_modules")}
        value={isLoading ? <Skeleton className="h-7 w-12" /> : activeCount}
        subValue={t("modules.kpi_active_ratio", { pct: activePct })}
        description={t("modules.kpi_active_desc")}
        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
      />

      <RichKpiCard
        title={t("modules.scope_system")}
        value={isLoading ? <Skeleton className="h-7 w-12" /> : systemModulesCount}
        subValue={t("modules.kpi_platform_ratio", { count: systemModulesCount, total: totalCount })}
        description={t("modules.kpi_platform_desc")}
        icon={<Server className="h-3.5 w-3.5" />}
      />

      <RichKpiCard
        title={t("modules.scope_tenant")}
        value={isLoading ? <Skeleton className="h-7 w-12" /> : tenantModulesCount}
        subValue={t("modules.kpi_tenant_ratio", { count: tenantModulesCount, total: totalCount })}
        description={t("modules.kpi_tenant_desc")}
        icon={<Building2 className="h-3.5 w-3.5" />}
      />

      <RichKpiCard
        title={t("modules.kpi_orphan_status")}
        value={
          isAuditPending ? (
            <Skeleton className="h-7 w-20" />
          ) : isHealthy ? (
            <span className="text-primary font-bold">HEALTHY</span>
          ) : (
            <span className="text-destructive font-bold">{orphanAlertCount} ALERTS</span>
          )
        }
        subValue={
          isAuditPending
            ? undefined
            : isHealthy
            ? `${audit.livePermissionCount} Perms / ${audit.registeredModuleCount} Modules`
            : t("modules.kpi_discrepancy")
        }
        description={
          isAuditPending
            ? t("modules.kpi_integrity_desc")
            : isHealthy
            ? t("modules.kpi_integrity_desc")
            : `${audit.orphanPermissions?.length || 0} orphan permissions, ${audit.unmappedModules?.length || 0} unmapped modules.`
        }
        icon={
          isHealthy ? (
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          ) : (
            <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
          )
        }
      />
    </EnterpriseKpiGrid>
  );
}
