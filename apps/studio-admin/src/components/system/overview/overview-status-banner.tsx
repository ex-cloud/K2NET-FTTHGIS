

import { FloatingBanner } from "@k2net/ui";

type HealthState = "operational" | "warning" | "critical" | "loading";

interface OverviewStatusBannerProps {
  globalHealthState: HealthState;
  activeGatewaysCount: number;
  totalGatewaysCount: number;
}

export function OverviewStatusBanner({
  globalHealthState,
  activeGatewaysCount,
  totalGatewaysCount,
}: OverviewStatusBannerProps) {
  if (globalHealthState === "loading") return null;

  if (globalHealthState === "operational") {
    return (
      <FloatingBanner
        variant="success"
        badgeText="SYSTEM STATUS"
        title="All Core Services Operational"
        description="Tenant routing, authentication, and GIS services are currently operating within normal parameters."
        storageKey="k2net-overview-status-operational"
      />
    );
  }

  if (globalHealthState === "warning") {
    return (
      <FloatingBanner
        variant="warning"
        badgeText="SYSTEM WARNING"
        title="Some Gateways Offline"
        description={`Only ${activeGatewaysCount}/${totalGatewaysCount} gateways are currently responding. Certain platform services may be partially degraded.`}
        storageKey="k2net-overview-status-warning"
      />
    );
  }

  // Critical Outage - No storageKey so it remains visible until resolved
  return (
    <FloatingBanner
      variant="error"
      badgeText="CRITICAL OUTAGE"
      title="All Microservice Gateways Down"
      description="The platform is currently reporting a critical gateway outage. Immediate infrastructure review is advised."
    />
  );
}
