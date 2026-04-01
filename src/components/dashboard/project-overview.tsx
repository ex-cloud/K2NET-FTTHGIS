"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Database,
  Shield,
  HardDrive,
  Radio,
  Activity,
  CheckCircle2,
  GitBranch,
  BarChart3,
  Plus,
  Server,
  AlertCircle,
  ArrowUpRight,
  Network,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { getBackendBaseUrl } from "@/lib/api-config";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectStats {
  totalNodes: number;
  activeNodes: number;
  totalOdc: number;
  totalOdp: number;
  totalCables: number;
  activeAlerts: number;
  networkUptime: number;
}

interface MetricBoxProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: number;
  description?: string;
  color?: string;
}

// ─── Metric Box Component ─────────────────────────────────────────────────────

function MetricBox({
  icon: Icon,
  label,
  value,
  trend,
  description,
  color = "emerald",
}: MetricBoxProps) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-500",
    blue: "text-blue-500",
    violet: "text-violet-500",
    amber: "text-amber-500",
    rose: "text-rose-500",
  };

  return (
    <div className="flex flex-col gap-3 p-4 border border-border rounded-xl bg-card hover:bg-accent/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <Icon className={`w-4 h-4 ${colorMap[color] || colorMap.emerald}`} />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-foreground tabular-nums">
          {value}
        </span>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-emerald-500" : "text-rose-500"}`}
          >
            <ArrowUpRight
              className={`w-3 h-3 ${trend < 0 ? "rotate-180" : ""}`}
            />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {description && (
        <div className="mt-1 h-12 flex items-end">
          <div className="w-full h-8 flex items-end gap-0.5">
            {/* Sparkline placeholder bars */}
            {[30, 45, 35, 60, 40, 55, 50, 65, 45, 70].map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm opacity-40 ${colorMap[color]?.replace("text-", "bg-") || "bg-emerald-500"}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {description || "No data for selected period"}
      </p>
    </div>
  );
}

// ─── Advisor Card Component ───────────────────────────────────────────────────

function AdvisorCard({ issueCount }: { issueCount: number }) {
  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Advisor</h3>
        <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-2.5 py-1 rounded-md hover:bg-accent">
          <BarChart3 className="w-3.5 h-3.5" />
          Ask Assistant
        </button>
      </div>
      <div className="px-5 py-4">
        {issueCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-60" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Advisor found no issues
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                No security or performance errors found
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {Array.from({ length: issueCount }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-xs text-foreground">
                  Issue detected – review your configuration
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Database Info Card ───────────────────────────────────────────────────────

function DatabaseInfoCard({ projectId }: { projectId: string }) {
  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          Project Infrastructure
        </h3>
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
          Active
        </span>
      </div>
      <div className="p-5 flex items-center gap-4">
        <div className="flex aspect-square h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Server className="h-7 w-7 text-blue-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Primary Backend</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Indonesia (Jakarta)
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1 font-mono">
            {projectId} · api.ftthgis.local
          </p>
        </div>
        <div className="shrink-0">
          {/* Indonesian flag approximation */}
          <div className="w-8 h-6 rounded overflow-hidden border border-border flex flex-col">
            <div className="flex-1 bg-red-500" />
            <div className="flex-1 bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reports Section ──────────────────────────────────────────────────────────

function ReportsSection() {
  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Reports</h3>
        <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-2.5 py-1 rounded-md hover:bg-accent">
          <Plus className="w-3.5 h-3.5" />
          Add block
        </button>
      </div>
      <div className="flex flex-col items-center justify-center px-5 py-12 gap-3 text-center">
        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-muted-foreground/60" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Build a custom report
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Keep track of your most important metrics
          </p>
        </div>
        <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md hover:bg-accent mt-1">
          <Plus className="w-3.5 h-3.5" />
          Add your first block
        </button>
      </div>
    </div>
  );
}

// ─── Project Status Cards ─────────────────────────────────────────────────────

function StatusCard({
  label,
  value,
  icon: Icon,
  status,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  status?: "ok" | "warn" | "none";
}) {
  const statusColor =
    status === "ok"
      ? "text-emerald-500"
      : status === "warn"
        ? "text-amber-500"
        : "text-muted-foreground";
  return (
    <div className="flex items-center gap-3 p-4 border border-border rounded-xl bg-card hover:bg-accent/30 transition-colors">
      <div className="flex aspect-square h-9 w-9 items-center justify-center rounded-lg bg-muted/50">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className={`text-sm font-medium mt-0.5 truncate ${statusColor}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProjectOverview() {
  const { data: session } = useSession();
  const params = useParams();
  const projectId = params?.projectId as string;

  const [stats, setStats] = React.useState<ProjectStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [timeFilter, setTimeFilter] = React.useState("Last 60 minutes");

  const timeOptions = [
    "Last 5 minutes",
    "Last 15 minutes",
    "Last 60 minutes",
    "Last 24 hours",
    "Last 7 days",
  ];

  const fetchStats = React.useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const baseUrl = getBackendBaseUrl();
      const headers: HeadersInit = {
        Authorization: `Bearer ${session.accessToken}`,
      };
      if (projectId) headers["X-Project-ID"] = projectId;

      const res = await fetch(`${baseUrl}/network/dashboard/stats`, {
        headers,
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch {
      // Use placeholder stats for now if backend endpoint not available
      setStats({
        totalNodes: 0,
        activeNodes: 0,
        totalOdc: 0,
        totalOdp: 0,
        totalCables: 0,
        activeAlerts: 0,
        networkUptime: 99.9,
      });
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, projectId]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="flex flex-col gap-6 px-6 py-6 max-w-7xl mx-auto w-full">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex aspect-square h-12 w-12 items-center justify-center rounded-xl bg-card border border-border shadow-sm">
            <Network className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                FTTH GIS
              </h1>
              <span className="text-[10px] font-bold text-amber-500 uppercase border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full">
                NANO
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {typeof window !== "undefined"
                ? window.location.origin
                : "https://api.ftthgis.local"}
              /project/{projectId}
            </p>
          </div>
        </div>
      </div>

      {/* Status Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatusCard
          label="Status"
          value="Healthy"
          icon={Activity}
          status="ok"
        />
        <StatusCard
          label="Last Migration"
          value="No migrations"
          icon={GitBranch}
          status="none"
        />
        <StatusCard
          label="Last Backup"
          value="No backups"
          icon={HardDrive}
          status="none"
        />
        <StatusCard
          label="Recent Branch"
          value="No branches"
          icon={GitBranch}
          status="none"
        />
      </div>

      {/* --- Total Requests Section --- */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">
            <span className="text-muted-foreground text-xl font-bold mr-2">
              {stats ? stats.totalNodes : "0"}
            </span>
            Total Requests
          </h2>
          <div className="relative">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="h-8 text-xs border border-border bg-card rounded-md px-3 pr-8 text-muted-foreground appearance-none cursor-pointer hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {timeOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <svg
                className="w-3 h-3 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricBox
            icon={Database}
            label="Database Requests"
            value={loading ? "—" : 0}
            color="blue"
            description="No data for selected period"
          />
          <MetricBox
            icon={Shield}
            label="Auth Requests"
            value={loading ? "—" : 0}
            color="violet"
            description="No data for selected period"
          />
          <MetricBox
            icon={HardDrive}
            label="Storage Requests"
            value={loading ? "—" : 0}
            color="amber"
            description="No data for selected period"
          />
          <MetricBox
            icon={Radio}
            label="Realtime Requests"
            value={loading ? "—" : 0}
            color="emerald"
            description="No data for selected period"
          />
        </div>
      </div>

      {/* --- Network Stats Section --- */}
      {stats &&
        (stats.totalOdc > 0 || stats.totalOdp > 0 || stats.totalNodes > 0) && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">
              Network Infrastructure
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricBox
                icon={Activity}
                label="Total Nodes"
                value={stats.totalNodes}
                color="emerald"
              />
              <MetricBox
                icon={Activity}
                label="Active Nodes"
                value={stats.activeNodes}
                color="blue"
              />
              <MetricBox
                icon={Database}
                label="ODC Points"
                value={stats.totalOdc}
                color="violet"
              />
              <MetricBox
                icon={Database}
                label="ODP Points"
                value={stats.totalOdp}
                color="amber"
              />
            </div>
          </div>
        )}

      {/* --- Advisor + DB Info Row --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AdvisorCard issueCount={stats?.activeAlerts || 0} />
        </div>
        <div>
          <DatabaseInfoCard projectId={projectId} />
        </div>
      </div>

      {/* --- Reports Section --- */}
      <ReportsSection />
    </div>
  );
}
