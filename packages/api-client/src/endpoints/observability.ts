import type { HttpClient } from "../http-client";

export interface ObservabilitySummary {
  timestamp: string;
  system_health: "HEALTHY" | "DEGRADED" | "CRITICAL";
  prometheus?: Record<string, any>;
  poller?: Record<string, any>;
  backend?: Record<string, any>;
  errors?: string[];
}

export function createObservabilityEndpoints(client: HttpClient) {
  return {
    getSummary: () => client.get<ObservabilitySummary>("/api/gateway/observability/summary"),
    getLiveMetricsUrl: () => "/api/gateway/observability/live",
  };
}
