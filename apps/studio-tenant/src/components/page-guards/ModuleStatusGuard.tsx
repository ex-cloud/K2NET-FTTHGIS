import * as React from "react";
import { AlertTriangle, XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button, Card } from "@k2net/ui";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "@k2net/i18n";
import { usePublicModules } from "../../hooks/use-public-modules";

export interface ModuleStatusGuardProps {
  moduleKey: string;
  moduleName?: string;
  children: React.ReactNode;
}

export function ModuleStatusGuard({
  moduleKey,
  moduleName,
  children,
}: ModuleStatusGuardProps) {
  const { t } = useTranslation();
  const { data: modules = [], isLoading, refetch } = usePublicModules();

  const currentModule = modules.find(
    (m) => (m.code || m.id)?.toLowerCase() === moduleKey.toLowerCase()
  );

  // While modules are loading, show neutral loading state to prevent screen flash
  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs font-mono text-muted-foreground">
            {t("common.loading")}
          </span>
        </div>
      </div>
    );
  }

  // If module not found in public list, proceed normally
  if (!currentModule) {
    return <>{children}</>;
  }

  // Defensively resolve enabled state (prevent undefined treating as disabled)
  const isExplicitlyDisabled =
    currentModule.status === "DISABLED" ||
    currentModule.isEnabled === false ||
    (currentModule as unknown as { enabled?: boolean }).enabled === false;

  // 1. Maintenance Mode
  if (currentModule.status === "MAINTENANCE") {
    const title = moduleName || currentModule.name || moduleKey;
    return (
      <div className="flex-1 w-full h-full min-h-[400px] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-6 text-center space-y-4 border-border/80 bg-card/90 shadow-lg backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground border border-border mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-muted text-foreground border border-border">
              {t("modules.status_maintenance")}
            </div>
            <h2 className="text-base font-bold text-foreground">
              {title} - {t("modules.guard_maintenance_title")}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("modules.guard_maintenance_desc")}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" asChild className="text-xs gap-1.5 h-7">
              <Link to="/projects">
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("modules.guard_back_to_projects")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs gap-1.5 h-7">
              <RefreshCw className="h-3.5 w-3.5" />
              {t("modules.guard_refresh")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 2. Disabled Mode
  if (isExplicitlyDisabled) {
    const title = moduleName || currentModule.name || moduleKey;
    return (
      <div className="flex-1 w-full h-full min-h-[400px] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-6 text-center space-y-4 border-border/80 bg-card/90 shadow-lg backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 mx-auto">
            <XCircle className="h-6 w-6" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/20">
              {t("modules.status_disabled")}
            </div>
            <h2 className="text-base font-bold text-foreground">
              {title} - {t("modules.guard_disabled_title")}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("modules.guard_disabled_desc")}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" asChild className="text-xs gap-1.5 h-7">
              <Link to="/projects">
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("modules.guard_back_to_projects")}
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
