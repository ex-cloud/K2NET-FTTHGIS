

import { FloatingBanner } from "@k2net/ui";
import type { GatewayServiceStatus } from "@/lib/actions/gateways";

type HealthState = "operational" | "warning" | "critical" | "loading";

interface OverviewStatusBannerProps {
  globalHealthState: HealthState;
  activeGatewaysCount: number;
  totalGatewaysCount: number;
  gateways?: GatewayServiceStatus[];
}

export function OverviewStatusBanner({
  globalHealthState,
  activeGatewaysCount,
  totalGatewaysCount,
  gateways = [],
}: OverviewStatusBannerProps) {
  if (globalHealthState === "loading") return null;

  const offlineGateways = gateways.filter((g) => !g.active).map((g) => g.name);

  if (globalHealthState === "operational") {
    return (
      <FloatingBanner
        variant="success"
        badgeText="SYSTEM STATUS"
        title="All Core Services Operational"
        description="Tenant routing, authentication, and GIS services are currently operating within normal parameters."
        actionText="Lihat Observability"
        onAction={() => window.location.assign("/observability/overview")}
        storageKey="k2net-overview-status-operational"
      />
    );
  }

  if (globalHealthState === "warning") {
    const offlineListText =
      offlineGateways.length > 0
        ? `Layanan offline: ${offlineGateways.slice(0, 3).join(", ")}${offlineGateways.length > 3 ? ` (+${offlineGateways.length - 3} lainnya)` : ""}.`
        : "";
    return (
      <FloatingBanner
        variant="warning"
        badgeText="SYSTEM DEGRADED"
        title={`${totalGatewaysCount - activeGatewaysCount} Gateway Offline`}
        description={`Hanya ${activeGatewaysCount}/${totalGatewaysCount} gateway yang merespons. ${offlineListText} Silakan inspeksi telemetri gateway.`}
        actionText="Buka Gateways Control"
        onAction={() => window.location.assign("/gateways/overview")}
        storageKey="k2net-overview-status-warning"
      />
    );
  }

  // Critical Outage - Detailed breakdown & direct action
  const offlineDetail =
    offlineGateways.length > 0
      ? `Layanan tidak merespons: ${offlineGateways.slice(0, 4).join(", ")}${offlineGateways.length > 4 ? ` (+${offlineGateways.length - 4} lainnya)` : ""}.`
      : "Seluruh microservice gateway tidak dapat dihubungi atau mengalami timeout.";

  return (
    <FloatingBanner
      variant="error"
      badgeText="CRITICAL OUTAGE"
      title="Microservice Gateways Unreachable"
      description={`${offlineDetail} Rekomendasi: Periksa status API Gateway dan traffic routing di menu Observability.`}
      actionText="Buka Observability API Gateway"
      onAction={() => window.location.assign("/observability/api-gateway")}
    />
  );
}
