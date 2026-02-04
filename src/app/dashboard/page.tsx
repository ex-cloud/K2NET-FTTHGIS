import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NetworkMap } from "@/components/dashboard/network-map";
import { StatsPanel } from "@/components/dashboard/stats-panel";
import { AssetPanel } from "@/components/dashboard/asset-panel";
import { TopCenterStatus } from "@/components/dashboard/top-center-status";
import { SearchPanel } from "@/components/dashboard/search-panel";
import { FileText, Bell, Plus, Minus, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* Real GIS Map Layer */}
      <div className="absolute inset-0 z-0">
        <NetworkMap />
      </div>

      {/* Top Header Controls (Floating) */}
      <div className="absolute top-0 left-0 right-0 h-16 px-6 flex items-center justify-between z-10 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-4 flex-1">
          <SearchPanel />
        </div>
        <div className="pointer-events-auto flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 backdrop-blur border border-border/40 cursor-pointer hover:bg-muted transition-colors">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium">Report</span>
          </div>
          <div className="h-8 w-px bg-border/40 mx-2"></div>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
          </Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
            <Plus className="w-4 h-4" />
            Report Asset
          </Button>
        </div>
      </div>

      {/* Floating Status Bar (Top Center) */}
      <TopCenterStatus />

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
