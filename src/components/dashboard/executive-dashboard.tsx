"use client";

import React from "react";
import {
  Activity,
  AlertTriangle,
  Settings,
  TrendingUp,
  Database,
  ShieldCheck,
} from "lucide-react";
import { MetricCard } from "./metric-card";
import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const MOCK_TRAFFIC_DATA = [
  { time: "00:00", traffic: 2400, latency: 40 },
  { time: "04:00", traffic: 1398, latency: 35 },
  { time: "08:00", traffic: 9800, latency: 65 },
  { time: "12:00", traffic: 3908, latency: 45 },
  { time: "16:00", traffic: 4800, latency: 50 },
  { time: "20:00", traffic: 3800, latency: 42 },
  { time: "23:59", traffic: 4300, latency: 48 },
];

const MOCK_HEALTH_DATA = [
  { name: "Healthy", value: 92, color: "#10b981" },
  { name: "Warning", value: 5, color: "#f59e0b" },
  { name: "Critical", value: 3, color: "#ef4444" },
];

export function ExecutiveDashboard() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-24 min-h-full transition-colors duration-500 relative">
      {/* Top Metric Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Network Uptime"
          value="99.9%"
          icon={Activity}
          trend={{ value: "0.02%", isUp: true }}
          color="emerald"
        />
        <MetricCard
          title="Active Alerts"
          value="12"
          icon={AlertTriangle}
          trend={{ value: "3", isUp: false }}
          color="rose"
        />
        <MetricCard
          title="Maintenance Progress"
          value="85%"
          icon={Settings}
          progress={85}
          color="amber"
        />
        <MetricCard
          title="Customer Reach"
          value="50.95M"
          icon={TrendingUp}
          trend={{ value: "1.2M", isUp: true }}
          color="sky"
        />
      </div>

      {/* Middle Section: Global Network Status (Visual Representation) */}
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
                  Active Nodes
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-500 uppercase">
                  Critical Alerts
                </span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full flex items-center justify-center">
            {/* Large Central Network Map Visualization Placeholder */}
            <div className="relative w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_TRAFFIC_DATA}>
                  <defs>
                    <linearGradient
                      id="colorTraffic"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
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
                    dataKey="traffic"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTraffic)"
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Visual points representing nodes */}
              <div className="absolute top-1/4 left-1/3 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
              <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
              <div className="absolute top-2/3 left-1/4 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_#ef4444]" />
              <div className="absolute top-1/3 left-3/4 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
              <div className="absolute top-3/4 left-2/3 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Traffic & Latency + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic & Latency Trends */}
        <div className="lg:col-span-2 bg-white/60 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-800/50 rounded-xl p-6 backdrop-blur-xl shadow-sm dark:shadow-none relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              TRAFFIC & LATENCY TRENDS
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-0.5 bg-sky-500" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                  TRAFFIC
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-0.5 bg-emerald-500" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                  LATENCY
                </span>
              </div>
            </div>
          </div>

          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_TRAFFIC_DATA}>
                <defs>
                  <linearGradient id="colorSky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEmerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                  dataKey="traffic"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSky)"
                />
                <Area
                  type="monotone"
                  dataKey="latency"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEmerald)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health Circular Gauge */}
        <div className="bg-white/60 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-800/50 rounded-xl p-6 backdrop-blur-xl shadow-sm dark:shadow-none">
          <h3 className="text-sm font-bold uppercase tracking-tight text-zinc-900 dark:text-white mb-6">
            SYSTEM HEALTH
          </h3>
          <div className="h-[180px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_HEALTH_DATA}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={225}
                  endAngle={-45}
                >
                  {MOCK_HEALTH_DATA.map((entry, index) => (
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
                92%
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
                2,410
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
                421
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
                12
              </span>
            </div>
          </div>
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
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
            <span className="uppercase tracking-widest">UPTIME:</span>
            <span className="text-zinc-700 dark:text-zinc-300">
              142D 12H 45M 11S
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
              4.2 Gbps
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
              2,443 Active Nodes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
