import * as React from "react";
import { PageHero, Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Sliders, RefreshCcw } from "lucide-react";
import {
  useSubscriptionPlans,
  type SubscriptionPlanMaster,
} from "@/hooks/useSubscriptionPlans";
import { PlanKpiCards } from "@/components/licenses/PlanKpiCards";
import { PlanTiersGrid } from "@/components/licenses/PlanTiersGrid";
import { EditSubscriptionPlanModal } from "@/components/licenses/EditSubscriptionPlanModal";

export default function LicensePlansPage() {
  const { t } = useTranslation();
  const { data: plans = [], isLoading, refetch, isFetching } = useSubscriptionPlans();

  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlanMaster | null>(null);
  const [editModalOpen, setEditModalOpen] = React.useState<boolean>(false);

  const handleOpenEdit = (plan: SubscriptionPlanMaster) => {
    setSelectedPlan(plan);
    setEditModalOpen(true);
  };

  return (
    <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">
      {/* Page Hero Header */}
      <div className="px-4 md:px-6 shrink-0">
        <PageHero
          bordered={false}
          className="pb-0"
          eyebrow={t("license.hero_eyebrow")}
          title={t("nav.plan_tiers_quotas")}
          icon={Sliders}
          subtitle={t("license.plans.subtitle")}
          meta={
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground/90 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">{plans.length}</span>
                <span>{t("license.plans.kpi_total_plans")}</span>
              </div>
              <span className="text-muted-foreground/30 px-1">/</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">
                  {plans.filter((p) => p.hasSso).length}
                </span>
                <span>SSO Ready</span>
              </div>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-1.5 text-xs font-medium"
              >
                <RefreshCcw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
                <span>{t("common.refresh")}</span>
              </Button>
            </div>
          }
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-8 space-y-6">
        <PlanKpiCards plans={plans} loading={isLoading} />
        <PlanTiersGrid plans={plans} loading={isLoading} onEdit={handleOpenEdit} />
      </div>

      {/* Edit Plan Modal */}
      <EditSubscriptionPlanModal
        plan={selectedPlan}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      />
    </div>
  );
}
