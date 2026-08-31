// Shared Kong observability types
// Decoupled from Next.js BFF server routes so they can be imported cleanly in Vite SPA.

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

export interface KongTrafficPoint {
  hour: string;
  api: number;
  gateways: number;
}

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
