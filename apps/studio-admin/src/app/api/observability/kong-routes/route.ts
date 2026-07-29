import { NextRequest, NextResponse } from "next/server";

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
  methods: string;
  plugins: string[];
  status: "UP" | "UNKNOWN";
}

function transformRoute(r: KongRoute, serviceNames: Record<string, string>): KongRouteDisplay {
  const path = r.paths?.[0] ?? r.name ?? "unknown";
  const serviceName = serviceNames[r.service?.id ?? ""] ?? r.service?.id ?? "unknown";
  return {
    route: path,
    routeId: r.id,
    upstream: serviceName,
    methods: r.methods?.join(", ") ?? "ALL",
    plugins: r.plugins ?? [],
    status: "UP",
  };
}

export async function GET(_req: NextRequest) {
  try {
    // 1. Fetch routes from Kong Admin API
    const routesRes = await fetch(`${KONG_ADMIN_URL}/routes?size=100`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!routesRes.ok) {
      throw new Error(`Kong Admin /routes returned ${routesRes.status}`);
    }

    const routesData = await routesRes.json();
    const routes: KongRoute[] = routesData?.data ?? [];

    // 2. Fetch services to resolve service names
    const servicesRes = await fetch(`${KONG_ADMIN_URL}/services?size=100`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    const serviceNames: Record<string, string> = {};
    if (servicesRes.ok) {
      const svcsData = await servicesRes.json();
      (svcsData?.data ?? []).forEach((s: { id: string; name: string; host: string; port: number }) => {
        // e.g. "ftth-backend:9090"
        serviceNames[s.id] = `${s.host}:${s.port}`;
      });
    }

    const display = routes.map((r) => transformRoute(r, serviceNames));

    return NextResponse.json(
      { data: display, total: display.length, source: "kong-admin" },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kong Admin API unavailable";
    console.warn(`[api/observability/kong-routes] ${message}`);

    // Return graceful empty + error flag (do NOT crash)
    return NextResponse.json(
      { data: [], total: 0, source: "unavailable", error: message },
      { status: 200 } // 200 so frontend can render fallback
    );
  }
}
