import * as React from "react";
import { Badge } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Check, Lock } from "lucide-react";
import type { PlatformModuleItem, ModulePlanTier } from "@/hooks/usePlatformModules";
import { PLAN_TIER_ORDER } from "./module-ui-helpers";

interface ModuleEntitlementsMatrixViewProps {
  modules: PlatformModuleItem[];
}

export function ModuleEntitlementsMatrixView({
  modules,
}: ModuleEntitlementsMatrixViewProps) {
  const { t } = useTranslation();

  const renderTierCell = (mod: PlatformModuleItem, tier: ModulePlanTier) => {
    if (mod.scope !== "TENANT") {
      return (
        <span className="text-[10px] text-muted-foreground font-mono">
          SYSTEM ONLY
        </span>
      );
    }
    const minReq = PLAN_TIER_ORDER[mod.minPlanTier] || 1;
    const currentTierVal = PLAN_TIER_ORDER[tier];
    const isIncluded = currentTierVal >= minReq;

    if (isIncluded) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
          <Check className="size-3.5" />
          {t("modules.tier_included")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <Lock className="size-3" />
        {t("modules.tier_requires", { tier: mod.minPlanTier })}
      </span>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-muted/40 border-b border-border/80 sticky top-0 z-10 backdrop-blur-xs">
          <tr className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
            <th className="py-2.5 px-4">{t("modules.table_code")}</th>
            <th className="py-2.5 px-4">{t("modules.table_name")}</th>
            <th className="py-2.5 px-4">{t("modules.table_scope")}</th>
            <th className="py-2.5 px-4 text-center">{t("modules.tier_free")}</th>
            <th className="py-2.5 px-4 text-center">{t("modules.tier_starter")}</th>
            <th className="py-2.5 px-4 text-center">{t("modules.tier_pro")}</th>
            <th className="py-2.5 px-4 text-center">{t("modules.tier_enterprise")}</th>
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
              <td className="py-2.5 px-4">
                <div className="font-semibold text-foreground">{mod.name}</div>
                <div className="text-[11px] text-muted-foreground line-clamp-1">
                  {mod.description}
                </div>
              </td>
              <td className="py-2.5 px-4">
                <Badge
                  variant={mod.scope === "SYSTEM" ? "secondary" : "outline"}
                  className="text-[10px]"
                >
                  {mod.scope}
                </Badge>
              </td>
              <td className="py-2.5 px-4 text-center">{renderTierCell(mod, "FREE")}</td>
              <td className="py-2.5 px-4 text-center">{renderTierCell(mod, "STARTER")}</td>
              <td className="py-2.5 px-4 text-center">{renderTierCell(mod, "PRO")}</td>
              <td className="py-2.5 px-4 text-center">{renderTierCell(mod, "ENTERPRISE")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
