import { Badge, Button, ActionTooltip } from "@k2net/ui";
import { Sliders, Zap } from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import type { TenantSubscriptionSummary } from "@/hooks/useTenantSubscription";

interface HardwareHeaderBarProps {
  usedOlts: number;
  effectiveMaxOlts: number;
  isBoosterActive: boolean;
  summary: TenantSubscriptionSummary | null;
  onOpenBoosterModal: () => void;
  onOpenQuotaModal: () => void;
}

export function HardwareHeaderBar({
  usedOlts,
  effectiveMaxOlts,
  isBoosterActive,
  summary,
  onOpenBoosterModal,
  onOpenQuotaModal,
}: HardwareHeaderBarProps) {
  const { t } = useTranslation();

  return (
    <div className="p-4 rounded-xl border border-border bg-card/70 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xs font-bold text-foreground">
            {t("organizations.hw_section_title")}
          </h3>
          <Badge variant="outline" className="border-border text-[9px] font-mono px-1.5 py-0">
            {t("organizations.hw_active_olts_badge", { used: usedOlts, total: effectiveMaxOlts })}
          </Badge>

          {isBoosterActive && (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-500 font-mono text-[9px] gap-1">
              <Zap className="h-3 w-3" />
              <span>
                {t("organizations.hw_booster_badge", {
                  odps: summary?.boosterOdps || 0,
                  days: summary?.boosterDaysRemaining || 0,
                })}
              </span>
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t("organizations.hw_section_subtitle", { poller: "ftth-poller:5010" })}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <ActionTooltip label={t("organizations.hw_emergency_booster_tooltip")}>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenBoosterModal}
            className="h-7 px-2.5 text-xs font-medium border-amber-500/30 bg-card hover:bg-amber-500/10 text-amber-500 gap-1.5 shadow-2xs cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>{t("organizations.hw_emergency_booster_btn")}</span>
          </Button>
        </ActionTooltip>

        <ActionTooltip label={t("organizations.hw_adjust_quotas_tooltip")} shortcut="Q">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenQuotaModal}
            className="h-7 px-2.5 text-xs font-medium border-border bg-card hover:bg-muted text-foreground gap-1.5 shadow-2xs cursor-pointer"
          >
            <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{t("organizations.hw_adjust_quotas_btn")}</span>
          </Button>
        </ActionTooltip>
      </div>
    </div>
  );
}
