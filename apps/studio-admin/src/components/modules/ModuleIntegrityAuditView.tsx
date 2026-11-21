import * as React from "react";
import { Card, Button, Badge } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { ShieldCheck, ShieldAlert, RefreshCw } from "lucide-react";
import type { PlatformModuleItem, OrphanAuditResult } from "@/hooks/usePlatformModules";

interface ModuleIntegrityAuditViewProps {
  modules: PlatformModuleItem[];
  audit?: OrphanAuditResult;
  isLoading: boolean;
  onRefresh: () => void;
}

export function ModuleIntegrityAuditView({
  modules,
  audit,
  isLoading,
  onRefresh,
}: ModuleIntegrityAuditViewProps) {
  const { t } = useTranslation();

  const orphanAlertCount =
    (audit?.orphanPermissions?.length || 0) + (audit?.unmappedModules?.length || 0);

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border/80 bg-card/90 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                orphanAlertCount === 0
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }`}
            >
              {orphanAlertCount === 0 ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <ShieldAlert className="h-6 w-6" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                {orphanAlertCount === 0
                  ? t("modules.audit_healthy_title")
                  : t("modules.kpi_discrepancy")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {orphanAlertCount === 0
                  ? t("modules.audit_healthy_desc")
                  : `${orphanAlertCount} issues detected across modules & permissions.`}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-1.5 text-xs h-7 px-2.5 font-medium shrink-0"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {t("modules.action_refresh")}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-border/80 bg-card/60">
          <span className="text-xs text-muted-foreground font-medium block mb-1">
            Registered Platform Modules
          </span>
          <span className="text-2xl font-bold font-mono text-foreground">
            {audit?.registeredModuleCount ?? modules.length}
          </span>
          <span className="text-[10px] text-muted-foreground block mt-1">
            Canonical SSOT in platform_modules
          </span>
        </Card>

        <Card className="p-4 border-border/80 bg-card/60">
          <span className="text-xs text-muted-foreground font-medium block mb-1">
            Live PostgreSQL Permissions
          </span>
          <span className="text-2xl font-bold font-mono text-foreground">
            {audit?.livePermissionCount ?? 0}
          </span>
          <span className="text-[10px] text-muted-foreground block mt-1">
            Granular PBAC entries verified
          </span>
        </Card>

        <Card className="p-4 border-border/80 bg-card/60">
          <span className="text-xs text-muted-foreground font-medium block mb-1">
            Orphan Discrepancies
          </span>
          <span
            className={`text-2xl font-bold font-mono ${
              orphanAlertCount === 0 ? "text-primary" : "text-destructive"
            }`}
          >
            {orphanAlertCount}
          </span>
          <span className="text-[10px] text-muted-foreground block mt-1">
            Unregistered modules or unmapped codes
          </span>
        </Card>
      </div>

      <div className="w-full overflow-x-auto border border-border/80 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-muted/40 border-b border-border/80 sticky top-0 z-10 backdrop-blur-xs">
            <tr className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-4">{t("modules.table_code")}</th>
              <th className="py-2.5 px-4">{t("modules.table_name")}</th>
              <th className="py-2.5 px-4">{t("modules.table_scope")}</th>
              <th className="py-2.5 px-4">{t("modules.table_permissions")}</th>
              <th className="py-2.5 px-4">Mapped PBAC Codes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {modules.map((mod) => (
              <tr key={mod.code} className="hover:bg-muted/30 transition-colors">
                <td className="py-2.5 px-4 font-mono font-semibold text-foreground">
                  <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/80 text-[11px]">
                    {mod.code}
                  </span>
                </td>
                <td className="py-2.5 px-4 font-semibold text-foreground">{mod.name}</td>
                <td className="py-2.5 px-4">
                  <Badge variant={mod.scope === "SYSTEM" ? "secondary" : "outline"} className="text-[10px]">
                    {mod.scope}
                  </Badge>
                </td>
                <td className="py-2.5 px-4 font-mono font-semibold">
                  {mod.permissions?.length ?? 0}
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex flex-wrap gap-1 max-w-[500px]">
                    {(mod.permissions || []).map((p) => (
                      <span
                        key={p.code}
                        className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-muted/80 text-foreground border border-border/80"
                      >
                        {p.code}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
