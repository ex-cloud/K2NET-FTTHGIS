import type { EnrichedOrganization } from "../../../types";
import type { DocumentTemplateContent } from "./types";

export function getBastTemplate(
  org: EnrichedOrganization,
  orgName: string,
  orgSlug: string,
  picName: string
): DocumentTemplateContent {
  return {
    title: "BERITA ACARA SERAH TERIMA (BAST) ONBOARDING & INTEGRASI SISTEM NOC",
    docNumber: `BAST/NOC-K2NET/${orgSlug}/2026/08`,
    date: "02 Agustus 2026",
    categoryLabel: "DOKUMEN TEKNIS OPERASIONAL",
    classification: "OFFICIAL TECHNICAL CLEARANCE",
    effectivePeriod: "Berlaku Efektif Sejak Tanggal Serah Terima",
    sections: [
      {
        heading: "1. PENJELASAN UMUM ONBOARDING",
        content: `Pada hari Selasa, tanggal dua bulan Agustus tahun dua ribu dua puluh enam (02-08-2026), telah diselesaikan seluruh rangkaian instalasi, konfigurasi tenant realm, dan uji kelayakan teknis platform FTTH GIS K2NET untuk ISP ${orgName}.`,
      },
      {
        heading: "2. ITEM SERAH TERIMA INFRASTRUKTUR SAAS",
        content: "Seluruh artefak teknis berikut telah divalidasi dan diserahkan kepada perwakilan teknis tenant:",
        table: {
          headers: ["Komponen Sistem", "Detail Konfigurasi", "Status Verifikasi"],
          rows: [
            ["Keycloak Identity Realm", `Realm: ${org.slug}, Protocol OpenID Connect`, "ACTIVE / READY"],
            ["Custom Domain & SSL", `${org.slug}.gis.kdua.net (Let's Encrypt TLS 1.3)`, "VERIFIED (A Record)"],
            ["Spatial PostGIS Schema", "Multi-tenant tenant_id scoped isolation", "INITIALIZED"],
            ["OLT SNMP Telemetry", "Polling engine agent port 5010 (15s interval)", "CONNECTED (100% OK)"],
            ["MikroTik BRAS Gateway", "Radius Accounting port 1812 / 1813", "TEST PACKET OK"],
            ["MinIO S3 Asset Bucket", "Private encrypted bucket tenant-assets", "READY"],
          ],
        },
      },
      {
        heading: "3. HASIL PENGUJIAN FUNGSI (QUALITY ASSURANCE CHECKLIST)",
        content: "Pemeriksaan fungsi modul operasional dengan hasil 100% Lulus:",
        bullets: [
          "✔ Uji Ingress Routing Kong & Header Decoration (X-Tenant-ID): LULUS (Latency 1.2ms)",
          "✔ Uji Sinkronisasi Inventaris OLT (Huawei/ZTE/HSGQ): LULUS (Rx/Tx Optical Power akurat)",
          "✔ Uji Penggambaran Spasial Kabel Fiber & ODP Splice: LULUS (GeoJSON rendering mulus)",
          "✔ Uji Notifikasi WhatsApp Gateway (Twilio/WABA): LULUS (Template terkirim < 2 detik)",
          "✔ Uji Otomasi Backup Harian & DR Snapshot: LULUS (PostgreSQL dump terenkripsi)",
        ],
      },
      {
        heading: "4. KESIMPULAN & REKOMENDASI",
        content: "Tim NOC K2NET menyatakan bahwa sistem FTTH GIS untuk tenant ini telah memenuhi seluruh kriteria kelayakan operasional (Production Ready) dan siap digunakan untuk manajemen pelanggan serta pemeliharaan jaringan secara mandiri.",
      },
    ],
    signatories: [
      {
        role: "NOC Lead Engineer (K2NET)",
        name: "Rian Pratama, S.T.",
        entity: "NOC Operations Division K2NET",
        signatureDate: "02 Agustus 2026",
      },
      {
        role: "IT & Network Manager (Tenant)",
        name: picName,
        entity: orgName,
        signatureDate: "02 Agustus 2026",
      },
    ],
  };
}
