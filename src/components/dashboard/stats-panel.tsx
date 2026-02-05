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
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/network/analytics/stats`,
        );
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
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-96 h-32 bg-background/50 backdrop-blur rounded-xl border border-border/50">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="w-96 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 text-center">
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
          icon: <AlertTriangle className="w-5 h-5" />,
          color: "bg-red-500/10 text-red-500",
        };
      default:
        return {
          icon: <Wrench className="w-5 h-5" />,
          color: "bg-amber-500/10 text-amber-500",
        };
    }
  };

  return (
    <ScrollArea className="h-full pr-4 w-96">
      <div className="flex flex-col gap-6">
        {/* Network Statistics Card */}
        <Card className="bg-background/60 backdrop-blur border-white/10 dark:border-white/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Network Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Zap className="w-3 h-3 text-emerald-500" /> Real Time
              </div>
              <div className="text-lg font-bold font-mono">
                {stats.totalCableLengthKm.toFixed(2)} KM
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Users className="w-3 h-3 text-sky-500" /> Users
              </div>
              <div className="text-lg font-bold font-mono text-emerald-500">
                {stats.totalUsers.toLocaleString()}
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Router className="w-3 h-3 text-muted-foreground" /> Nodes
              </div>
              <div className="text-lg font-bold font-mono">
                {stats.totalNodes.toLocaleString()}
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <TrendingUp className="w-3 h-3 text-muted-foreground" /> Growth
              </div>
              <div className="text-lg font-bold font-mono text-emerald-500">
                +{stats.growthPercentage}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capacity Monitoring */}
        <Card className="bg-background/60 backdrop-blur border-white/10 dark:border-white/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Capacity Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.topCapacities?.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground font-mono">
                    {item.label}
                  </span>
                  <span
                    className={`${item.percentage > 70 ? "text-emerald-500" : "text-sky-500"} font-bold`}
                  >
                    {item.percentage}%
                  </span>
                </div>
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getCapacityColor(item.color)}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {(!stats.topCapacities || stats.topCapacities.length === 0) && (
              <div className="text-xs text-muted-foreground text-center py-4">
                No capacity data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Maintenance */}
        <Card className="bg-background/60 backdrop-blur border-white/10 dark:border-white/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.activeMaintenances?.map((item, idx) => {
              const { icon, color } = getSeverityIcon(item.severity);
              return (
                <div
                  key={idx}
                  className="group flex items-center gap-3 p-3 bg-muted/40 border border-border/50 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
                  >
                    {icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold font-mono">
                      {item.code}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase">
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              );
            })}
            {(!stats.activeMaintenances ||
              stats.activeMaintenances.length === 0) && (
              <div className="text-xs text-muted-foreground text-center py-6">
                All systems optimal. No active issues.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
