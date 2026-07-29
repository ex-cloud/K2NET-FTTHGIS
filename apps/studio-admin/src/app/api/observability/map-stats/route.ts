import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const MAP_GATEWAY_URL = process.env.MAP_GATEWAY_URL ?? "http://map-gateway:5003";

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(`${MAP_GATEWAY_URL}/stats`, {
      headers: {
        "X-Gateway-Token": process.env.INTERNAL_GATEWAY_TOKEN ?? "",
        "X-Tenant-ID": String(token.tenantId ?? "system"),
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`map-gateway /stats: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "map-gateway unreachable";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
