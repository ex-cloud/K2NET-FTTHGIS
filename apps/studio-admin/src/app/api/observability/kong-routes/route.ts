import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Kong Admin API is accessible on the internal Docker network
const KONG_ADMIN_URL = process.env.KONG_ADMIN_URL ?? "http://kong:8001";

export interface KongRoute {
  id: string;
  name: string;
  paths: string[];
  methods: string[] | null;
  service: { id: string; name?: string };
  plugins?: string[];
  created_at: number;
}

export interface KongRouteDisplay {
  route: string;
  routeId: string;
  upstream: string;
  upstreamHost: string;
  upstreamPort: number;
  methods: string;
  plugins: string[];
  status: "UP" | "DOWN" | "UNKNOWN";
}

// ── Plugin fetcher per route ───────────────────────────────────────────────
async function fetchPluginsForRoute(routeId: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${KONG_ADMIN_URL}/routes/${routeId}/plugins`,
      { cache: "no-store", signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data ?? []).map((p: { name: string }) => p.name);
  } catch {
    return [];
  }
}

// ── Upstream health checker ────────────────────────────────────────────────
// Probes common health endpoints for each upstream service
const HEALTH_PATHS = ["/health", "/actuator/health", "/api/v1/health"];

async function checkUpstreamHealth(
  host: string,
  port: number
): Promise<"UP" | "DOWN" | "UNKNOWN"> {
  for (const path of HEALTH_PATHS) {
    try {
      const res = await fetch(`http://${host}:${port}${path}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok || res.status === 401 || res.status === 403) {
        // 401/403 means service is UP but requires auth
        return "UP";
      }
    } catch {
      // try next path
    }
  }
  return "DOWN";
}

function transformRoute(
  r: KongRoute,
  serviceMap: Record<string, { name: string; host: string; port: number }>,
  plugins: string[],
  status: "UP" | "DOWN" | "UNKNOWN"
): KongRouteDisplay {
  const path = r.paths?.[0] ?? r.name ?? "unknown";
  const svc = serviceMap[r.service?.id ?? ""];
  const upstream = svc ? `${svc.host}:${svc.port}` : r.service?.id ?? "unknown";
  return {
    route: path,
    routeId: r.id,
    upstream,
    upstreamHost: svc?.host ?? "",
    upstreamPort: svc?.port ?? 0,
    methods: r.methods?.join(", ") ?? "ALL",
    plugins,
    status,
  };
}

export async function GET(_req: NextRequest) {
  try {
    // 1. Fetch routes and services in parallel
    const [routesRes, servicesRes] = await Promise.all([
      fetch(`${KONG_ADMIN_URL}/routes?size=100`, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`${KONG_ADMIN_URL}/services?size=100`, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    if (!routesRes.ok) {
      throw new Error(`Kong Admin /routes returned ${routesRes.status}`);
    }

    const routesData = await routesRes.json();
    const routes: KongRoute[] = routesData?.data ?? [];

    // 2. Build service map
    const serviceMap: Record<string, { name: string; host: string; port: number }> = {};
    if (servicesRes.ok) {
      const svcsData = await servicesRes.json();
      (svcsData?.data ?? []).forEach(
        (s: { id: string; name: string; host: string; port: number }) => {
          serviceMap[s.id] = { name: s.name, host: s.host, port: s.port };
        }
      );
    }

    // 3. Fetch plugins per route + health check upstream — fully parallel
    const enriched = await Promise.allSettled(
      routes.map(async (r) => {
        const svc = serviceMap[r.service?.id ?? ""];
        const [plugins, status] = await Promise.all([
          fetchPluginsForRoute(r.id),
          svc
            ? checkUpstreamHealth(svc.host, svc.port)
            : Promise.resolve<"UP" | "DOWN" | "UNKNOWN">("UNKNOWN"),
        ]);
        return transformRoute(r, serviceMap, plugins, status);
      })
    );

    const display = enriched
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<KongRouteDisplay>).value);

    return NextResponse.json(
      { data: display, total: display.length, source: "kong-admin" },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Kong Admin API unavailable";
    console.warn(`[api/observability/kong-routes] ${message}`);

    return NextResponse.json(
      { data: [], total: 0, source: "unavailable", error: message },
      { status: 200 } // 200 so frontend can render fallback
    );
  }
}
