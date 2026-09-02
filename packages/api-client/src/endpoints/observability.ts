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
    getSummary: () => client.get<ObservabilitySummary>("/api/v1/observability/summary"),
    getLiveMetricsUrl: () => "/api/v1/observability/live",
  };
}
