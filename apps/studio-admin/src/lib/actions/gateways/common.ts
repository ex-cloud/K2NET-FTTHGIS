import { auth } from "@/auth";

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

export const GATEWAY_BASE_URL = process.env.NOTIFICATION_GATEWAY_URL || "http://127.0.0.1:5001";

/**
 * Map of gateway identifiers to their backend URL environment variables.
 * Each gateway has its own /api/v1/config endpoint.
 */
export const GATEWAY_URL_MAP: Record<string, string> = {
  notification: process.env.NOTIFICATION_GATEWAY_URL || "http://127.0.0.1:5001",
  payment:      process.env.PAYMENT_GATEWAY_URL      || "http://127.0.0.1:5002",
  map:          process.env.MAP_GATEWAY_URL           || "http://127.0.0.1:5003",
  storage:      process.env.STORAGE_GATEWAY_URL       || "http://127.0.0.1:5004",
  whatsapp:     process.env.WHATSAPP_GATEWAY_URL      || "http://127.0.0.1:5005",
  scheduler:    process.env.SCHEDULER_GATEWAY_URL     || "http://127.0.0.1:5006",
  export:       process.env.EXPORT_GATEWAY_URL        || "http://127.0.0.1:5007",
  olt:          process.env.OLT_GATEWAY_URL           || "http://127.0.0.1:5008",
  audit:        process.env.AUDIT_GATEWAY_URL         || "http://127.0.0.1:5009",
  poller:       process.env.POLLER_GATEWAY_URL        || "http://ftth-poller:5010",
  task:         process.env.TASK_GATEWAY_URL          || "http://ftth-task-gateway:5011",
  ai:           process.env.AI_GATEWAY_URL            || "http://ftth-ai-gateway:5012",
};

export async function verifySuperAdmin() {
  const session = await auth();
  const roles = session?.user?.roles || [];
  const isSuperAdmin = roles.includes("super_admin") || roles.includes("ROLE_SUPER_ADMIN");
  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Superadmin access required");
  }
}
