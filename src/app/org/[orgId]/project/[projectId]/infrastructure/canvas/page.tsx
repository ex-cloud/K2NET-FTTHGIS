import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NetworkMap } from "@/components/dashboard/network-map";
import { TopCenterStatus } from "@/components/dashboard/top-center-status";
import { MapStyleSelector } from "@/components/dashboard/map-style-selector";
import { SearchPanel } from "@/components/dashboard/search-panel";

export default async function CanvasPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-transparent">
      {/* Real GIS Map Layer w/ Drawing Enabled */}
      <div className="absolute inset-0 z-0">
        <NetworkMap allowEditing={true} />
      </div>

      {/* Floating Status Bar (Top Center) */}
      <TopCenterStatus />

      {/* Map Style Selector (Top Center - Lower) */}
      <MapStyleSelector />

      {/* Floating Search Panel (Top Right) */}
      <div className="absolute top-20 right-6 z-20 pointer-events-auto w-80">
        <SearchPanel placeholder="Search areas or coordinates..." />
      </div>
    </div>
  );
}
