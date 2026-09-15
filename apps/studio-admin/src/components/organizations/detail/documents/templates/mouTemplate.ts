import type { EnrichedOrganization } from "../../../types";
import type { DocumentTemplateContent } from "./types";

export function getMouTemplate(
  org: EnrichedOrganization,
  orgName: string,
  orgSlug: string,
  picName: string
): DocumentTemplateContent {
  return {
    title: "PERJANJIAN KERJA SAMA INDUK LISENSI PLATFORM FTTH GIS SAAS",
    docNumber: `PKS/K2NET-FTTH/${orgSlug}/2026/08`,
    date: "01 Agustus 2026",
    categoryLabel: "PERJANJIAN LEGAL B2B",
    classification: "CONFIDENTIAL / RAHASIA",
    effectivePeriod: "01 Agustus 2026 – 01 Agustus 2027 (12 Bulan)",
    sections: [
      {
        heading: "PASAL 1 — PARA PIHAK & LATAR BELAKANG",
        content: `Perjanjian Kerja Sama ini dibuat dan ditandatangani pada hari Senin, tanggal satu bulan Agustus tahun dua ribu dua puluh enam (01-08-2026), oleh dan antara:\n\n1. PT KREASI KOMUNIKASI NUSANTARA (K2NET), penyedia platform FTTH GIS Enterprise SaaS multi-tenant, berkedudukan di Jakarta Cyber Building ("PIHAK PERTAMA").\n2. ${orgName}, penyelenggara jasa telekomunikasi/ISP terlisensi Kominfo ("PIHAK KEDUA").\n\nPara Pihak sepakat mengikatkan diri dalam penyediaan lisensi, infrastruktur cloud GIS spasial, dan integrasi telemetri FTTH dengan ketentuan di bawah ini.`,
      },
      {
        heading: "PASAL 2 — RUANG LINGKUP LAYANAN PLATFORM",
        content: "PIHAK PERTAMA memberikan hak akses lisensi non-eksklusif platform FTTH GIS SaaS Tier Enterprise kepada PIHAK KEDUA yang mencakup modul-modul berikut:",
        bullets: [
          "Spatial Map Engine & PostGIS Vector Layer (ODP, ODC, Fiber Cable, Pole, Distribution Closure).",
          "OLT Poller Telemetry Gateway & Live Optical Power Monitoring (Port 5010 / SNMP v2c/v3).",
          "Radius AAA Billing Gateway & MikroTik BRAS Session Provisioning.",
          "Dedicated Keycloak Multi-Tenant Identity Realm & Granular PBAC System.",
          "AI Knowledge Base & Support Diagnostic Copilot (500-token pgvector RAG).",
          "Automated Multi-Tier Disaster Recovery (Local DB Dump, MinIO S3 & Offsite Cloud).",
        ],
      },
      {
        heading: "PASAL 3 — HAK & KEWAJIBAN",
        content: "1. Hak PIHAK KEDUA: Memperoleh jaminan Service Level Agreement (SLA) 99.5%, dukungan teknis 24/7/365, serta pembaruan fitur platform berkala.\n2. Kewajiban PIHAK KEDUA: Menjaga kerahasiaan kredensial API Key/Gateway Token dan melakukan pembayaran biaya langganan sesuai paket yang disepakati.\n3. Hak PIHAK PERTAMA: Menerima pembayaran tepat waktu dan menangguhkan akses bila terjadi pelanggaran kepatuhan hukum.\n4. Kewajiban PIHAK PERTAMA: Menjamin isolasi data tenant (Tenant Isolation) pada tingkat Ingress Kong, Database, dan Storage S3.",
      },
      {
        heading: "PASAL 4 — KERAHASIAAN DATA & ISOLASI TENANT",
        content: "Data jaringan, pelanggan, dan penagihan milik PIHAK KEDUA adalah aset rahasia yang dilindungi oleh enkripsi TLS 1.3 in-transit dan AES-256 at-rest. PIHAK PERTAMA dilarang keras menjual, mendistribusikan, atau memberikan data tersebut kepada pihak ketiga mana pun tanpa persetujuan tertulis.",
      },
      {
        heading: "PASAL 5 — PENYELESAIAN SENGKETA & HUKUM YANG BERLAKU",
        content: "Perjanjian ini tunduk pada hukum Negara Kesatuan Republik Indonesia. Segala perselisihan yang timbul akan diselesaikan melalui musyawarah mufakat dalam waktu 30 hari kalender, dan apabila tidak tercapai kesepakatan, akan diselesaikan melalui Badan Arbitrase Nasional Indonesia (BANI).",
      },
    ],
    signatories: [
      {
        role: "PIHAK PERTAMA (Penyedia Platform)",
        name: "Andiansyah, S.Kom., M.T.",
        entity: "PT KREASI KOMUNIKASI NUSANTARA (K2NET)",
        signatureDate: "01 Agustus 2026",
      },
      {
        role: "PIHAK KEDUA (Tenant ISP)",
        name: picName,
        entity: orgName,
        signatureDate: "01 Agustus 2026",
      },
    ],
  };
}
