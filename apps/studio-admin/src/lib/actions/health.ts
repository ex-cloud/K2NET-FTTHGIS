"use server";

const PROMETHEUS_URL =
  process.env.PROMETHEUS_URL || "http://ftth-prometheus:9090";

async function queryPrometheus(query: string): Promise<any[]> {
  const url = `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Prometheus error: ${res.status}`);
  const data = await res.json();
  return data?.data?.result ?? [];
}

async function queryPrometheusRange(
  query: string,
  step = "2m"
): Promise<any[]> {
  const now = Math.floor(Date.now() / 1000);
  const start = now - 60 * 30; // 30 minutes ago
  const url = `${PROMETHEUS_URL}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${start}&end=${now}&step=${step}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Prometheus range error: ${res.status}`);
  const data = await res.json();
  return data?.data?.result ?? [];
}

export type GatewayStatus = {
  name: string;
  job: string;
  up: boolean;
};

export type SystemHealthData = {
  cpu: number;
  memUsedBytes: number;
  memTotalBytes: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  gateways: GatewayStatus[];
  onlineCount: number;
  totalCount: number;
  timestamp: string;
};

export type ThroughputPoint = {
  time: string;
  requests: number;
};

export async function getSystemHealthMetrics(): Promise<SystemHealthData> {
  try {
    const [cpuResult, memTotalResult, memAvailResult, diskTotalResult, diskAvailResult, upResult] =
      await Promise.all([
        queryPrometheus(
          `100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100)`
        ),
        queryPrometheus("node_memory_MemTotal_bytes"),
        queryPrometheus("node_memory_MemAvailable_bytes"),
        queryPrometheus(`node_filesystem_size_bytes{mountpoint="/",fstype!="tmpfs"}`),
        queryPrometheus(`node_filesystem_avail_bytes{mountpoint="/",fstype!="tmpfs"}`),
        queryPrometheus("up"),
      ]);

    const cpu = cpuResult[0] ? parseFloat(cpuResult[0].value[1]) : 0;
    const memTotal = memTotalResult[0] ? parseInt(memTotalResult[0].value[1]) : 0;
    const memAvail = memAvailResult[0] ? parseInt(memAvailResult[0].value[1]) : 0;
    const diskTotal = diskTotalResult[0] ? parseInt(diskTotalResult[0].value[1]) : 0;
    const diskAvail = diskAvailResult[0] ? parseInt(diskAvailResult[0].value[1]) : 0;

    const labelMap: Record<string, string> = {
      "notification-gateway": "Notification",
      "payment-gateway": "Payment",
      "map-gateway": "Map",
      "storage-gateway": "Storage",
      "audit-gateway": "Audit",
      "export-gateway": "Export",
      "scheduler-gateway": "Scheduler",
      "olt-gateway": "OLT",
      "whatsapp-gateway": "WhatsApp",
      "go-poller": "Poller",
      "spring-boot": "Backend API",
      "node-exporter": "Node Exporter",
    };

    const gatewayMap: Record<string, GatewayStatus> = {};
    upResult.forEach((r: any) => {
      const job = r.metric?.job ?? r.metric?.instance ?? "unknown";
      const isUp = r.value[1] === "1";
      const name = labelMap[job] ?? job;

      // Group by job, prioritize active (ONLINE) status if there are duplicate series/instances
      if (!gatewayMap[job] || isUp) {
        gatewayMap[job] = {
          name,
          job,
          up: isUp,
        };
      }
    });

    const gateways = Object.values(gatewayMap);

    const onlineCount = gateways.filter((g) => g.up).length;

    return {
      cpu: isNaN(cpu) ? 0 : Math.round(cpu * 100) / 100,
      memUsedBytes: memTotal - memAvail,
      memTotalBytes: memTotal,
      diskUsedBytes: diskTotal - diskAvail,
      diskTotalBytes: diskTotal,
      gateways,
      onlineCount,
      totalCount: gateways.length,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[health] getSystemHealthMetrics error:", err);
    throw err;
  }
}

export async function getSystemThroughput(): Promise<ThroughputPoint[]> {
  try {
    const results = await queryPrometheusRange(
      `sum(rate(http_requests_total[2m]))`,
      "2m"
    );

    if (!results || results.length === 0) {
      const now = Date.now();
      return Array.from({ length: 8 }, (_, i) => ({
        time: new Date(now - (7 - i) * 2 * 60 * 1000).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        requests: 0,
      }));
    }

    const values: [number, string][] = results[0]?.values ?? [];
    return values.slice(-8).map(([ts, val]: [number, string]) => ({
      time: new Date(ts * 1000).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      requests: parseFloat(parseFloat(val).toFixed(2)),
    }));
  } catch (err) {
    console.error("[health] getSystemThroughput error:", err);
    return [];
  }
}
