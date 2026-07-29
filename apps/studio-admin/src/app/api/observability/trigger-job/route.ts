import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? "http://ftth-backend:9090";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { scriptKey } = body;
    if (!scriptKey) return NextResponse.json({ error: "scriptKey is required" }, { status: 400 });

    const res = await fetch(`${BACKEND_URL}/api/v1/system/backup-status/trigger/${scriptKey}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error(`Backend trigger returned status ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to trigger job";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
