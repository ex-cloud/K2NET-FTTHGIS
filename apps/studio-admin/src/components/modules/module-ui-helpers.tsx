import * as React from "react";
import { Badge } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { CheckCircle2, AlertTriangle, XCircle, Boxes } from "lucide-react";
import type { ModuleStatus, ModulePlanTier } from "@/hooks/usePlatformModules";

export const PLAN_TIER_ORDER: Record<ModulePlanTier, number> = {
  FREE: 1,
  STARTER: 2,
  PRO: 3,
  ENTERPRISE: 4,
};

export function ModuleStatusBadge({ status }: { status: ModuleStatus }) {
  const { t } = useTranslation();
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
}

export function ModuleTierBadge({ tier }: { tier: string }) {
  let style = "bg-muted text-muted-foreground border-border";
  if (tier === "STARTER") style = "bg-muted text-foreground font-semibold border-border/80";
  if (tier === "PRO") style = "bg-foreground/10 text-foreground font-semibold border-border";
  if (tier === "ENTERPRISE") style = "bg-foreground text-background font-bold border-foreground";

  return (
    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${style}`}>
      {tier}
    </span>
  );
}

export function PureModuleBadge() {
  const { t } = useTranslation();
  return (
    <span
      title={t("modules.pure_module_tooltip")}
      className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono tracking-wider bg-muted text-muted-foreground border border-border"
    >
      <Boxes className="size-2.5 mr-0.5" />
      SSOT
    </span>
  );
}
