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
  Map as MapIcon,
  ArrowRight,
  Search,
  Edit3,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useMapStore } from "@/store/map-store";
import { useSelectionStore } from "@/store/selection-store";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectStats {
  totalNodes: number;
  activeNodes: number;
  totalUsers: number;
  totalNetworkLengthKm: number;
  activeAlerts: number;
  networkUptime: number;
  customerReach: number;
  maintenanceProgress: number;
  issues?: IssueDetail[];
}

interface IssueDetail {
  code: string;
  type: string;
  status: string;
  lastNote: string;
  lng: number;
  lat: number;
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

function AdvisorCard({
  issues = [],
  projectId,
}: {
  issues?: IssueDetail[];
  projectId: string;
  orgId: string;
}) {
  const router = useRouter();
  const { setMapCenter } = useMapStore();
  const { setSelectedAsset } = useSelectionStore();

  const handleFlyToMap = (issue: IssueDetail) => {
    // 1. Set global map state to jump focus
    setMapCenter({
      lng: issue.lng,
      lat: issue.lat,
      zoom: 18,
    });

    // 2. Select the asset to trigger pulse/highlight
    setSelectedAsset({
      id: "fly-" + issue.code,
      type: issue.type,
      code: issue.code,
      lng: issue.lng,
      lat: issue.lat,
      status: issue.status,
    });

    // 3. Navigate to map route
    router.push(`/org/${orgId}/project/${projectId}/infrastructure/topology?flyTo=${issue.code}`);
  };

  const handleFlyToTable = (issue: IssueDetail) => {
    const tablePath = issue.type.toLowerCase();
    // Navigate to specific inventory table with search param
    router.push(`/org/${orgId}/project/${projectId}/inventory/${tablePath}?search=${issue.code}`);
  };

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-foreground italic uppercase tracking-tight">
            Network Intelligence Advisor
          </h3>
        </div>
        <button className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors border border-border px-2.5 py-1 rounded-md hover:bg-accent uppercase tracking-widest">
          <BarChart3 className="w-3 h-3" />
          Insight Analysis
        </button>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
        {!issues || issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-80" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                All Systems Operational
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                No critical infrastructure anomalies detected at this moment.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 grid gap-3">
            {issues.map((issue, i) => (
              <div
                key={i}
                className="group relative flex flex-col gap-3 p-4 bg-background border border-border rounded-xl hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 w-2 h-2 rounded-full shrink-0 animate-pulse ${
                        issue.status === "BROKEN" || issue.status === "FIBERCUT"
                          ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                          : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                      }`}
                    />
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground tracking-tight">
                          {issue.code}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border uppercase">
                          {issue.type}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                        {issue.lastNote || "Maintenance required - investigation pending."}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full border ${
                        issue.status === "BROKEN" || issue.status === "FIBERCUT"
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}
                    >
                      {issue.status}
                    </span>
                    <span className="text-[9px] text-muted-foreground/60 font-mono">
                      Just now
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] gap-1.5 px-3 bg-muted/20 hover:bg-rose-500 hover:text-white border-border hover:border-rose-500 transition-all group-hover:bg-muted/40"
                    onClick={() => handleFlyToMap(issue)}
                  >
                    <MapIcon className="w-3 h-3" />
                    Fly to Topology
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] gap-1.5 px-3 bg-muted/20 hover:bg-emerald-500 hover:text-white border-border hover:border-emerald-500 transition-all group-hover:bg-muted/40"
                    onClick={() => handleFlyToTable(issue)}
                  >
                    <Database className="w-3 h-3" />
                    Inspect Details
                  </Button>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-3 h-3 text-muted-foreground animate-bounce-x" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-5 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
          AI-Powered Diagnostics
        </span>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-emerald-500" />
          <span className="text-[9px] font-bold text-emerald-500 uppercase">
            Live Monitoring
          </span>
        </div>
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
  const orgId = params?.orgId as string;

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

      const res = await fetch(`${baseUrl}/analytics/summary`, {
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
        totalUsers: 0,
        totalNetworkLengthKm: 0,
        activeAlerts: 0,
        networkUptime: 99.9,
        customerReach: 0,
        maintenanceProgress: 0,
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
        (stats.totalNodes > 0 || stats.totalUsers > 0) && (
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
                label="Network Length"
                value={`${stats.totalNetworkLengthKm.toFixed(2)} km`}
                color="violet"
              />
              <MetricBox
                icon={Database}
                label="Customer Reach"
                value={stats.customerReach}
                color="amber"
              />
            </div>
          </div>
        )}

      {/* --- Advisor + DB Info Row --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AdvisorCard issues={stats?.issues} projectId={projectId} orgId={orgId} />
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
