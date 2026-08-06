import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const KONG_ADMIN_URL = process.env.KONG_ADMIN_URL ?? "http://kong:8001";
const BACKEND_URL = process.env.BACKEND_URL ?? "http://backend:9090";

export interface KongStatus {
  database?: { reachable: boolean };
  configuration_hash?: string;
  server: {
    connections_accepted: number;
    connections_active: number;
    connections_handled: number;
    connections_reading: number;
    connections_waiting: number;
    connections_writing: number;
    total_requests: number;
  };
  memory?: {
    workers_lua_vms: Array<{ http_allocated_gc: string; pid: number }>;
  };
}

export interface KongTrafficPoint {
  hour: string;
  api: number;
  gateways: number;
}

export interface KongMetrics {
  totalRequests: number;
  activeConnections: number;
  dbReachable: boolean;
  configHash: string;
  workerCount: number;
  workerMemoryMiB: number;
  trafficHistory: KongTrafficPoint[];
  source: "kong-admin" | "unavailable";
  error?: string;
}

// ── Parse "52.78 MiB" → 52.78 ─────────────────────────────────────────────
function parseMiB(str: string): number {
  const match = str?.match(/^([\d.]+)\s*MiB$/);
  return match ? parseFloat(match[1]) : 0;
}

// ── Fetch real traffic history from audit_events via backend ───────────────
async function fetchRealTrafficHistory(): Promise<KongTrafficPoint[] | null> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/system/kong/traffic-history?hours=12`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
        headers: { "X-Internal-Request": "1" },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

// ── Synthetic fallback when backend is unavailable ─────────────────────────
function buildSyntheticHistory(totalRequests: number): KongTrafficPoint[] {
  const now = new Date();
  const distribution = [0.04, 0.03, 0.03, 0.04, 0.06, 0.09, 0.11, 0.13, 0.12, 0.11, 0.10, 0.10];
  return Array.from({ length: 12 }, (_, i) => {
    const h = new Date(now.getTime() - (11 - i) * 3600 * 1000);
    const label = h.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const pct = distribution[i] ?? 0.08;
    return {
      hour: label,
      api: Math.round(totalRequests * pct * 0.65),
      gateways: Math.round(totalRequests * pct * 0.35),
    };
  });
}

export async function GET(_req: NextRequest) {
  try {
    // Fetch Kong status + real traffic history in parallel
    const [statusRes, realHistory] = await Promise.all([
      fetch(`${KONG_ADMIN_URL}/status`, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }),
      fetchRealTrafficHistory(),
    ]);

    if (!statusRes.ok) {
      throw new Error(`Kong Admin /status returned ${statusRes.status}`);
    }

    const status: KongStatus = await statusRes.json();
    const totalRequests = status.server?.total_requests ?? 0;
    const activeConns = status.server?.connections_active ?? 0;
    const dbReachable = status.database?.reachable ?? false;
    const configHash = status.configuration_hash ?? "unknown";

    // Worker memory aggregation
    const workers = status.memory?.workers_lua_vms ?? [];
    const workerCount = workers.length;
    const workerMemoryMiB = workers.reduce(
      (sum, w) => sum + parseMiB(w.http_allocated_gc),
      0
    );

    // Use real traffic history if available, otherwise synthetic fallback
    const trafficHistory = realHistory ?? buildSyntheticHistory(totalRequests);

    return NextResponse.json(
      {
        totalRequests,
        activeConnections: activeConns,
        dbReachable,
        configHash,
        workerCount,
        workerMemoryMiB: Math.round(workerMemoryMiB * 10) / 10,
        trafficHistory,
        source: "kong-admin",
      } satisfies KongMetrics,
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kong Admin API unavailable";
    console.warn(`[api/observability/kong-traffic] ${message}`);

    return NextResponse.json(
      {
        totalRequests: 0,
        activeConnections: 0,
        dbReachable: false,
        configHash: "unknown",
        workerCount: 0,
        workerMemoryMiB: 0,
        trafficHistory: [],
        source: "unavailable",
        error: message,
      } satisfies KongMetrics,
      { status: 200 }
    );
  }
}
