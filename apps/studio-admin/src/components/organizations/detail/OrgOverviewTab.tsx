import type { EnrichedOrganization } from "../types";
import { useTenantSubscription } from "@/hooks/useTenantSubscription";
import { OverviewIdentityCard } from "./overview/OverviewIdentityCard";
import { OverviewTelemetryBanner } from "./overview/OverviewTelemetryBanner";
import { OverviewResourceCards } from "./overview/OverviewResourceCards";
import { OverviewSubscriptionCard } from "./overview/OverviewSubscriptionCard";
import { OverviewModulesCard } from "./overview/OverviewModulesCard";

interface OrgOverviewTabProps {
  organization: EnrichedOrganization;
  onOpenPlanUpgrade?: () => void;
}

export function OrgOverviewTab({
  organization: org,
  onOpenPlanUpgrade,
}: OrgOverviewTabProps) {
  const { summary } = useTenantSubscription(org.slug);

  const effectiveMaxOlts = summary?.effectiveMaxOlts ?? org.maxOlts;
  const effectiveMaxOdps = summary?.effectiveMaxOdps ?? org.maxOdps;
  const usedOlts = summary?.usedOlts ?? org.usedOlts;
  const usedOdps = summary?.usedOdps ?? org.usedOdps;

  const oltPct = effectiveMaxOlts > 0 ? Math.round((usedOlts / effectiveMaxOlts) * 100) : 0;
  const odpPct = effectiveMaxOdps > 0 ? Math.round((usedOdps / effectiveMaxOdps) * 100) : 0;
  const storagePct = org.maxStorageGb > 0 ? Math.round((org.usedStorageGb / org.maxStorageGb) * 100) : 0;
  const rpmPct = org.apiRateLimitMax > 0 ? Math.min(100, Math.round((org.apiRateLimitUsed / org.apiRateLimitMax) * 100)) : 0;

  const activeStatus = summary?.status ?? org.status;

  return (
    <div className="space-y-6">
      <OverviewIdentityCard
        org={org}
        summary={summary}
        usedOlts={usedOlts}
        effectiveMaxOlts={effectiveMaxOlts}
        usedOdps={usedOdps}
        effectiveMaxOdps={effectiveMaxOdps}
        activeStatus={activeStatus}
      />

      <OverviewTelemetryBanner org={org} />

      <OverviewResourceCards
        org={org}
        usedOlts={usedOlts}
        effectiveMaxOlts={effectiveMaxOlts}
        oltPct={oltPct}
        usedOdps={usedOdps}
        effectiveMaxOdps={effectiveMaxOdps}
        odpPct={odpPct}
        storagePct={storagePct}
        rpmPct={rpmPct}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OverviewSubscriptionCard
          org={org}
          summary={summary}
          onOpenPlanUpgrade={onOpenPlanUpgrade}
        />

        <OverviewModulesCard org={org} />
      </div>
    </div>
  );
}
