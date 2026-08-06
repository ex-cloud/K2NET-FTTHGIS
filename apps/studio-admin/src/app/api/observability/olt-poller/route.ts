import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const POLLER_URL = process.env.POLLER_URL ?? "http://ftth-poller:5010";
const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? "http://backend:9090";
const GATEWAY_TOKEN = process.env.INTERNAL_GATEWAY_TOKEN ?? "";

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pollerHeaders = { "X-Gateway-Token": GATEWAY_TOKEN };
  const backendHeaders = {
    Authorization: `Bearer ${token.accessToken as string}`,
    "X-Tenant-ID": String(token.tenantId ?? "system"),
  };

  try {
    // Parallel fetch from all 3 sources
    const [healthzRes, devicesRes, oltsRes] = await Promise.allSettled([
      fetch(`${POLLER_URL}/healthz`, { signal: AbortSignal.timeout(4000) }),
      fetch(`${POLLER_URL}/api/v1/devices/status`, {
        headers: pollerHeaders,
        signal: AbortSignal.timeout(4000),
      }),
      fetch(`${BACKEND_URL}/api/v1/network/olts?size=100`, {
        headers: backendHeaders,
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    // --- Poller Health Info ---
    let pollerInfo: Record<string, unknown> = {
      status: "offline",
      deviceCount: 0,
      pollInterval: "—",
      redisStatus: "unknown",
      time: null,
    };
    if (healthzRes.status === "fulfilled" && healthzRes.value.ok) {
      const hData = await healthzRes.value.json();
      pollerInfo = {
        status: hData.status ?? "unknown",
        deviceCount: hData.deviceCount ?? 0,
        pollInterval: hData.pollInterval ?? "—",
        redisStatus: hData.redisStatus ?? "unknown",
        time: hData.time ?? null,
      };
    }

    // --- Live Device Telemetry from Redis (via go-poller) ---
    type LiveDevice = {
      deviceCode: string;
      host: string;
      name: string;
      status: string;
      responseTimeMs: number;
      lastPolledAt: string;
      metrics?: Record<string, unknown>;
    };
    let liveDevices: LiveDevice[] = [];
    if (devicesRes.status === "fulfilled" && devicesRes.value.ok) {
      const dData = await devicesRes.value.json();
      liveDevices = (dData.data as LiveDevice[]) ?? [];
    }

    // --- OLT Inventory from Spring Boot DB ---
    type OltRecord = {
      code?: string;
      name?: string;
      ipAddress?: string;
      status?: string;
      healthStatus?: string;
      address?: string;
      lat?: number;
      lng?: number;
    };
    let oltInventory: OltRecord[] = [];
    if (oltsRes.status === "fulfilled" && oltsRes.value.ok) {
      const oData = await oltsRes.value.json();
      oltInventory = (oData.content as OltRecord[]) ?? [];
    }

    // --- Merge: Attach live telemetry to DB inventory ---
    const liveMap = new Map(liveDevices.map((d) => [d.deviceCode, d]));

    const devices = oltInventory.map((olt) => {
      const live = liveMap.get(olt.code ?? "") ?? null;

      // Determine SNMP status: prefer live data, fallback to DB healthStatus
      let snmpStatus: "UP" | "DOWN" | "SLOW" = "DOWN";
      if (live) {
        if (live.status === "UP") snmpStatus = "UP";
        else if (live.status === "SLOW") snmpStatus = "SLOW";
        else snmpStatus = "DOWN";
      } else if (olt.healthStatus === "NORMAL" || olt.status === "ACTIVE") {
        snmpStatus = "UP";
      } else if (olt.healthStatus === "WARNING") {
        snmpStatus = "SLOW";
      }

      // Determine vendor from OLT code
      let vendor = "Generic";
      const code = (olt.code ?? "").toLowerCase();
      if (code.includes("zte")) vendor = "ZTE";
      else if (code.includes("huawei")) vendor = "Huawei";
      else if (code.includes("fiberhome")) vendor = "Fiberhome";

      return {
        code: olt.code ?? "",
        hostname: olt.name ?? olt.code ?? "—",
        ip: olt.ipAddress ?? live?.host ?? "—",
        vendor,
        snmpStatus,
        responseTimeMs: live?.responseTimeMs ?? null,
        lastPolledAt: live?.lastPolledAt ?? null,
        location: olt.address ?? (olt.lat && olt.lng ? `${olt.lat}, ${olt.lng}` : "—"),
        isLive: live !== null,
      };
    });

    // Also include any live devices not in DB inventory (e.g. seed dev data)
    const inventoryCodes = new Set(oltInventory.map((o) => o.code));
    for (const live of liveDevices) {
      if (!inventoryCodes.has(live.deviceCode)) {
        devices.push({
          code: live.deviceCode,
          hostname: live.name ?? live.deviceCode,
          ip: live.host,
          vendor: "Generic",
          snmpStatus: live.status === "UP" ? "UP" : "DOWN",
          responseTimeMs: live.responseTimeMs ?? null,
          lastPolledAt: live.lastPolledAt ?? null,
          location: "—",
          isLive: true,
        });
      }
    }

    const totalDevices = devices.length;
    const onlineCount = devices.filter((d) => d.snmpStatus === "UP").length;
    const snmpSuccessRate = totalDevices > 0
      ? Math.round((onlineCount / totalDevices) * 100)
      : 0;

    const lastPolledAt = liveDevices.reduce<string | null>((latest, d) => {
      if (!d.lastPolledAt) return latest;
      if (!latest) return d.lastPolledAt;
      return d.lastPolledAt > latest ? d.lastPolledAt : latest;
    }, null);

    return NextResponse.json({
      pollerInfo,
      devices,
      summary: {
        totalDevices,
        onlineCount,
        snmpSuccessRate,
        lastPolledAt,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "olt-poller aggregation error";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
