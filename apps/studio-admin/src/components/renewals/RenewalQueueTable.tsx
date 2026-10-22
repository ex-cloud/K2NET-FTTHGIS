import * as React from "react";
import { Card, Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Clock, RefreshCcw, Bell } from "lucide-react";
import { LifecycleStatusBadge } from "@/components/common/LifecycleStatusBadge";
import type { RenewalQueueItem } from "@/hooks/useBillingRenewals";

export interface RenewalQueueTableProps {
  queue: RenewalQueueItem[];
  isLoading: boolean;
  onTriggerReminder: (item: RenewalQueueItem) => void;
}

export function RenewalQueueTable({
  queue,
  isLoading,
  onTriggerReminder,
}: RenewalQueueTableProps) {
  const { t } = useTranslation();

  return (
    <Card className="border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-muted-foreground font-medium">
              <th className="py-2.5 px-3 font-medium">{t("billing.th_tenant")}</th>
              <th className="py-2.5 px-3 font-medium">{t("billing.th_plan")}</th>
              <th className="py-2.5 px-3 font-medium">{t("billing.th_due_date")}</th>
              <th className="py-2.5 px-3 font-medium">{t("billing.th_dunning_stage")}</th>
              <th className="py-2.5 px-3 font-medium">{t("billing.th_contact")}</th>
              <th className="py-2.5 px-3 font-medium">{t("billing.th_last_notified")}</th>
              <th className="py-2.5 px-3 font-medium text-right">{t("billing.th_actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  <RefreshCcw className="size-5 animate-spin mx-auto mb-2 text-primary" />
                  <span>{t("common.loading")}</span>
                </td>
              </tr>
            ) : queue.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  <Clock className="size-6 mx-auto mb-2 opacity-40" />
                  <p>{t("billing.empty_queue")}</p>
                </td>
              </tr>
            ) : (
              queue.map((item) => {
                const isOverdue = item.daysRemaining < 0;

                return (
                  <tr
                    key={item.licenseId}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    {/* Tenant */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {item.organizationName}
                        </span>
                        {item.organizationSlug && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {item.organizationSlug}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Plan Tier */}
                    <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                      {item.planName}
                    </td>

                    {/* Due Date & Remaining */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className={`font-mono ${isOverdue ? "text-destructive font-medium" : "text-foreground"}`}>
                          {item.validUntil ? new Date(item.validUntil).toLocaleDateString() : "—"}
                        </span>
                        <span
                          className={`text-[10px] font-mono ${
                            isOverdue
                              ? "text-destructive"
                              : item.daysRemaining <= 7
                              ? "text-amber-500 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {isOverdue
                            ? t("billing.days_overdue", { count: Math.abs(item.daysRemaining) })
                            : t("billing.days_left", { count: item.daysRemaining })}
                        </span>
                      </div>
                    </td>

                    {/* Dunning Stage */}
                    <td className="py-2.5 px-3">
                      <LifecycleStatusBadge status={item.dunningStage} size="xs" />
                    </td>

                    {/* Billing Contact */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col text-[11px] font-mono">
                        <span className="text-foreground truncate max-w-[160px]">
                          {item.billingContactEmail || "—"}
                        </span>
                        {item.billingContactPhone && (
                          <span className="text-[10px] text-muted-foreground">
                            {item.billingContactPhone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Last Notified */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col text-[10px] font-mono text-muted-foreground">
                        <span>{item.lastNotifiedStage || "NEVER"}</span>
                        {item.lastNotifiedAt && (
                          <span>{new Date(item.lastNotifiedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onTriggerReminder(item)}
                        className="h-6 px-2 text-[11px] font-medium border-primary/40 text-primary hover:bg-primary/10 gap-1"
                      >
                        <Bell className="size-3" />
                        <span>{t("billing.action_trigger_reminder")}</span>
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
