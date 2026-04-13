"use client";

import {
  Zap,
  Users,
  Router,
  TrendingUp,
  AlertTriangle,
  Wrench,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";

interface Stats {
  totalNodes: number;
  totalOdc: number;
  totalOdp: number;
  totalCableLengthKm: number;
  totalUsers: number;
  growthPercentage: number;
  activeMaintenanceCount: number;
  topCapacities: {
    label: string;
    percentage: number;
    color: string;
  }[];
  activeMaintenances: {
    id: string;
    code: string;
    type: string;
    description: string;
    severity: "critical" | "warning" | "info";
  }[];
}

export function StatsPanel() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      if (!session?.accessToken) return;

      try {
        const baseUrl = getBackendBaseUrl();
        const res = await fetch(`${baseUrl}/network/analytics/stats`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch statistics");
        const data = await res.json();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch stats", err);
        setError("Unable to connect to analytics engine");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();

    // Listen for batched real-time network updates to refresh stats
    const handleNetworkBatchUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{
        events: Array<{ assetCode: string; status: string }>;
      }>;
      const events = customEvent.detail.events;

      console.log(
        `[Stats Sync] Refreshing due to batch update (${events.length} events)`,
      );

      // Debounced fetch
      // We don't need complex debounce here because the event itself is already a 300ms batch.
      // But to be safe, we can trigger it.
      fetchStats();
    };

    window.addEventListener("network-batch-update", handleNetworkBatchUpdate);
    return () =>
      window.removeEventListener(
        "network-batch-update",
        handleNetworkBatchUpdate,
      );
  }, [session?.accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-24 bg-background/50 backdrop-blur rounded-xl border border-border/50">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 text-center">
        {error || "No data available"}
      </div>
    );
  }

  const getCapacityColor = (color: string) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
      case "sky":
        return "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]";
      default:
        return "bg-zinc-500";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: "bg-red-500/10 text-red-500",
        };
      default:
        return {
          icon: <Wrench className="w-4 h-4" />,
          color: "bg-amber-500/10 text-amber-500",
        };
    }
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex flex-col gap-4">
        {/* Network Statistics Card */}
        <Card className="bg-background/60 backdrop-blur border-white/10 dark:border-white/5 shadow-sm">
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Network Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 px-3 pb-3">
            <div className="bg-muted/50 p-2.5 rounded-lg border border-border/50">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
                <Zap className="w-2.5 h-2.5 text-emerald-500" /> Cable
              </div>
              <div className="text-sm font-bold font-mono leading-tight">
                {stats.totalCableLengthKm.toFixed(1)} KM
              </div>
            </div>
            <div className="bg-muted/50 p-2.5 rounded-lg border border-border/50">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
                <Users className="w-2.5 h-2.5 text-sky-500" /> Users
              </div>
              <div className="text-sm font-bold font-mono text-emerald-500 leading-tight">
                {stats.totalUsers.toLocaleString()}
              </div>
            </div>
            <div className="bg-muted/50 p-2.5 rounded-lg border border-border/50">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
                <Router className="w-2.5 h-2.5 text-muted-foreground" /> Nodes
              </div>
              <div className="text-sm font-bold font-mono leading-tight">
                {stats.totalNodes.toLocaleString()}
              </div>
            </div>
            <div className="bg-muted/50 p-2.5 rounded-lg border border-border/50">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
                <TrendingUp className="w-2.5 h-2.5 text-muted-foreground" /> Growth
              </div>
              <div className="text-sm font-bold font-mono text-emerald-500 leading-tight">
                +{stats.growthPercentage}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capacity Monitoring */}
        <Card className="bg-background/60 backdrop-blur border-white/10 dark:border-white/5 shadow-sm">
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Capacity Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-3 pb-3">
            {stats.topCapacities?.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground font-mono truncate mr-2">
                    {item.label}
                  </span>
                  <span
                    className={`${item.percentage > 70 ? "text-emerald-500" : "text-sky-500"} font-bold shrink-0`}
                  >
                    {item.percentage}%
                  </span>
                </div>
                <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getCapacityColor(item.color)}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {(!stats.topCapacities || stats.topCapacities.length === 0) && (
              <div className="text-[10px] text-muted-foreground text-center py-3">
                No capacity data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Maintenance */}
        <Card className="bg-background/60 backdrop-blur border-white/10 dark:border-white/5 shadow-sm">
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            {stats.activeMaintenances?.map((item, idx) => {
              const { icon, color } = getSeverityIcon(item.severity);
              return (
                <div
                  key={idx}
                  className="group flex items-center gap-2 p-2 bg-muted/40 border border-border/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${color}`}
                  >
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold font-mono truncate">
                      {item.code}
                    </div>
                    <div className="text-[9px] text-muted-foreground uppercase truncate">
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                </div>
              );
            })}
            {(!stats.activeMaintenances ||
              stats.activeMaintenances.length === 0) && (
              <div className="text-[10px] text-muted-foreground text-center py-4">
                All systems optimal. No active issues.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

