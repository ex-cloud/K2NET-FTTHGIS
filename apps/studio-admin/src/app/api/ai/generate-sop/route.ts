/**
 * POST /api/ai/generate-sop
 * Proxy ke gateway-ai untuk generate draft SOP via streaming SSE.
 * Request body: { title, category, scope }
 * Response: text/event-stream (SSE) — mengalirkan token Markdown ke client
 */
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const AI_GATEWAY_URL = process.env.AI_GATEWAY_URL || "http://ftth-ai-gateway:5012";
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || "";

// Peta kategori untuk memperkaya prompt
const CATEGORY_LABELS: Record<string, string> = {
  TROUBLESHOOTING: "Troubleshooting & Penyelesaian Masalah",
  NETWORK_CONFIG: "Konfigurasi Jaringan & Protokol",
  GIS_MANUAL: "GIS & Survey Lapangan",
  INFRASTRUCTURE: "Infrastruktur Server & DevOps",
  PLANS: "Perencanaan & Roadmap",
  GENERAL: "General & SOP Umum",
};

// Peta scope untuk memperkaya prompt
const SCOPE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Platform Super Admin (akses khusus manajemen K2NET)",
  TENANT_NOC: "Tenant ISP / Mitra NOC (Teknisi jaringan ISP)",
  GLOBAL: "Global / Umum (semua pengguna platform)",
  PUBLIC: "Publik (tanpa autentikasi)",
};

export async function POST(req: NextRequest) {
  // Auth check: hanya Super Admin
  const session = await auth();
  const roles: string[] = (session?.user as { roles?: string[] })?.roles ?? [];
  const isSuperAdmin = roles.includes("super_admin") || roles.includes("ROLE_SUPER_ADMIN");
  if (!isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!title) {
    return NextResponse.json({ error: "Judul SOP tidak boleh kosong" }, { status: 400 });
  }

  const categoryLabel = CATEGORY_LABELS[category] || category;
  const scopeLabel = SCOPE_LABELS[scope] || scope;

  // Buat prompt yang kaya konteks berdasarkan metadata form
  const generationPrompt = `Buatkan draft SOP (Standard Operating Procedure) / dokumentasi teknis dalam format Markdown yang komprehensif dengan spesifikasi berikut:

**Judul Dokumen**: ${title}
**Kategori**: ${categoryLabel}
**Target Audiens / Visibilitas**: ${scopeLabel}

**Panduan Penulisan Dokumen**:
1. Gunakan heading H1 (# Judul), H2 (## Seksi), H3 (### Sub-seksi) secara terstruktur
2. Sertakan seksi: Tujuan, Ruang Lingkup, Prasyarat, Langkah-Langkah Prosedur (bernomor), Troubleshooting Cepat, Referensi
3. Jika berkaitan dengan jaringan/OLT/ONT: sertakan nilai parameter teknis (dBm, threshold, command CLI) yang relevan
4. Gunakan bullet point, code block (\`\`\`) untuk perintah CLI/config, dan tabel jika perlu
5. Akhiri dengan bagian "Catatan Penting" dan "Revisi Dokumen"
6. Bahasa: Indonesia teknis yang jelas dan profesional
7. Panjang: minimal 500 kata, komprehensif dan siap digunakan

Hasilkan dokumen lengkap sekarang:`;

  // Panggil gateway-ai chat/stream dengan SSE
  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(`${AI_GATEWAY_URL}/api/v1/ai/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Token": GATEWAY_TOKEN,
        "X-Tenant-ID": "system",
        "X-Actor-ID": session?.user?.email || "admin",
      },
      body: JSON.stringify({
        message: generationPrompt,
        history: [],
        scope: scope,
        session_id: null,
      }),
    });
  } catch (err) {
    console.error("[generate-sop] Failed to connect to AI gateway:", err);
    return NextResponse.json(
      { error: "Gagal terhubung ke AI gateway. Pastikan layanan ftth-ai-gateway aktif." },
      { status: 503 }
    );
  }

  if (!upstreamRes.ok || !upstreamRes.body) {
    const errText = await upstreamRes.text().catch(() => "");
    console.error("[generate-sop] Upstream error:", upstreamRes.status, errText);
    return NextResponse.json(
      { error: `AI gateway error: ${upstreamRes.status} ${upstreamRes.statusText}` },
      { status: upstreamRes.status }
    );
  }

  // Pipe SSE stream upstream → client
  // Transform: hanya ambil token "content" dari event data, ignore status events
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
        // Parse SSE lines from upstream
        const lines = text.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;

          try {
            const parsed = JSON.parse(raw);
            if (parsed.type === "token" && parsed.content) {
              // Forward token sebagai SSE ke client
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ token: parsed.content })}\n\n`)
              );
            } else if (parsed.type === "done" || parsed.type === "end") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
            // Skip status/thinking events — jangan forward ke client
          } catch {
            // Jika raw bukan JSON, mungkin plain text token (fallback stream format)
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
