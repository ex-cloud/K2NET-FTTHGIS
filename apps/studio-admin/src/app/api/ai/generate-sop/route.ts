/**
 * POST /api/ai/generate-sop
 * Proxy ke gateway-ai untuk generate draft SOP via streaming SSE.
 * Request body: { title, category, scope }
 * Response: text/event-stream (SSE) — mengalirkan token Markdown ke client
 */
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getGatewayToken, GATEWAY_URL_MAP } from "@/lib/actions/gateways/common";

const AI_GATEWAY_URL = GATEWAY_URL_MAP.ai || process.env.AI_GATEWAY_URL || "http://ftth-ai-gateway:5012";

// Peta kategori untuk memperkaya prompt
const CATEGORY_LABELS: Record<string, string> = {
  TROUBLESHOOTING: "Troubleshooting & Penanganan Gangguan OLT/Optical",
  NETWORK_CONFIG: "Arsitektur & Konfigurasi Jaringan",
  GIS_MANUAL: "GIS, Survey Spasial & Pemetaan Aset",
  INFRASTRUCTURE: "DevOps & Infrastruktur Server",
  PLANS: "Perencanaan & Roadmap Jaringan",
  GENERAL: "General & Standar SOP Operasional",
};

// Peta scope untuk memperkaya prompt
const SCOPE_LABELS: Record<string, string> = {
  PLATFORM_INTERNAL: "Platform Super Admin (Dokumen internal rahasia K2NET)",
  TENANT_INTERNAL: "Mitra ISP / Tenant Internal (NOC & Teknisi Lapangan ISP)",
  GLOBAL: "Publik / Global (Semua Pengguna Platform)",
};

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

  const categoryLabel = CATEGORY_LABELS[category] || category;
  const scopeLabel = SCOPE_LABELS[scope] || scope;
  const gatewayToken = getGatewayToken();

  const systemPrompt = `Kamu adalah Senior FTTH Network Architect & Technical Documentation Writer K2NET.
Tugasmu adalah menghasilkan dokumen SOP (Standard Operating Procedure) resmi secara instan dalam format Markdown standar untuk sistem FTTH GIS K2NET.

ATURAN MUTLAK PENULISAN:
1. DILARANG KERAS menyapa atau menulis kalimat pengantar seperti "Berikut adalah draf...", "Tentu...", "Berikut ini...".
2. DILARANG KERAS menulis kalimat penutup obrolan seperti "Semoga membantu...", "Jika butuh revisi...".
3. Mulai LANGSUNG pada baris pertama dengan "# ${title}".
4. Tuliskan SELURUH 7 seksi secara lengkap, padat, teknis, dan tuntas hingga seksi 7 selesai.
5. Gunakan bahasa Indonesia teknis yang baku dan profesional.`;

  const generationPrompt = `Buatkan dokumen SOP resmi lengkap untuk:
- Judul: ${title}
- Kategori: ${categoryLabel}
- Target Otoritas / Visibilitas: ${scopeLabel}

Struktur Dokumen (Wajib lengkap seluruh 7 seksi):

# ${title}

## 1. Tujuan & Ringkasan Eksekutif
Jelaskan tujuan operasional dokumen ini dan standar mutu yang dicapai.

## 2. Ruang Lingkup & Otoritas Akses
Sebutkan pihak/role pelaksana (${scopeLabel}) dan tanggung jawab masing-masing.

## 3. Prasyarat & Alat Kerja Lapangan (Prerequisites)
- Peralatan hardware / software / tools lapangan (OPM, OTDR, Fusion Splicer, CLI)
- Hak akses sistem & kredensial
- Standar K3 dan keselamatan kerja

## 4. Prosedur Kerja Langkah demi Langkah
1. **Tahap Persiapan & Verifikasi Awal**: Langkah-langkah cek awal.
2. **Tahap Eksekusi Teknis**: Prosedur teknis terperinci dengan format penamaan / konfigurasi / langkah fisik.
3. **Tahap Validasi & Pengujian**: Pengujian fungsi dan verifikasi hasil.

## 5. Batas Parameter Teknis & Threshold Kritis
Buat tabel acuan standar parameter teknis, redaman optik (dBm), status LED, atau error code yang relevan:
| Parameter / Indikator | Nilai Standar / Ideal | Batas Toleransi Kritis | Tindakan Korektif |
|---|---|---|---|
| Redaman ODP / Drop Cable | -15 s/d -22 dBm | Max -27 dBm | Re-splicing / cek konektor |
| ... | ... | ... | ... |

## 6. Penanganan Masalah & Prosedur Eskalasi (Troubleshooting)
Sebutkan skenario gangguan umum beserta langkah penanganan cepat dan alur eskalasi.

## 7. Checklist Penyelesaian & Catatan Kepatuhan
- [ ] Checklist verifikasi fisik dan konfigurasi
- [ ] Checklist dokumentasi dan tagging aset pada GIS
- [ ] Serah terima pekerjaan

Tuliskan dokumen lengkap sekarang:`;

  // Panggil gateway-ai chat/stream dengan SSE
  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(`${AI_GATEWAY_URL}/api/v1/ai/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Token": gatewayToken,
        "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
        "X-Actor-ID": session?.user?.email || "admin@k2net.id",
        "X-Actor-Role": "super_admin",
      },
      body: JSON.stringify({
        message: generationPrompt,
        system_prompt: systemPrompt,
        history: [],
        scope: "GENERAL",
        model: "",
        session_id: null,
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
