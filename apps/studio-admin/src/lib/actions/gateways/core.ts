import {
  getGatewayToken,
  verifySuperAdmin,
  GATEWAY_BASE_URL,
  GATEWAY_URL_MAP,
} from "./common";

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

const lastMetricsCache: Record<string, { count: number; time: number; throughput: number }> = {};

export async function getGatewayConfig(): Promise<ConfigResponse> {
  await verifySuperAdmin();

  const token = getGatewayToken();
  const res = await fetch(`${GATEWAY_BASE_URL}/api/v1/config`, {
    headers: {
      "X-Gateway-Token": token,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch config from gateway: ${res.statusText}`);
  }

  return res.json();
}

export async function updateGatewayConfig(
  updates: Record<string, string>
): Promise<{ status: string; message: string; keys_updated: number }> {
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
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch status from gateway: ${res.statusText}`);
  }

  const data = await res.json();

  const updatedServices = await Promise.all(
    (data.services || []).map(async (svc: GatewayServiceStatus) => {
      if (!svc.active) {
        return { ...svc, latency: 0, throughput: 0 };
      }

      // Determine host: if NOTIFICATION_GATEWAY_URL points to a container name (Docker environment),
      // use svc.name to connect to that service container directly. Otherwise use localhost/127.0.0.1.
      const isDocker =
        process.env.NOTIFICATION_GATEWAY_URL &&
        !process.env.NOTIFICATION_GATEWAY_URL.includes("localhost") &&
        !process.env.NOTIFICATION_GATEWAY_URL.includes("127.0.0.1");
      const host = isDocker ? svc.name : "127.0.0.1";
      const url = `http://${host}:${svc.port}/metrics`;
      const start = Date.now();
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 800); // 800ms timeout

        const pingRes = await fetch(url, {
          signal: controller.signal,
          cache: "no-store",
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
    })
  );

  return {
    status: "ok",
    services: updatedServices,
  };
}

/**
 * Universal: fetch config from any gateway by its identifier key.
 * Example: getGatewayConfigByKey("payment") → calls PAYMENT_GATEWAY_URL/api/v1/config
 */
export async function getGatewayConfigByKey(gatewayKey: string): Promise<ConfigResponse> {
  await verifySuperAdmin();

  const baseUrl = GATEWAY_URL_MAP[gatewayKey];
  if (!baseUrl) {
    throw new Error(
      `Unknown gateway key: "${gatewayKey}". Valid keys: ${Object.keys(GATEWAY_URL_MAP).join(", ")}`
    );
  }

  const token = getGatewayToken();
  const res = await fetch(`${baseUrl}/api/v1/config`, {
    headers: { "X-Gateway-Token": token },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`[${gatewayKey}] Failed to fetch config: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Universal: save config updates to any gateway by its identifier key.
 * Example: updateGatewayConfigByKey("payment", { XENDIT_API_KEY: "..." })
 */
export async function updateGatewayConfigByKey(
  gatewayKey: string,
  updates: Record<string, string>
): Promise<{ status: string; message: string; keys_updated: number }> {
  await verifySuperAdmin();

  const baseUrl = GATEWAY_URL_MAP[gatewayKey];
  if (!baseUrl) {
    throw new Error(
      `Unknown gateway key: "${gatewayKey}". Valid keys: ${Object.keys(GATEWAY_URL_MAP).join(", ")}`
    );
  }

  const token = getGatewayToken();
  const res = await fetch(`${baseUrl}/api/v1/config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
    },
    body: JSON.stringify({ updates }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `[${gatewayKey}] Failed to update config: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
