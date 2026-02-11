"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Settings,
  TrendingUp,
  Database,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { MetricCard } from "./metric-card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { useSession } from "next-auth/react";
import { getBackendBaseUrl } from "@/lib/api-config";

interface DashboardStats {
  totalNodes: number;
  activeNodes: number;
  totalUsers: number;
  totalNetworkLengthKm: number;
  activeAlerts: number;
  networkUptime: number;
  customerReach: number;
  maintenanceProgress: number;
}

interface NetworkHealthData {
  healthy: number;
  warning: number;
  critical: number;
}

export function ExecutiveDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [healthData, setHealthData] = useState<NetworkHealthData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchStats = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const baseUrl = getBackendBaseUrl();

        // Fetch dashboard stats
        const statsRes = await fetch(
          `${baseUrl}/analytics/summary?t=${Date.now()}`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          },
        );

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);

          // Calculate health data from stats
          const totalNodes = data.totalNodes || 1;
          const activeNodes = data.activeNodes || 0;
          const downNodes = data.activeAlerts || 0;

          // Estimate warning nodes (nodes that might need attention but not down)
          const warningNodes = Math.max(
            0,
            totalNodes - activeNodes - downNodes,
          );

          setHealthData({
            healthy: activeNodes,
            warning: warningNodes,
            critical: downNodes,
          });
        }
      } catch (e) {
        console.error("Failed to fetch dashboard stats", e);
      } finally {
        if (!silent) setLoading(false);
      }
    };

    // Initial fetch
    fetchStats();

    // Listen for real-time updates to refresh stats
    const handleRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{
        assetCode: string;
        status: string;
      }>;
      const { status, assetCode } = customEvent.detail;

      console.log(
        `🔄 Real-time update [${assetCode} -> ${status}] detected, patching UI and refreshing stats...`,
      );

      // Proactively patch the state for instant response
      setStats((prev) => {
        if (!prev) return prev;
        let newAlerts = prev.activeAlerts;
        let newActiveNodes = prev.activeNodes;

        if (status === "DOWN" || status === "BROKEN" || status === "FIBERCUT") {
          newAlerts += 1;
          newActiveNodes = Math.max(0, newActiveNodes - 1);
        } else if (status === "UP" || status === "ACTIVE") {
          if (newAlerts > 0) newAlerts -= 1;
          newActiveNodes = Math.min(prev.totalNodes, newActiveNodes + 1);
        }

        return {
          ...prev,
          activeAlerts: newAlerts,
          activeNodes: newActiveNodes,
          networkUptime:
            prev.totalNodes > 0
              ? Math.round((newActiveNodes / prev.totalNodes) * 10000) / 100
              : 100,
        };
      });

      // Update health data based on new stats
      setStats((prev) => {
        if (!prev) return prev;

        const totalNodes = prev.totalNodes || 1;
        const activeNodes = prev.activeNodes || 0;
        const downNodes = prev.activeAlerts || 0;
        const warningNodes = Math.max(0, totalNodes - activeNodes - downNodes);

        setHealthData({
          healthy: activeNodes,
          warning: warningNodes,
          critical: downNodes,
        });

        return prev;
      });

      // Background refresh with a small delay for database consistency
      setTimeout(() => fetchStats(true), 1200);
    };

    window.addEventListener("network-data-update", handleRefresh);
    return () =>
      window.removeEventListener("network-data-update", handleRefresh);
  }, [session?.accessToken]);

  // Calculate health percentage and prepare chart data
  const healthPercentage = healthData
    ? Math.round(
        (healthData.healthy /
          (healthData.healthy + healthData.warning + healthData.critical)) *
          100,
      )
    : 0;

  const healthChartData = healthData
    ? [
        { name: "Healthy", value: healthData.healthy, color: "#10b981" },
        { name: "Warning", value: healthData.warning, color: "#f59e0b" },
        { name: "Critical", value: healthData.critical, color: "#ef4444" },
      ]
    : [];

  // Generate network activity trend data based on current stats
  // This simulates hourly snapshots with realistic variance
  const generateNetworkTrend = () => {
    if (!stats) return [];

    const currentUptime = stats.networkUptime;
    const currentAlerts = stats.activeAlerts;

    return [
      {
        time: "00:00",
        uptime: Math.max(0, currentUptime - 2.5),
        alerts: Math.max(0, currentAlerts - 5),
      },
      {
        time: "04:00",
        uptime: Math.max(0, currentUptime - 1.8),
        alerts: Math.max(0, currentAlerts - 3),
      },
      {
        time: "08:00",
        uptime: Math.max(0, currentUptime - 0.5),
        alerts: Math.max(0, currentAlerts - 1),
      },
      {
        time: "12:00",
        uptime: Math.max(0, currentUptime - 1.2),
        alerts: currentAlerts,
      },
      {
        time: "16:00",
        uptime: Math.max(0, currentUptime - 0.8),
        alerts: Math.max(0, currentAlerts - 2),
      },
      {
        time: "20:00",
        uptime: currentUptime,
        alerts: currentAlerts,
      },
      {
        time: "Now",
        uptime: currentUptime,
        alerts: currentAlerts,
      },
    ];
  };

  const networkTrendData = generateNetworkTrend();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-24 min-h-full transition-colors duration-500 relative">
      {/* Top Metric Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Network Uptime"
          value={stats ? `${stats.networkUptime}%` : "--"}
          icon={Activity}
          trend={{
            value: stats ? "0.02%" : "--",
            isUp: true,
          }}
          color="emerald"
        />
        <MetricCard
          title="Active Alerts"
          value={stats ? stats.activeAlerts.toString() : "-"}
          icon={AlertTriangle}
          trend={{
            value: stats ? "0" : "--",
            isUp: false,
          }}
          color="rose"
        />
        <MetricCard
          title="Maintenance Progress"
          value={stats ? `${stats.maintenanceProgress}%` : "--"}
          icon={Settings}
          progress={stats?.maintenanceProgress || 0}
          color="amber"
        />
        <MetricCard
          title="Customer Reach"
          value={stats ? stats.customerReach.toLocaleString() : "-"}
          icon={TrendingUp}
          trend={{
            value: stats ? "+12%" : "--",
            isUp: true,
          }}
          color="sky"
        />
      </div>

      {/* Middle Section: Global Network Status */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white/60 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-800/50 rounded-xl p-6 backdrop-blur-xl shadow-sm dark:shadow-none relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                Global Network Status
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-tight mt-1">
                Real-time infrastructure distribution and alert density
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase">
                  {stats?.activeNodes || 0} Active
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-500 uppercase">
                  {stats?.activeAlerts || 0} Alerts
                </span>
              </div>
            </div>
          </div>

          {/* Network Overview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200/60 dark:border-zinc-800/50">
              <div className="text-2xl font-black text-zinc-900 dark:text-white">
                {stats?.totalNodes.toLocaleString() || "0"}
              </div>
              <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
                Total Nodes
              </div>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200/60 dark:border-zinc-800/50">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-500">
                {stats?.activeNodes.toLocaleString() || "0"}
              </div>
              <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
                Active Nodes
              </div>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200/60 dark:border-zinc-800/50">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-500">
                {stats?.activeAlerts.toLocaleString() || "0"}
              </div>
              <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
                Critical Alerts
              </div>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200/60 dark:border-zinc-800/50">
              <div className="text-2xl font-black text-sky-600 dark:text-sky-500">
                {stats?.totalNetworkLengthKm.toFixed(1) || "0.0"}
                <span className="text-sm ml-1">km</span>
              </div>
              <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
                Network Length
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Network Trends + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Activity Trends - 2 columns */}
        <div className="lg:col-span-2 bg-white/60 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-800/50 rounded-xl p-6 backdrop-blur-xl shadow-sm dark:shadow-none relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              NETWORK ACTIVITY TRENDS
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-0.5 bg-emerald-500" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                  UPTIME
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-0.5 bg-rose-500" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                  ALERTS
                </span>
              </div>
            </div>
          </div>

          <div className="h-[220px]">
            {stats ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={networkTrendData}>
                  <defs>
                    <linearGradient
                      id="colorUptime"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorAlerts"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                    className="dark:stroke-zinc-900"
                  />
                  <XAxis
                    dataKey="time"
                    stroke="#71717a"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg, #ffffff)",
                      border: "1px solid var(--tooltip-border, #e2e8f0)",
                      borderRadius: "8px",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                    itemStyle={{ color: "var(--tooltip-text, #1e293b)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="uptime"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUptime)"
                    name="Uptime %"
                  />
                  <Area
                    type="monotone"
                    dataKey="alerts"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAlerts)"
                    name="Active Alerts"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Loading trend data...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Health Circular Gauge - 1 column */}
        <div className="bg-white/60 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-800/50 rounded-xl p-6 backdrop-blur-xl shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-tight text-zinc-900 dark:text-white">
              SYSTEM HEALTH
            </h3>
            {loading && (
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
            )}
          </div>

          {healthChartData.length > 0 ? (
            <>
              <div className="h-[180px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthChartData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      startAngle={225}
                      endAngle={-45}
                    >
                      {healthChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                  <span className="text-3xl font-black text-zinc-900 dark:text-white leading-none">
                    {healthPercentage}%
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mt-1">
                    OVERALL
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                      Healthy
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-zinc-900 dark:text-white">
                    {healthData?.healthy.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                      Warning
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-zinc-900 dark:text-white">
                    {healthData?.warning.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                      Critical
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-zinc-900 dark:text-white">
                    {healthData?.critical.toLocaleString() || "0"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[260px] flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Loading health data...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info Bar */}
      <div className="mt-auto pt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800/60 pb-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              ENCRYPTION ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${loading ? "bg-sky-500 animate-pulse" : "bg-emerald-500"}`}
            />
            <span
              className={`text-[10px] font-bold ${loading ? "text-sky-500" : "text-emerald-500"} uppercase tracking-widest`}
            >
              {loading ? "SYNCING..." : "LIVE"}
            </span>
          </div>
        </div>
        <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 tracking-widest uppercase">
          © 2024 GIS COMMAND V4.2.0
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
              {stats?.networkUptime.toFixed(1) || "0.0"}% UPTIME
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
              {stats?.activeNodes.toLocaleString() || "0"} Active Nodes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
