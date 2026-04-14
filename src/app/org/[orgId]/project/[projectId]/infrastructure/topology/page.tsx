import * as React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NetworkMap } from "@/components/dashboard/network-map";
import { AssetPanel } from "@/components/dashboard/asset-panel";
import { TopCenterStatus } from "@/components/dashboard/top-center-status";
import { MapStyleSelector } from "@/components/dashboard/map-style-selector";
import { FloatingWidgets } from "@/components/dashboard/floating-widgets";

export default async function TopologyPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-transparent">
      {/* Real GIS Map Layer */}
      <div className="absolute inset-0 z-0">
        <NetworkMap />
      </div>

      {/* Floating Status Bar (Top Center) */}
      <TopCenterStatus />

      {/* Map Style Selector (Top Center - Lower) */}
      <MapStyleSelector />

      {/* New Floating Widgets Layer (Search & Stats) Client Component */}
      <FloatingWidgets />

      {/* Main Content Area (Right Panel and others) */}
      <div className="absolute inset-0 pt-20 pb-6 px-6 flex pointer-events-none z-10">
        <AssetPanel />
      </div>
    </div>
  );
}
