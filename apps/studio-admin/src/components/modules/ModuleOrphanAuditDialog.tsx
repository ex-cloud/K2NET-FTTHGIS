import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { useOrphanAudit } from "@/hooks/usePlatformModules";
import { CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";

interface ModuleOrphanAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModuleOrphanAuditDialog({
  open,
  onOpenChange,
}: ModuleOrphanAuditDialogProps) {
  const { t } = useTranslation();
  const { data: audit, isLoading, refetch, isFetching } = useOrphanAudit(open);

  const orphanPermissions = Array.isArray(audit?.orphanPermissions) ? audit.orphanPermissions : [];
  const unmappedModules = Array.isArray(audit?.unmappedModules) ? audit.unmappedModules : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-background border-border">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <DialogTitle className="text-base font-bold text-foreground">
              {t("modules.audit_dialog_title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("modules.audit_dialog_desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-xs text-muted-foreground">
              <RefreshCw className="size-4 animate-spin mr-2" />
              {t("common.loading")}
            </div>
          ) : audit?.healthy ? (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-primary/30 bg-primary/10 text-xs text-foreground">
              <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-primary block">
                  {t("modules.audit_healthy_title")}
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {t("modules.audit_healthy_desc")}
                </p>
                <div className="flex gap-4 pt-2 text-[11px] font-mono text-muted-foreground">
                  <span>Modules: {audit.registeredModuleCount}</span>
                  <span>Permissions: {audit.livePermissionCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs">
                <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 block">
                    {t("modules.kpi_discrepancy")}
                  </span>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Registered modules: {audit?.registeredModuleCount ?? 0} | Live permissions: {audit?.livePermissionCount ?? 0}
                  </p>
                </div>
              </div>

              {/* Orphan Permissions */}
              {orphanPermissions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      {t("modules.orphan_permissions_found")}
                    </span>
                    <Badge variant="destructive" className="text-[10px]">
                      {orphanPermissions.length}
                    </Badge>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-border/60 rounded-md border border-border bg-card/60">
                    {orphanPermissions.map((item) => (
                      <div key={item.code} className="p-2.5 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-mono font-semibold text-foreground block">
                            {item.code}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {item.name}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {item.module || "UNKNOWN"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unmapped Modules */}
              {unmappedModules.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      {t("modules.unmapped_modules_found")}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {unmappedModules.length}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-md border border-border bg-card/60">
                    {unmappedModules.map((modCode) => (
                      <span
                        key={modCode}
                        className="px-2 py-0.5 rounded text-xs font-mono bg-muted text-muted-foreground border border-border"
                      >
                        {modCode}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 border-t border-border pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
            {t("modules.action_refresh")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
