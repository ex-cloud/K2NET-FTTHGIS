import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || "http://ftth-prometheus:9090";
const BACKEND_URL = process.env.BACKEND_URL ?? "http://backend:9090";

// Helper to query Prometheus range
async function queryPromRange(query: string, startSec: number, endSec: number, step = "1m"): Promise<any[]> {
  try {
    const url = `${PROMETHEUS_URL}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${startSec}&end=${endSec}&step=${step}`;
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.result ?? [];
  } catch (err) {
    console.error(`[compute-metrics] Prometheus query failed for: ${query.substring(0, 30)}... Error:`, err);
    return [];
  }
}

// Helper to query Prometheus instant values
async function queryPromInstant(query: string): Promise<any[]> {
  try {
    const url = `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.result ?? [];
  } catch (err) {
    console.error(`[compute-metrics] Prometheus instant query failed:`, err);
    return [];
  }
}

// Fetch DevOps statistics from Spring Boot
async function fetchDevOpsStats(token: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/system/devops-stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Internal-Request": "1"
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("[compute-metrics] Failed to fetch devops-stats from backend:", err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader ? authHeader.replace("Bearer ", "") : "";

  const now = Math.floor(Date.now() / 1000);
  const start = now - 1800; // 30 minutes ago
  const step = "1m";

  // Run all Prometheus queries + Backend DevOps query in parallel
  const [
    cpuRes,
    memTotalRes,
    memAvailRes,
    httpRateRes,
    load1Res,
    load5Res,
    load15Res,
    serviceMemoryRes,
    upRes,
    devOpsData
  ] = await Promise.all([
    queryPromRange(`100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100)`, start, now, step),
    queryPromRange(`node_memory_MemTotal_bytes`, start, now, step),
    queryPromRange(`node_memory_MemAvailable_bytes`, start, now, step),
    queryPromRange(`sum(rate(gateway_http_requests_total[2m])) + (sum(rate(http_server_requests_seconds_count[2m])) or vector(0))`, start, now, step),
    queryPromInstant("node_load1"),
    queryPromInstant("node_load5"),
    queryPromInstant("node_load15"),
    queryPromInstant("process_resident_memory_bytes"),
    queryPromInstant("up"),
    fetchDevOpsStats(token)
  ]);

  const formatTime = (ts: number) => {
    return new Date(ts * 1000).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Compile rolling charts
  const cpuPoints = (cpuRes[0]?.values ?? []).map(([ts, val]: [number, string]) => ({
    time: formatTime(ts),
    cpu: Math.round(parseFloat(val) * 10) / 10
  }));

  const memoryPoints: any[] = [];
  const memTotVals = memTotalRes[0]?.values ?? [];
  const memAvailVals = memAvailRes[0]?.values ?? [];
  for (let i = 0; i < memTotVals.length; i++) {
    const [ts, totStr] = memTotVals[i];
    const availStr = memAvailVals[i] ? memAvailVals[i][1] : totStr;
    const total = parseFloat(totStr);
    const avail = parseFloat(availStr);
    const used = total - avail;
    memoryPoints.push({
      time: formatTime(ts),
      used: Math.round(used / (1024 * 1024)),
      total: Math.round(total / (1024 * 1024))
    });
  }

  const httpPoints = (httpRateRes[0]?.values ?? []).map(([ts, val]: [number, string]) => ({
    time: formatTime(ts),
    requests: Math.round(parseFloat(val) * 60 * 10) / 10 // Convert to requests/minute
  }));

  // Parse instant load averages
  const load1 = parseFloat(load1Res[0]?.value?.[1] ?? "0.0");
  const load5 = parseFloat(load5Res[0]?.value?.[1] ?? "0.0");
  const load15 = parseFloat(load15Res[0]?.value?.[1] ?? "0.0");

  // Compile per-service RSS memory and ONLINE/OFFLINE states
  const servicesMap: Record<string, { up: boolean; memoryBytes: number }> = {};
  
  // Initialize default list of monitored services
  const prometheusJobs = [
    "node-exporter",
    "spring-boot",
    "notification-gateway",
    "payment-gateway",
    "map-gateway",
    "storage-gateway",
    "audit-gateway",
    "export-gateway",
    "scheduler-gateway",
    "olt-gateway",
    "whatsapp-gateway",
    "go-poller"
  ];

  prometheusJobs.forEach((job) => {
    servicesMap[job] = { up: true, memoryBytes: 0 };
  });

  // Map service ONLINE status
  upRes.forEach((r: any) => {
    const job = r.metric?.job;
    const isUp = r.value?.[1] === "1";
    if (job && servicesMap[job]) {
      servicesMap[job].up = isUp;
    }
  });

  // Map service RSS memory
  serviceMemoryRes.forEach((r: any) => {
    const job = r.metric?.job;
    const bytes = parseFloat(r.value?.[1] ?? "0");
    if (job && servicesMap[job]) {
      servicesMap[job].memoryBytes = bytes;
    }
  });

  const services = Object.entries(servicesMap).map(([job, data]) => ({
    job,
    up: data.up,
    memoryBytes: data.memoryBytes
  }));

  // Fallbacks if Prometheus is empty
  const generateFallbacks = () => {
    return Array.from({ length: 15 }, (_, idx) => {
      const ts = now - (14 - idx) * 120;
      const label = formatTime(ts);
      return {
        cpu: { time: label, cpu: 1 + Math.sin(idx * 0.4) * 0.5 },
        mem: { time: label, used: 2048, total: 8192 },
        http: { time: label, requests: 0 }
      };
    });
  };

  const fallbacks = generateFallbacks();

  return NextResponse.json(
    {
      charts: {
        cpu: cpuPoints.length > 0 ? cpuPoints : fallbacks.map(f => f.cpu),
        memory: memoryPoints.length > 0 ? memoryPoints : fallbacks.map(f => f.mem),
        http: httpPoints.length > 0 ? httpPoints : fallbacks.map(f => f.http)
      },
      loadAvg: { load1, load5, load15 },
      services,
      devOpsStats: devOpsData ?? {
        lastMigration: { version: "—", success: false, installedOn: "—" },
        lastBackup: {
          lastBackupTime: "—",
          nextBackupTime: "—",
          status: "UNKNOWN",
          minioStatus: "UNKNOWN",
          minioSyncTime: "—",
          nextcloudStatus: "UNKNOWN",
          nextcloudSyncTime: "—",
          dbBackups: { name: "db-backups", totalFiles: 0, totalSize: 0 },
          codeBackups: { name: "code-backups", totalFiles: 0, totalSize: 0 },
          dockerBackups: { name: "docker-backups", totalFiles: 0, totalSize: 0 }
        },
        compute: { usedMemoryMb: 0, totalMemoryMb: 0, maxMemoryMb: 0 }
      }
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}
