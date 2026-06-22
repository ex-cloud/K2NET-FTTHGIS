"use server";

import fs from "fs";
import { auth } from "@/auth";

const lastMetricsCache: Record<string, { count: number; time: number; throughput: number }> = {};

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
  latency?: number;
  throughput?: number;
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

  const data = await res.json();
  
  // Measure latency and parse throughput for each active service
  const host = process.env.NOTIFICATION_GATEWAY_URL 
    ? new URL(process.env.NOTIFICATION_GATEWAY_URL).hostname 
    : "host.docker.internal";

  const updatedServices = await Promise.all((data.services || []).map(async (svc: GatewayServiceStatus) => {
    if (!svc.active) {
      return { ...svc, latency: 0, throughput: 0 };
    }

    const url = `http://${host}:${svc.port}/metrics`;
    const start = Date.now();
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 800); // 800ms timeout
      
      const pingRes = await fetch(url, {
        signal: controller.signal,
        next: { revalidate: 0 },
      });
      clearTimeout(id);
      
      const latency = Date.now() - start;
      
      if (!pingRes.ok) {
        return { ...svc, latency, throughput: 0 };
      }

      const text = await pingRes.text();
      // Parse counter gateway_http_requests_total
      let totalRequests = 0;
      const lines = text.split("\n");
      for (const line of lines) {
        if (line.startsWith("gateway_http_requests_total")) {
          const parts = line.trim().split(" ");
          const value = parseFloat(parts[parts.length - 1]);
          if (!isNaN(value)) {
            totalRequests += value;
          }
        }
      }

      // Calculate throughput (req/min) based on difference with lastMetricsCache
      const now = Date.now();
      const prev = lastMetricsCache[svc.name];
      let throughput = 0;
      
      if (prev && now > prev.time) {
        const timeDiffMin = (now - prev.time) / 60000;
        if (timeDiffMin > 0 && totalRequests >= prev.count) {
          throughput = Math.round((totalRequests - prev.count) / timeDiffMin);
        }
      }
      
      // Update cache
      lastMetricsCache[svc.name] = {
        count: totalRequests,
        time: now,
        throughput: throughput,
      };

      return { ...svc, latency, throughput };
    } catch (err) {
      console.warn(`[Gateway Latency Check] Failed for ${svc.name}:`, err);
      return { ...svc, latency: 0, throughput: 0 };
    }
  }));

  return {
    status: "ok",
    services: updatedServices,
  };
}

export type StorageStats = {
  total_files: number;
  total_original_size: number;
  total_compressed_size: number;
  success_count: number;
  failure_count: number;
  space_saved_percent: number;
  failure_rate_percent: number;
};

export async function getStorageStats(): Promise<StorageStats> {
  await verifySuperAdmin();

  const token = getGatewayToken();
  const storageGatewayUrl = process.env.STORAGE_GATEWAY_URL || "http://127.0.0.1:5004";

  const res = await fetch(`${storageGatewayUrl}/api/v1/stats`, {
    headers: {
      "X-Gateway-Token": token,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch storage stats: ${res.statusText}`);
  }

  return res.json();
}
