"use server";

import fs from "fs";
import { auth } from "@/auth";

function getGatewayToken(): string {
  // 1. Check environment variable first (Docker / production)
  if (process.env.GATEWAY_TOKEN) {
    return process.env.GATEWAY_TOKEN;
  }

  // 2. Fallback: read from env file (host-level / development)
  try {
    const envPath = process.env.GATEWAY_ENV_PATH;
    if (!envPath || !fs.existsSync(envPath)) {
      console.warn("[Gateway Actions] Gateway env file not configured or not found");
      return "CHANGE_ME_TO_A_STRONG_RANDOM_TOKEN";
    }
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("GATEWAY_TOKEN=")) {
        return trimmed.substring("GATEWAY_TOKEN=".length).trim();
      }
    }
  } catch (err) {
    console.error("[Gateway Actions] Error reading gateway token:", err);
  }
  return "CHANGE_ME_TO_A_STRONG_RANDOM_TOKEN";
}

const GATEWAY_BASE_URL = process.env.NOTIFICATION_GATEWAY_URL || "http://127.0.0.1:5001";

async function verifySuperAdmin() {
  const session = await auth();
  const roles = session?.user?.roles || [];
  const isSuperAdmin = roles.includes("super_admin") || roles.includes("ROLE_SUPER_ADMIN");
  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Superadmin access required");
  }
}

export type ConfigEntry = {
  key: string;
  value: string;
  censored: string;
  section: string;
};

export type ConfigResponse = {
  status: string;
  sections: Record<string, ConfigEntry[]>;
};

export type GatewayServiceStatus = {
  name: string;
  port: number;
  active: boolean;
  status: string;
};

export type StatusResponse = {
  status: string;
  services: GatewayServiceStatus[];
};

export async function getGatewayConfig(): Promise<ConfigResponse> {
  await verifySuperAdmin();
  
  const token = getGatewayToken();
  const res = await fetch(`${GATEWAY_BASE_URL}/api/v1/config`, {
    headers: {
      "X-Gateway-Token": token,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch config from gateway: ${res.statusText}`);
  }

  return res.json();
}

export async function updateGatewayConfig(updates: Record<string, string>): Promise<{ status: string; message: string; keys_updated: number }> {
  await verifySuperAdmin();

  const token = getGatewayToken();
  const res = await fetch(`${GATEWAY_BASE_URL}/api/v1/config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
    },
    body: JSON.stringify({ updates }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Failed to update gateway configuration: ${res.statusText}`);
  }

  return res.json();
}

export async function getGatewayStatus(): Promise<StatusResponse> {
  await verifySuperAdmin();

  const token = getGatewayToken();
  const res = await fetch(`${GATEWAY_BASE_URL}/api/v1/gateway-status`, {
    headers: {
      "X-Gateway-Token": token,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch status from gateway: ${res.statusText}`);
  }

  return res.json();
}
