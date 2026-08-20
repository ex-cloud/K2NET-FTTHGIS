/**
 * POST /api/ai/generate-sop
 * Proxy ke gateway-ai untuk generate draft SOP berbasis sintesis RAG internal server + standar industri FTTH.
 * Request body: { title, category, scope }
 * Response: text/event-stream (SSE) — mengalirkan token Markdown ke client
 */
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getGatewayToken, GATEWAY_URL_MAP } from "@/lib/actions/gateways/common";

const AI_GATEWAY_URL = GATEWAY_URL_MAP.ai || process.env.AI_GATEWAY_URL || "http://ftth-ai-gateway:5012";

export async function POST(req: NextRequest) {
  // Auth check: hanya Super Admin
  const session = await auth();
  const roles: string[] = (session?.user as { roles?: string[] })?.roles ?? [];
  const isSuperAdmin = roles.includes("super_admin") || roles.includes("ROLE_SUPER_ADMIN");
  if (!isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized: Akses Super Admin diperlukan" }, { status: 401 });
  }

  let title = "";
  let category = "GENERAL";
  let scope = "GLOBAL";

  try {
    const body = await req.json();
    title = (body.title || "").trim();
    category = body.category || "GENERAL";
    scope = body.scope || "GLOBAL";
  } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 });
  }

  if (!title) {
    return NextResponse.json({ error: "Judul SOP tidak boleh kosong" }, { status: 400 });
  }

  const gatewayToken = getGatewayToken();

  // Panggil endpoint dedicated generate-sop/stream di gateway-ai
  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(`${AI_GATEWAY_URL}/api/v1/ai/generate-sop/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Token": gatewayToken,
        "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
        "X-Actor-ID": session?.user?.email || "admin@k2net.id",
        "X-Actor-Role": "super_admin",
      },
      body: JSON.stringify({
        title,
        category,
        scope,
        model: "",
      }),
    });
  } catch (err) {
    console.error("[generate-sop] Failed to connect to AI gateway:", err);
    return NextResponse.json(
      { error: "Gagal terhubung ke AI gateway. Pastikan layanan ftth-ai-gateway aktif pada port 5012." },
      { status: 503 }
    );
  }

  if (!upstreamRes.ok || !upstreamRes.body) {
    const errText = await upstreamRes.text().catch(() => "");
    console.error("[generate-sop] Upstream error:", upstreamRes.status, errText);
    return NextResponse.json(
      { error: `AI Gateway error (${upstreamRes.status}): ${errText || upstreamRes.statusText}` },
      { status: upstreamRes.status }
    );
  }

  // Pipe SSE stream upstream → client
  const encoder = new TextEncoder();
  const upstreamReader = upstreamRes.body.getReader();

  const stream = new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await upstreamReader.read();
        if (done) {
          controller.close();
          break;
        }

        const text = new TextDecoder().decode(value);
        const lines = text.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;

          try {
            const parsed = JSON.parse(raw);
            if (parsed.type === "token" && parsed.content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ token: parsed.content })}\n\n`)
              );
            } else if (parsed.type === "done" || parsed.type === "end") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
          } catch {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ token: raw })}\n\n`)
            );
          }
        }
      }
    },
    cancel() {
      upstreamReader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
