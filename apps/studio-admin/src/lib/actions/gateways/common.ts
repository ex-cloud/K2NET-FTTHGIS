const getEnvVar = (key: string, fallback: string): string => {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    return String(import.meta.env[key]);
  }
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return String(process.env[key]);
  }
  return fallback;
};

export function getGatewayToken(): string {
  return getEnvVar("GATEWAY_TOKEN", "CHANGE_ME_TO_A_STRONG_RANDOM_TOKEN");
}

export const GATEWAY_BASE_URL = getEnvVar("NOTIFICATION_GATEWAY_URL", "http://127.0.0.1:5001");

const RAW_GATEWAY_URL_MAP: Record<string, string> = {
  notification:  getEnvVar("NOTIFICATION_GATEWAY_URL",  "http://127.0.0.1:5001"),
  payment:       getEnvVar("PAYMENT_GATEWAY_URL",       "http://127.0.0.1:5002"),
  map:           getEnvVar("MAP_GATEWAY_URL",           "http://127.0.0.1:5003"),
  storage:       getEnvVar("STORAGE_GATEWAY_URL",       "http://127.0.0.1:5004"),
  whatsapp:      getEnvVar("WHATSAPP_GATEWAY_URL",      "http://127.0.0.1:5005"),
  scheduler:     getEnvVar("SCHEDULER_GATEWAY_URL",     "http://127.0.0.1:5006"),
  export:        getEnvVar("EXPORT_GATEWAY_URL",        "http://127.0.0.1:5007"),
  olt:           getEnvVar("OLT_GATEWAY_URL",           "http://127.0.0.1:5008"),
  audit:         getEnvVar("AUDIT_GATEWAY_URL",         "http://127.0.0.1:5009"),
  poller:        getEnvVar("POLLER_GATEWAY_URL",        "http://ftth-poller:5010"),
  task:          getEnvVar("TASK_GATEWAY_URL",          "http://ftth-task-gateway:5011"),
  ai:            getEnvVar("AI_GATEWAY_URL",            "http://ftth-ai-gateway:5012"),
  observability: getEnvVar("OBSERVABILITY_GATEWAY_URL", "http://ftth-observability-gateway:5013"),
};

/**
 * Returns the appropriate gateway URL or browser-proxied relative path.
 */
export function getGatewayUrl(key: string): string {
  if (typeof window !== "undefined") {
    const browserRouteMap: Record<string, string> = {
      notification:  "/api/v1/notify",
      payment:       "/api/v1/invoice",
      map:           "/api/v1/geocode",
      storage:       "/api/v1/storage",
      whatsapp:      "/api/v1/wa",
      scheduler:     "/api/v1/scheduler",
      export:        "/api/v1/export",
      olt:           "/api/v1/olt",
      audit:         "/api/v1/audit",
      poller:        "/api/v1/poller",
      task:          "/api/v1/task-gateway",
      ai:            "/api/v1/ai",
      observability: "/api/gateway/observability",
    };
    return browserRouteMap[key] || `/api/v1/${key}`;
  }
  return RAW_GATEWAY_URL_MAP[key] || "http://127.0.0.1:5001";
}

/**
 * Proxy-backed map allowing GATEWAY_URL_MAP[key] to resolve to browser-safe relative routes
 * seamlessly on the client side while keeping server-side compatibility.
 */
export const GATEWAY_URL_MAP: Record<string, string> = new Proxy(RAW_GATEWAY_URL_MAP, {
  get(_target, prop: string) {
    return getGatewayUrl(prop);
  },
});

export async function verifySuperAdmin(): Promise<boolean> {
  // In client-side SPA, route-level authorization is enforced by ProtectedRoute in router.tsx
  return true;
}
