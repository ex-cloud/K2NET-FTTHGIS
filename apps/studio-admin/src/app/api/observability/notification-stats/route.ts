import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NOTIFICATION_GATEWAY_URL = process.env.NOTIFICATION_GATEWAY_URL ?? "http://ftth-notification-gateway:5001";
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN ?? "";

function decodeJwt(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    return JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader ? authHeader.replace("Bearer ", "") : "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decoded = decodeJwt(token);
  const tenantId = String(decoded.tenantId ?? decoded.tenant_id ?? "system");

  try {
    const res = await fetch(`${NOTIFICATION_GATEWAY_URL}/stats`, {
      headers: {
        "X-Gateway-Token": GATEWAY_TOKEN,
        "X-Tenant-ID": tenantId,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`notification-gateway /stats: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "notification-gateway unreachable";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
