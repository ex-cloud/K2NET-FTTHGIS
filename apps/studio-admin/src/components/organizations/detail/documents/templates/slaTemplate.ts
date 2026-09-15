import type { EnrichedOrganization } from "../../../types";
import type { DocumentTemplateContent } from "./types";

export function getSlaTemplate(
  _org: EnrichedOrganization,
  orgName: string,
  orgSlug: string,
  planName: string
): DocumentTemplateContent {
  return {
    title: "SERVICE LEVEL AGREEMENT (SLA) & JAMINAN TINGKAT LAYANAN PLATFORM (99.5%)",
    docNumber: `SLA-K2NET/GOLD-TIER/${orgSlug}/2026`,
    date: "01 Agustus 2026",
    categoryLabel: "SERVICE LEVEL COMMITMENT",
    classification: "OFFICIAL SLA GUARANTEE",
    effectivePeriod: "01 Agustus 2026 – 01 Agustus 2027",
    sections: [
      {
        heading: "1. KOMITMEN KETERSEDIAAN SISTEM (UPTIME GUARANTEE)",
        content: `PT KREASI KOMUNIKASI NUSANTARA memberikan komitmen ketersediaan layanan (Uptime) minimal sebesar 99.5% per bulan kalender untuk seluruh layanan inti platform FTTH GIS SaaS yang dilanggan oleh ${orgName} (${planName}).`,
      },
      {
        heading: "2. KLASIFIKASI INSIDEN & RESPONSE TIME MATRIX",
        content: "Matriks waktu tanggap (Response Time) dan target resolusi (Resolution Target) berdasarkan tingkat keparahan insiden:",
        table: {
          headers: ["Tingkat Insiden", "Definisi Masalah", "Response Time", "Resolution Time"],
          rows: [
            ["P1 — Critical", "Platform Core / API Gateway total down (tidak dapat diakses)", "< 15 Menit", "< 2 Jam"],
            ["P2 — Major", "Gangguan modul kritis (OLT Poller / Radius / Maps terhenti)", "< 30 Menit", "< 4 Jam"],
            ["P3 — Minor", "Degradasi performa minor tanpa dampak operasional utama", "< 2 Jam", "< 12 Jam"],
            ["P4 — Inquiry", "Permintaan bantuan konfigurasi, ekspor data, konsultasi", "< 4 Jam", "< 24 Jam"],
          ],
        },
      },
      {
        heading: "3. SKEMA KOMPENSASI SERVICE CREDIT",
        content: "Apabila ketersediaan layanan bulanan berada di bawah komitmen 99.5%, Tenant berhak mengajukan Service Credit tagihan bulan berikutnya dengan skema:",
        table: {
          headers: ["Pencapaian Uptime Bulanan", "Persentase Service Credit"],
          rows: [
            ["99.00% – 99.49%", "10% Potongan Tagihan Bulanan"],
            ["98.00% – 98.99%", "25% Potongan Tagihan Bulanan"],
            ["< 98.00%", "50% Potongan Tagihan Bulanan"],
          ],
        },
      },
      {
        heading: "4. PROSEDUR ESKALASI SUPPORT 24/7",
        content: "Hubungi Hotline Pusat Komando NOC K2NET melalui:\n• Emergency Hotline: +62 21 5088 9000 (Ext. 1 - Critical Support)\n• Email NOC: noc@kdua.net / support@gis.kdua.net\n• WhatsApp Priority Support Bot: +62 811 9988 2026",
      },
    ],
    signatories: [
      {
        role: "Head of Infrastructure & Operations",
        name: "Ir. Hendra Wijaya, M.Sc.",
        entity: "K2NET Cloud Platform Division",
        signatureDate: "01 Agustus 2026",
      },
    ],
  };
}
