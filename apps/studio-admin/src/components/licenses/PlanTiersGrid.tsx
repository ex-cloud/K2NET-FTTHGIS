import * as React from "react";
import { Card, Button, Badge } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  Sliders,
  Check,
  X,
  Server,
  Split,
  Box,
  Users,
  Archive,
  Shield,
  Terminal,
} from "lucide-react";
import type { SubscriptionPlanMaster } from "@/hooks/useSubscriptionPlans";

interface PlanTiersGridProps {
  plans: SubscriptionPlanMaster[];
  loading?: boolean;
  onEdit: (plan: SubscriptionPlanMaster) => void;
}

function formatIdr(val?: number): string {
  if (typeof val !== "number" || isNaN(val) || val <= 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

export function PlanTiersGrid({ plans, loading, onEdit }: PlanTiersGridProps) {
  const { t } = useTranslation();

  // Sort plans standard order: FREE -> STARTER -> PRO -> ENTERPRISE
  const sortedPlans = React.useMemo(() => {
    const tierOrder: Record<string, number> = {
      FREE: 1,
      STARTER: 2,
      PRO: 3,
      ENTERPRISE: 4,
    };
    return [...plans].sort((a, b) => {
      const orderA = tierOrder[a.name.toUpperCase()] ?? 99;
      const orderB = tierOrder[b.name.toUpperCase()] ?? 99;
      return orderA - orderB;
    });
  }, [plans]);

  if (loading && sortedPlans.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-96 animate-pulse bg-muted/20 border-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {sortedPlans.map((plan) => {
        const isFree = plan.price === 0;
        const isEnterprise = plan.name.toUpperCase() === "ENTERPRISE";
        const isPro = plan.name.toUpperCase() === "PRO";

        return (
          <Card
            key={plan.id}
            glowingEffect={isPro || isEnterprise}
            className={`p-5 flex flex-col justify-between bg-card border-border transition-shadow hover:shadow-md ${
              isPro ? "border-primary/40 ring-1 ring-primary/20" : ""
            }`}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-foreground">
                    {plan.name}
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {plan.description || "—"}
                  </p>
                </div>
                {isFree ? (
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {t("license.plans.free_badge")}
                  </Badge>
                ) : isPro ? (
                  <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] font-mono">
                    POPULAR
                  </Badge>
                ) : isEnterprise ? (
                  <Badge className="bg-foreground/5 text-foreground border-border text-[10px] font-mono">
                    ENTERPRISE
                  </Badge>
                ) : null}
              </div>

              {/* Price */}
              <div className="pt-1 pb-2 border-b border-border/60">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                    {isFree ? "Free" : formatIdr(plan.price)}
                  </span>
                  {!isFree && (
                    <span className="text-xs text-muted-foreground">
                      {t("license.plans.per_month")}
                    </span>
                  )}
                </div>
              </div>

              {/* Hardware Quotas Matrix */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-mono tracking-wider uppercase text-foreground/75 dark:text-muted-foreground font-semibold block">
                  {t("license.plans.base_quotas_heading")}
                </span>

                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Server className="size-3.5" />
                      {t("license.modal.max_projects_olts")}
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {plan.maxProjects?.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Split className="size-3.5" />
                      {t("license.modal.max_odps")}
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {plan.maxOdps?.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Box className="size-3.5" />
                      {t("license.modal.max_odcs")}
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {plan.maxOdcs?.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="size-3.5" />
                      {t("license.modal.max_customers")}
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {plan.maxCustomers?.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Archive className="size-3.5" />
                      {t("organizations.quotas.archived_projects")}
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {plan.maxArchivedProjects ?? 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features Entitlements */}
              <div className="space-y-2 text-xs pt-1 border-t border-border/60">
                <span className="text-[10px] font-mono tracking-wider uppercase text-foreground/75 dark:text-muted-foreground font-semibold block">
                  {t("license.plans.features_heading")}
                </span>

                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Shield className="size-3.5" />
                      {t("license.plans.sso_label")}
                    </span>
                    {plan.hasSso ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-foreground font-medium">
                        <Check className="size-3 text-primary" />
                        {t("common.enabled")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-muted-foreground/60 text-[11px]">
                        <X className="size-3" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Terminal className="size-3.5" />
                      {t("license.plans.api_label")}
                    </span>
                    {plan.hasApiAccess ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-foreground font-medium">
                        <Check className="size-3 text-primary" />
                        {t("common.enabled")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-muted-foreground/60 text-[11px]">
                        <X className="size-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-4 mt-4 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(plan)}
                className="w-full gap-1.5 text-xs font-medium"
              >
                <Sliders className="size-3.5" />
                <span>{t("license.plans.edit_plan_title")}</span>
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
