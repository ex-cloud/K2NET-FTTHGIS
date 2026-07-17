"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  Settings,
  TrendingUp,
  Database,
  ShieldCheck,
} from "lucide-react";
import { MetricCard } from "./metric-card";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { getBackendBaseUrl } from "@/lib/api-config";
import { httpClient } from "@/lib/httpClient";

import { GlobalStatusSummary } from "./global-status-summary";
import { SystemHealthChart } from "./system-health-chart";
import {
  NetworkHistoryChart,
  type SnapshotPoint,
  type EventPoint,
  type TimeRange,
} from "./network-history-chart";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface HealthChartEntry {
  name: string;
  value: number;
  color: string;
}

interface NetworkEvent {
  id: number;
  assetCode: string;
  assetType: string;
  oldStatus: string;
  newStatus: string;
  eventType: string;
  timestamp: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_RANGES: TimeRange[] = [
  { label: "Last 1H", hours: 1 },
  { label: "Last 6H", hours: 6 },
  { label: "Last 24H", hours: 24 },
  { label: "Last 7D", hours: 168 },
  { label: "Last 30D", hours: 720 },
];

const POLL_INTERVAL_MS = 30_000; // 30 seconds

// ─── Main Component ───────────────────────────────────────────────────────────

export function ExecutiveDashboard() {
  const { data: session } = useSession();
  const params = useParams();
  const projectId = params?.projectId as string;

  // Core state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  // History state
  const [historyData, setHistoryData] = useState<SnapshotPoint[]>([]);
  const [eventData, setEventData] = useState<EventPoint[]>([]); // New state for Scatter Plot

  // Custom Zoom/Pan State
  const [zoomState, setZoomState] = useState<{ left: number; right: number }>({
    left: 0,
    right: 0,
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState<TimeRange>(TIME_RANGES[2]); // default: 24H

  // ─── Derived State (no setState inside setState!) ─────────────────────

  const healthData: NetworkHealthData | null = stats
    ? (() => {
        const total = stats.totalNodes || 1;
        const active = stats.activeNodes || 0;
        const down = stats.activeAlerts || 0;
        const warning = Math.max(0, total - active - down);
        return { healthy: active, warning, critical: down };
      })()
    : null;

  const healthPercentage =
    healthData &&
    healthData.healthy + healthData.warning + healthData.critical > 0
      ? Math.round(
          (healthData.healthy /
            (healthData.healthy + healthData.warning + healthData.critical)) *
            100,
        )
      : 0;

  const healthChartData: HealthChartEntry[] = healthData
    ? [
        { name: "Healthy", value: healthData.healthy, color: "#10b981" },
        { name: "Warning", value: healthData.warning, color: "#f59e0b" },
        { name: "Critical", value: healthData.critical, color: "#ef4444" },
      ]
    : [];

  // ─── Backend Fetch Functions ──────────────────────────────────────────

  const fetchStats = useCallback(
    async (silent = false) => {
      if (!session?.accessToken) return;
      try {
        if (!silent) setLoading(true);
        const baseUrl = getBackendBaseUrl();
        const res = await httpClient(
          `${baseUrl}/analytics/summary?t=${Date.now()}`,
          {
            token: session.accessToken,
            projectId,
          },
        );
        if (res.ok) {
          const data: DashboardStats = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error("Failed to fetch dashboard stats", e);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [session?.accessToken, projectId],
  );

  const fetchHistory = useCallback(
    async (hours: number) => {
      if (!session?.accessToken) return;
      try {
        setHistoryLoading(true);
        const baseUrl = getBackendBaseUrl();
        const now = new Date();
        const from = new Date(now.getTime() - hours * 60 * 60 * 1000);

        const toLocalISO = (date: Date) => {
          const tzOffset = date.getTimezoneOffset() * 60000;
          return new Date(date.getTime() - tzOffset).toISOString().slice(0, 19);
        };

        const toISO = toLocalISO(now);
        const fromISO = toLocalISO(from);

        const res = await httpClient(
          `${baseUrl}/analytics/history?from=${fromISO}&to=${toISO}`,
          { token: session.accessToken, projectId },
        );

        if (res.ok) {
          const data: Array<{
            recordedAt: string;
            totalNodes: number;
            activeNodes: number;
            downNodes: number;
            networkUptime: number;
          }> = await res.json();

          const points: SnapshotPoint[] = data.map((d) => ({
            time: new Date(d.recordedAt).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "short",
            }),
            activeNodes: d.activeNodes,
            downNodes: d.downNodes,
            uptime: d.networkUptime,
            rawDate: new Date(d.recordedAt),
          }));

          setHistoryData(points);
          setZoomState({ left: 0, right: Math.max(0, points.length - 1) });

          const eventsRes = await httpClient(
            `${baseUrl}/analytics/events?from=${fromISO}&to=${toISO}`,
            { token: session.accessToken },
          );

          if (eventsRes.ok) {
            const events: NetworkEvent[] = await eventsRes.json();
            const newEventPoints: EventPoint[] = [];

            events.forEach((evt) => {
              const evtTime = new Date(evt.timestamp).getTime();
              let closestPoint: SnapshotPoint | null = null;
              let minDiff = Infinity;

              for (const p of points) {
                const pTime = p.rawDate?.getTime() ?? 0;
                const diff = Math.abs(evtTime - pTime);
                if (diff < minDiff) {
                  minDiff = diff;
                  closestPoint = p;
                }
              }

              if (closestPoint) {
                let color = "#10b981";
                const s = evt.newStatus?.toUpperCase() ?? "";
                if (["DOWN", "FIBERCUT", "BROKEN"].includes(s))
                  color = "#ef4444";
                else if (s === "MAINTENANCE") color = "#f59e0b";

                const maxActive = Math.max(
                  ...points.map((p) => p.activeNodes),
                  10,
                );
                const safeMaxActive = Math.min(maxActive, 1000);

                const charSum = evt.assetCode
                  .split("")
                  .reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const jitterFactor = (charSum % 100) / 100;
                const jitteredY =
                  safeMaxActive * 0.15 + jitterFactor * (safeMaxActive * 0.7);

                newEventPoints.push({
                  time: closestPoint.time,
                  yValue: jitteredY,
                  color: color,
                  details: evt,
                });
              }
            });
            setEventData(newEventPoints);
          } else {
            setEventData([]);
          }
        }
      } catch (e) {
        console.error("Failed to fetch history", e);
        setHistoryData([]);
        setEventData([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [session?.accessToken, projectId],
  );

  const fetchHistoryByDateRange = useCallback(
    async (fromDate: string, toDate: string) => {
      if (!session?.accessToken || !fromDate || !toDate) return;
      try {
        setHistoryLoading(true);
        const baseUrl = getBackendBaseUrl();
        const fromISO = `${fromDate}T00:00:00`;
        const toISO = `${toDate}T23:59:59`;

        const res = await httpClient(
          `${baseUrl}/analytics/history?from=${fromISO}&to=${toISO}`,
          { token: session.accessToken, projectId },
        );

        if (res.ok) {
          const data: Array<{
            recordedAt: string;
            totalNodes: number;
            activeNodes: number;
            downNodes: number;
            networkUptime: number;
          }> = await res.json();

          const points: SnapshotPoint[] = data.map((d) => ({
            time: new Date(d.recordedAt).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "short",
            }),
            activeNodes: d.activeNodes,
            downNodes: d.downNodes,
            uptime: d.networkUptime,
          }));

          setHistoryData(points);
          setZoomState({ left: 0, right: Math.max(0, points.length - 1) });

          const eventsRes = await httpClient(
            `${baseUrl}/analytics/events?from=${fromISO}&to=${toISO}`,
            { token: session.accessToken, projectId },
          );

          if (eventsRes.ok) {
            const events: NetworkEvent[] = await eventsRes.json();
            const newEventPoints: EventPoint[] = [];

            events.forEach((evt) => {
              const evtTime = new Date(evt.timestamp).getTime();
              let closestPoint: SnapshotPoint | null = null;
              let minDiff = Infinity;
              for (const p of points) {
                const pTime = p.rawDate?.getTime() ?? 0;
                const diff = Math.abs(evtTime - pTime);
                if (diff < minDiff) {
                  minDiff = diff;
                  closestPoint = p;
                }
              }

              if (closestPoint) {
                let color = "#10b981";
                const s = evt.newStatus?.toUpperCase() ?? "";
                if (["DOWN", "FIBERCUT", "BROKEN"].includes(s))
                  color = "#ef4444";
                else if (s === "MAINTENANCE") color = "#f59e0b";

                const maxActive = Math.max(
                  ...points.map((p) => p.activeNodes),
                  10,
                );
                const safeMaxActive = Math.min(maxActive, 1000);

                const charSum = evt.assetCode
                  .split("")
                  .reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const jitterFactor = (charSum % 100) / 100;
                const jitteredY =
                  safeMaxActive * 0.15 + jitterFactor * (safeMaxActive * 0.7);

                newEventPoints.push({
                  time: closestPoint.time,
                  yValue: jitteredY,
                  color: color,
                  details: evt,
                });
              }
            });
            setEventData(newEventPoints);
          } else {
            setEventData([]);
          }
        }
      } catch (e) {
        console.error("Failed to fetch history by date range", e);
        setEventData([]);
        setHistoryData([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [session?.accessToken, projectId],
  );

  // ─── Effects ──────────────────────────────────────────────────────────

  // Initial fetch + polling
  useEffect(() => {
    if (!session?.accessToken) return;

    fetchStats();
    fetchHistory(selectedRange.hours);

    const pollTimer = setInterval(() => {
      fetchStats(true);
      fetchHistory(selectedRange.hours);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollTimer);
  }, [session?.accessToken, fetchStats, fetchHistory, selectedRange.hours]);

  // Real-time SSE events with DEBOUNCE & BATCHING
  useEffect(() => {
    const fetchTimeoutRef = { current: null as NodeJS.Timeout | null };

    const handleBatchRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{
        events: Array<{ assetCode: string; status: string }>;
      }>;
      const events = customEvent.detail.events;

      console.log(` Processing batch update: ${events.length} events`);

      setStats((prev) => {
        if (!prev) return prev;
        let newAlerts = prev.activeAlerts;
        let newActive = prev.activeNodes;

        events.forEach(({ status }) => {
          if (
            status === "DOWN" ||
            status === "BROKEN" ||
            status === "FIBERCUT"
          ) {
            newAlerts += 1;
            newActive = Math.max(0, newActive - 1);
          } else if (status === "UP" || status === "ACTIVE") {
            if (newAlerts > 0) newAlerts -= 1;
            newActive = Math.min(prev.totalNodes, newActive + 1);
          }
        });

        return {
          ...prev,
          activeAlerts: newAlerts,
          activeNodes: newActive,
          networkUptime:
            prev.totalNodes > 0
              ? Math.round((newActive / prev.totalNodes) * 10000) / 100
              : 100,
        };
      });

      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      fetchTimeoutRef.current = setTimeout(() => {
        console.log("🔄 Storm settled (Batch), fetching fresh stats...");
        fetchStats(true);
      }, 2000);
    };

    window.addEventListener("network-batch-update", handleBatchRefresh);

    return () => {
      window.removeEventListener("network-batch-update", handleBatchRefresh);
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [fetchStats]);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-24 min-h-full transition-colors duration-500 relative">
      {/* ── Top Metric Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Network Uptime"
          value={stats ? `${stats.networkUptime}%` : "--"}
          icon={Activity}
          trend={{
            value: stats ? `${stats.networkUptime}%` : "--",
            isUp: (stats?.networkUptime ?? 0) > 0,
          }}
          color="emerald"
        />
        <MetricCard
          title="Active Alerts"
          value={stats ? stats.activeAlerts.toString() : "-"}
          icon={AlertTriangle}
          trend={{
            value: stats ? stats.activeAlerts.toString() : "--",
            isUp: false,
          }}
          color="rose"
        />
        <MetricCard
          title="Maintenance Progress"
          value={stats ? `${stats.maintenanceProgress}%` : "--"}
          icon={Settings}
          progress={stats?.maintenanceProgress ?? 0}
          color="amber"
        />
        <MetricCard
          title="Customer Reach"
          value={stats ? stats.customerReach.toLocaleString() : "-"}
          icon={TrendingUp}
          trend={{
            value: stats ? stats.customerReach.toLocaleString() : "--",
            isUp: true,
          }}
          color="sky"
        />
      </div>

      {/* ── Global Network Status ── */}
      <GlobalStatusSummary stats={stats} />

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <NetworkHistoryChart
          historyData={historyData}
          eventData={eventData}
          historyLoading={historyLoading}
          selectedRange={selectedRange}
          setSelectedRange={setSelectedRange}
          fetchHistory={fetchHistory}
          fetchHistoryByDateRange={fetchHistoryByDateRange}
          zoomState={zoomState}
          setZoomState={setZoomState}
        />

        <SystemHealthChart
          loading={loading}
          healthPercentage={healthPercentage}
          healthChartData={healthChartData}
        />
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="mt-auto pt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800/60 pb-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              ENCRYPTION ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${loading ? "bg-sky-500 animate-pulse" : "bg-emerald-500"}`}
            />
            <span
              className={`text-[10px] font-bold ${loading ? "text-sky-500" : "text-primary"} uppercase tracking-widest`}
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
              {stats?.networkUptime.toFixed(1) ?? "0.0"}% UPTIME
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
              {stats?.activeNodes.toLocaleString() ?? "0"} Active Nodes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
