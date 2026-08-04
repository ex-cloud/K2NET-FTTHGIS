import { NextRequest, NextResponse } from "next/server";

const GATEWAY_AUDIT_URL = process.env.GATEWAY_AUDIT_URL ?? "http://gateway-audit:5009";
const GATEWAY_TOKEN     = process.env.GATEWAY_TOKEN ?? "";

// ─── In-memory dedup: prevent log spam when page refreshes while service is still down ───
// Key: serviceKey, Value: { lastStatus, expiresAt (ms epoch) }
const dedupCache = new Map<string, { lastStatus: string; expiresAt: number }>();
const DEDUP_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      serviceName: string;
      serviceKey:  string;
      fromStatus:  string;
      toStatus:    string;
      logType?:    string;
      category?:   string;
    };

    const { serviceName, serviceKey, fromStatus, toStatus, logType, category } = body;

    if (!serviceName || !serviceKey || !fromStatus || !toStatus) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // ── Dedup: skip if we already emitted the same status for this service recently ──
    const now = Date.now();
    const cached = dedupCache.get(serviceKey);
    if (cached && cached.lastStatus === toStatus && cached.expiresAt > now) {
      return NextResponse.json({ success: true, deduplicated: true });
    }
    dedupCache.set(serviceKey, { lastStatus: toStatus, expiresAt: now + DEDUP_TTL_MS });

    // ── Map to audit action ──────────────────────────────────────────────────────
    const action     = toStatus === "down" ? "SERVICE_DOWN"     : "SERVICE_RESTORED";
    const severity   = toStatus === "down" ? "WARN"             : "INFO";
    const httpStatus = toStatus === "down" ? 503                : 200;

    const message = toStatus === "down"
      ? `Service [${serviceName}] transitioned from ${fromStatus.toUpperCase()} to DOWN. Immediate attention may be required.`
      : `Service [${serviceName}] restored: ${fromStatus.toUpperCase()} to UP.`;

    const auditPayload = {
      tenantSlug:   "system",
      actorId:      "health-monitor",
      actorRole:    "system",
      actorIp:      "127.0.0.1",
      action,
      resourceType: "SERVICE",
      resourceId:   serviceKey,
      oldValue:     { status: fromStatus },
      newValue:     { status: toStatus },
      metadata: {
        serviceSource: "health-monitor",
        logType:       logType ?? "audit",
        logGroup:      "CORE",
        status:        httpStatus,
        severity,
        category:      category ?? "core",
        message,
      },
    };

    const res = await fetch(`${GATEWAY_AUDIT_URL}/api/v1/audit/events`, {
      method:  "POST",
      headers: {
        "Content-Type":    "application/json",
        "X-Gateway-Token": GATEWAY_TOKEN,
      },
      body: JSON.stringify(auditPayload),
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[service-health-event] gateway-audit write failed: ${res.status} ${errText}`);
      return NextResponse.json({ success: false, error: errText }, { status: 502 });
    }

    return NextResponse.json({ success: true, action, serviceKey });
  } catch (err: any) {
    console.error("[service-health-event] Unexpected error:", err?.message);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
