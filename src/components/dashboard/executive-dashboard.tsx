"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Activity,
  AlertTriangle,
  Settings,
  TrendingUp,
  Database,
  ShieldCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { MetricCard } from "./metric-card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart,
  Area,
} from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import { useSession } from "next-auth/react";
import { getBackendBaseUrl } from "@/lib/api-config";

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

interface SnapshotPoint {
  time: string;
  activeNodes: number;
  downNodes: number;
  uptime: number;
}

interface TimeRange {
  label: string;
  hours: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<Payload<ValueType, NameType>>;
  label?: string;
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

// ─── Tooltip Component ───────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-xl min-w-[170px]">
      <p className="text-xs font-bold text-zinc-900 dark:text-white mb-2 border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
        {label}
      </p>
      {payload.map((entry, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-4 py-0.5"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color ?? "#71717a" }}
            />
            <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
              {String(entry.name ?? "")}
            </span>
          </div>
          <span
            className="text-[11px] font-bold"
            style={{ color: entry.color ?? "#71717a" }}
          >
            {String(entry.name ?? "").includes("Uptime")
              ? `${Number(entry.value ?? 0).toFixed(2)}%`
              : Number(entry.value ?? 0).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ExecutiveDashboard() {
  const { data: session } = useSession();

  // Core state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  // History state
  const [historyData, setHistoryData] = useState<SnapshotPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState<TimeRange>(TIME_RANGES[2]); // default: 24H
  const [historyPage, setHistoryPage] = useState(0);
  const historyPageSize = 24; // show 24 data points at a time

  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarFrom, setCalendarFrom] = useState("");
  const [calendarTo, setCalendarTo] = useState("");
  const calendarRef = useRef<HTMLDivElement>(null);

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

  // History pagination
  const totalPages = Math.max(
    1,
    Math.ceil(historyData.length / historyPageSize),
  );
  const paginatedHistory = historyData.slice(
    historyPage * historyPageSize,
    (historyPage + 1) * historyPageSize,
  );

  // ─── Backend Fetch Functions ──────────────────────────────────────────

  const fetchStats = useCallback(
    async (silent = false) => {
      if (!session?.accessToken) return;
      try {
        if (!silent) setLoading(true);
        const baseUrl = getBackendBaseUrl();
        const res = await fetch(
          `${baseUrl}/analytics/summary?t=${Date.now()}`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` },
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
    [session?.accessToken],
  );

  const fetchHistory = useCallback(
    async (hours: number) => {
      if (!session?.accessToken) return;
      try {
        setHistoryLoading(true);
        const baseUrl = getBackendBaseUrl();
        const now = new Date();
        const from = new Date(now.getTime() - hours * 60 * 60 * 1000);

        // Fix: Send Local Time ISO string to match Backend's LocalDateTime.now()
        // Backend stores data in Local Time (System Default), but toISOString() sends UTC.
        // We must offset the date to trick toISOString() into outputting local time.
        const toLocalISO = (date: Date) => {
          const tzOffset = date.getTimezoneOffset() * 60000;
          return new Date(date.getTime() - tzOffset).toISOString().slice(0, 19);
        };

        const toISO = toLocalISO(now);
        const fromISO = toLocalISO(from);

        const res = await fetch(
          `${baseUrl}/analytics/history?from=${fromISO}&to=${toISO}`,
          { headers: { Authorization: `Bearer ${session.accessToken}` } },
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
          setHistoryPage(
            Math.max(0, Math.ceil(points.length / historyPageSize) - 1),
          ); // go to last page
        }
      } catch (e) {
        console.error("Failed to fetch history", e);
      } finally {
        setHistoryLoading(false);
      }
    },
    [session?.accessToken],
  );

  const fetchHistoryByDateRange = useCallback(
    async (fromDate: string, toDate: string) => {
      if (!session?.accessToken || !fromDate || !toDate) return;
      try {
        setHistoryLoading(true);
        const baseUrl = getBackendBaseUrl();
        const fromISO = `${fromDate}T00:00:00`;
        const toISO = `${toDate}T23:59:59`; // Already local time format from input

        const res = await fetch(
          `${baseUrl}/analytics/history?from=${fromISO}&to=${toISO}`,
          { headers: { Authorization: `Bearer ${session.accessToken}` } },
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
          setHistoryPage(
            Math.max(0, Math.ceil(points.length / historyPageSize) - 1),
          );
        }
      } catch (e) {
        console.error("Failed to fetch history by date range", e);
      } finally {
        setHistoryLoading(false);
        setShowCalendar(false);
      }
    },
    [session?.accessToken],
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

  // Real-time SSE events with DEBOUNCE
  // Real-time SSE events with DEBOUNCE & BATCHING
  useEffect(() => {
    // Ref to hold the timeout ID
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

        // Process all events in this batch in a single pass
        events.forEach(({ status }) => {
          if (
            status === "DOWN" ||
            status === "BROKEN" ||
            status === "FIBERCUT"
          ) {
            // Heuristic: If we receive DOWN event, increment alerts.
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

      // DEBOUNCED Background refresh
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

  // Click outside calendar to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(e.target as Node)
      ) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      {/* ── Global Network Status ──────────────────────────────────────── */}
      <div className="bg-white/60 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-800/50 rounded-xl p-6 backdrop-blur-xl shadow-sm dark:shadow-none relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white">
              Global Network Status
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-tight mt-1">
              Real-time infrastructure overview
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase">
                {stats?.activeNodes ?? 0} Active
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-500 uppercase">
                {stats?.activeAlerts ?? 0} Alerts
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200/60 dark:border-zinc-800/50">
            <div className="text-2xl font-black text-zinc-900 dark:text-white">
              {stats?.totalNodes.toLocaleString() ?? "0"}
            </div>
            <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
              Total Nodes
            </div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200/60 dark:border-zinc-800/50">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-500">
              {stats?.activeNodes.toLocaleString() ?? "0"}
            </div>
            <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
              Active Nodes
            </div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200/60 dark:border-zinc-800/50">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-500">
              {stats?.activeAlerts.toLocaleString() ?? "0"}
            </div>
            <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
              Critical Alerts
            </div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200/60 dark:border-zinc-800/50">
            <div className="text-2xl font-black text-sky-600 dark:text-sky-500">
              {stats?.totalNetworkLengthKm.toFixed(1) ?? "0.0"}
              <span className="text-sm ml-1">km</span>
            </div>
            <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
              Network Length
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* History Chart with Navigation + Filter */}
        <div className="lg:col-span-2 bg-white/60 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-800/50 rounded-xl p-6 backdrop-blur-xl shadow-sm dark:shadow-none relative overflow-hidden">
          {/* Header with controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <h3 className="text-sm font-bold uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              NODE STATUS HISTORY
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Time range pills */}
              {TIME_RANGES.map((range) => (
                <button
                  key={range.label}
                  onClick={() => {
                    setSelectedRange(range);
                    setHistoryPage(0);
                    fetchHistory(range.hours);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                    selectedRange.label === range.label
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {range.label}
                </button>
              ))}

              {/* Calendar button */}
              <div className="relative" ref={calendarRef}>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                  title="Pick date range"
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>

                {showCalendar && (
                  <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 shadow-2xl min-w-[280px]">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white mb-3">
                      Custom Date Range
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                          From
                        </label>
                        <input
                          type="date"
                          value={calendarFrom}
                          onChange={(e) => setCalendarFrom(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                          To
                        </label>
                        <input
                          type="date"
                          value={calendarTo}
                          onChange={(e) => setCalendarTo(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <button
                        onClick={() =>
                          fetchHistoryByDateRange(calendarFrom, calendarTo)
                        }
                        disabled={!calendarFrom || !calendarTo}
                        className="w-full py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-0.5 bg-emerald-500" />
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                ACTIVE
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-0.5 bg-rose-500" />
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                DOWN
              </span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[260px]">
            {historyLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Loading history...
                  </p>
                </div>
              </div>
            ) : paginatedHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paginatedHistory}>
                  <defs>
                    <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                    className="dark:stroke-zinc-800"
                  />
                  <XAxis
                    dataKey="time"
                    stroke="#71717a"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{
                      stroke: "#10b981",
                      strokeWidth: 2,
                      strokeDasharray: "5 5",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="activeNodes"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#gradActive)"
                    name="Active Nodes"
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-in-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="downNodes"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#ef4444" }}
                    activeDot={{ r: 5, fill: "#ef4444" }}
                    name="Down Nodes"
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-in-out"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Activity className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    No history data yet. Snapshots are recorded every 5 minutes.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pagination arrows */}
          {historyData.length > historyPageSize && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                disabled={historyPage === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3 h-3" />
                Older
              </button>
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500">
                Page {historyPage + 1} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setHistoryPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={historyPage >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Newer
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* System Health Donut */}
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
                      isAnimationActive={true}
                      animationDuration={1000}
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
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                    OVERALL
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {healthChartData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-zinc-900 dark:text-white">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
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

      {/* ── Footer ───────────────────────────────────────────────────── */}
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
              {stats?.networkUptime.toFixed(1) ?? "0.0"}% UPTIME
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
              {stats?.activeNodes.toLocaleString() ?? "0"} Active Nodes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
