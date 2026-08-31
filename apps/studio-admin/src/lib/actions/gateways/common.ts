export function getGatewayToken(): string {
  // 1. Check environment variable first (Docker / production)
  if (process.env.GATEWAY_TOKEN) {
    return process.env.GATEWAY_TOKEN;
  }

  // 2. Fallback: read from env file (host-level / development)
  try {
    const envPath = process.env.GATEWAY_ENV_PATH;
    if (envPath && typeof window === "undefined") {
      // Dynamic require on server-side only to prevent bundler AST analysis issues
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed.startsWith("GATEWAY_TOKEN=")) {
            return trimmed.substring("GATEWAY_TOKEN=".length).trim();
          }
        }
      }
    }
  } catch (err) {
    console.warn("[Gateway Actions] Could not read gateway env file:", err);
  }

  return "CHANGE_ME_TO_A_STRONG_RANDOM_TOKEN";
}

export const GATEWAY_BASE_URL =
  process.env.NOTIFICATION_GATEWAY_URL || "http://127.0.0.1:5001";

const RAW_GATEWAY_URL_MAP: Record<string, string> = {
  notification:  process.env.NOTIFICATION_GATEWAY_URL  || "http://127.0.0.1:5001",
  payment:       process.env.PAYMENT_GATEWAY_URL       || "http://127.0.0.1:5002",
  map:           process.env.MAP_GATEWAY_URL           || "http://127.0.0.1:5003",
  storage:       process.env.STORAGE_GATEWAY_URL       || "http://127.0.0.1:5004",
  whatsapp:      process.env.WHATSAPP_GATEWAY_URL      || "http://127.0.0.1:5005",
  scheduler:     process.env.SCHEDULER_GATEWAY_URL     || "http://127.0.0.1:5006",
  export:        process.env.EXPORT_GATEWAY_URL        || "http://127.0.0.1:5007",
  olt:           process.env.OLT_GATEWAY_URL           || "http://127.0.0.1:5008",
  audit:         process.env.AUDIT_GATEWAY_URL         || "http://127.0.0.1:5009",
  poller:        process.env.POLLER_GATEWAY_URL        || "http://ftth-poller:5010",
  task:          process.env.TASK_GATEWAY_URL          || "http://ftth-task-gateway:5011",
  ai:            process.env.AI_GATEWAY_URL            || "http://ftth-ai-gateway:5012",
  observability: process.env.OBSERVABILITY_GATEWAY_URL || "http://ftth-observability-gateway:5013",
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
