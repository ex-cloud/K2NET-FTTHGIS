import * as React from "react";
import { Button, Badge } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  Building2,
  Calendar,
  AlertCircle,
  RefreshCcw,
  ArrowUpRight,
} from "lucide-react";
import type { TenantSubscriptionItem } from "@/hooks/useBillingSubscriptions";

export interface TenantSubscriptionsTableProps {
  filteredSubs: TenantSubscriptionItem[];
  isSubsLoading: boolean;
  onOpenWizard: (sub: TenantSubscriptionItem) => void;
  formatIdr: (val?: number) => string;
}

export function TenantSubscriptionsTable({
  filteredSubs,
  isSubsLoading,
  onOpenWizard,
  formatIdr,
}: TenantSubscriptionsTableProps) {
  const { t } = useTranslation();

  return (
    <div className="border border-border/80 rounded-lg overflow-hidden bg-card shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground text-[11px] font-semibold">
              <th className="py-2.5 px-3">{t("billing.table_header_tenant")}</th>
              <th className="py-2.5 px-3">{t("billing.table_header_plan_version")}</th>
              <th className="py-2.5 px-3">{t("billing.table_header_cycle")}</th>
              <th className="py-2.5 px-3">{t("billing.table_header_status")}</th>
              <th className="py-2.5 px-3">{t("billing.table_header_period")}</th>
              <th className="py-2.5 px-3 text-right">{t("billing.table_header_rate")}</th>
              <th className="py-2.5 px-3 text-center">{t("billing.table_header_overrides")}</th>
              <th className="py-2.5 px-3 text-right">{t("billing.table_header_actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isSubsLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCcw className="size-4 animate-spin text-primary" />
                    <span>{t("billing.loading_subscriptions")}</span>
                  </div>
                </td>
              </tr>
            ) : filteredSubs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  <AlertCircle className="size-5 mx-auto mb-1 text-muted-foreground/60" />
                  <p className="font-medium text-foreground">{t("billing.no_subscriptions_found")}</p>
                  <p className="text-[11px] mt-0.5">{t("billing.no_subscriptions_desc")}</p>
                </td>
              </tr>
            ) : (
              filteredSubs.map((sub) => {
                const hasCustomOverrides =
                  sub.overrideMaxProjects != null ||
                  sub.overrideMaxOlts != null ||
                  sub.overrideMaxOdps != null ||
                  sub.overrideMaxStorageGb != null;

                const daysLeft = sub.currentPeriodEnd
                  ? Math.ceil(
                      (new Date(sub.currentPeriodEnd).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : null;

                return (
                  <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                    {/* Organization */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <Building2 className="size-3 text-muted-foreground" />
                          {sub.organizationName || sub.organizationSlug}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {sub.organizationSlug}
                          </span>
                          {sub.test && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/40 text-amber-500 bg-amber-500/10">
                              {t("billing.badge_test")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Plan & Version */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-foreground">
                          {sub.planName}
                        </span>
                        {sub.version && (
                          <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">
                            {sub.version}
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Billing Cycle */}
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-mono uppercase text-muted-foreground">
                        {sub.billingCycle}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono ${
                          sub.status === "ACTIVE"
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : sub.status === "GRACE_PERIOD"
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                            : "border-destructive/40 bg-destructive/10 text-destructive"
                        }`}
                      >
                        {sub.status}
                      </Badge>
                    </td>

                    {/* Period */}
                    <td className="py-2.5 px-3 text-[11px]">
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="size-3" />
                          {sub.currentPeriodEnd ? sub.currentPeriodEnd.substring(0, 10) : "—"}
                        </span>
                        {daysLeft != null && (
                          <span className={`text-[10px] font-mono block ${daysLeft <= 14 ? "text-amber-500 font-medium" : "text-muted-foreground"}`}>
                            {t("billing.days_remaining_badge", { count: daysLeft })}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-foreground">
                      {formatIdr(sub.priceMonthly)}
                    </td>

                    {/* Overrides Badge */}
                    <td className="py-2.5 px-3 text-center">
                      {hasCustomOverrides ? (
                        <Badge variant="outline" className="text-[9px] font-mono border-border bg-muted/40">
                          {t("billing.badge_custom")}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/40 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onOpenWizard(sub)}
                        className="gap-1 h-6 px-2 text-[11px] font-medium border-border/80 hover:bg-muted"
                      >
                        <ArrowUpRight className="size-3" />
                        <span>{t("billing.plan_change_action")}</span>
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
  );
}
