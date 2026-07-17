"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

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
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-emerald-500/5 p-4 transition-all duration-300">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-primary">All Core Services Operational</h4>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            Tenant routing, authentication, and GIS services are currently operating within normal parameters.
          </p>
        </div>
      </div>
    );
  }

  if (globalHealthState === "warning") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 transition-all duration-300">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-amber-400">Some Gateways Offline</h4>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            Only {activeGatewaysCount}/{totalGatewaysCount} gateways are currently responding. Certain platform services
            may be partially degraded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 transition-all duration-300">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
        <AlertTriangle className="h-5 w-5 text-red-500" />
      </div>
      <div>
        <h4 className="text-xs font-semibold text-red-400">All Microservice Gateways Down</h4>
        <p className="mt-0.5 text-[10px] text-zinc-400">
          The platform is currently reporting a critical gateway outage. Immediate infrastructure review is advised.
        </p>
      </div>
    </div>
  );
}
