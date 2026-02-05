import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NetworkMap } from "@/components/dashboard/network-map";
import { StatsPanel } from "@/components/dashboard/stats-panel";
import { AssetPanel } from "@/components/dashboard/asset-panel";
import { TopCenterStatus } from "@/components/dashboard/top-center-status";
import { MapStyleSelector } from "@/components/dashboard/map-style-selector";
import { SearchPanel } from "@/components/dashboard/search-panel";
import { Plus, Minus, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";

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

      {/* Floating Search Panel (Top Right) */}
      <div className="absolute top-20 right-6 z-20 pointer-events-auto w-80">
        <SearchPanel placeholder="Search areas or coordinates..." />
      </div>

      {/* Main Content Area */}
      <div className="absolute inset-0 pt-20 pb-6 px-6 flex pointer-events-none">
        {/* Left Panel */}
        <div className="pointer-events-auto">
          <StatsPanel />
        </div>

        {/* Map Controls */}
        <div className="pointer-events-auto fixed bottom-8 right-6 flex flex-col gap-2 z-20">
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-lg shadow-lg"
          >
            <Plus className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-lg shadow-lg"
          >
            <Minus className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            className="h-10 w-10 rounded-lg shadow-lg bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Crosshair className="w-5 h-5" />
          </Button>
        </div>

        {/* Right Panel */}
        <AssetPanel />
      </div>
    </div>
  );
}
