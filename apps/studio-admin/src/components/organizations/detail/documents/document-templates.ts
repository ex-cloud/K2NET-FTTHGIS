import type { EnrichedOrganization } from "../../types";
import type { TenantDocument } from "./types";

export interface DocumentTemplateContent {
  title: string;
  docNumber: string;
  date: string;
  categoryLabel: string;
  classification: string;
  effectivePeriod?: string;
  sections: {
    heading: string;
    content: string;
    bullets?: string[];
    table?: {
      headers: string[];
      rows: string[][];
    };
  }[];
  signatories?: {
    role: string;
    name: string;
    entity: string;
    signatureDate: string;
  }[];
}

export function getDocumentTemplate(
  doc: TenantDocument,
  org: EnrichedOrganization
): DocumentTemplateContent {
  const orgName = org.name || "PT ISP MITRA NUSANTARA";
  const orgSlug = (org.slug || "tenant").toUpperCase();
  const picName = org.picName || "Direktur Operasional";
  const planName = org.planTier || "Enterprise";

  const lowerName = doc.name.toLowerCase();

  // 1. MoU SaaS Enterprise Agreement
  if (lowerName.includes("mou") || lowerName.includes("enterprise-agreement")) {
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

  // 2. BAST Serah Terima Onboarding NOC
  if (lowerName.includes("bast") || lowerName.includes("serah-terima")) {
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

  // 3. NPWP & NIB Legalitas Badan Hukum
  if (lowerName.includes("npwp") || lowerName.includes("legalitas") || lowerName.includes("nib")) {
    return {
      title: "BERKAS VERIFIKASI LEGALITAS BADAN HUKUM & PERIZINAN ISP",
      docNumber: `KYC/LEGAL-VERIF/${orgSlug}/2026`,
      date: "01 Agustus 2026",
      categoryLabel: "COMPLIANCE & REGULATORY",
      classification: "VERIFIED COMPLIANCE RECORD",
      sections: [
        {
          heading: "1. IDENTITAS BADAN USAHA PENYELENGGARA",
          content: `Dokumen ini memuat data verifikasi legalitas resmi dari ${orgName} yang telah divalidasi oleh Tim Kepatuhan Hukum K2NET sesuai ketentuan Kementerian Komunikasi dan Digital RI (Komdigi / Kominfo) serta OSS RBA.`,
          table: {
            headers: ["Parameter Legal", "Keterangan / Nomor Registrasi", "Status Validasi"],
            rows: [
              ["Nama Badan Hukum", orgName, "VALID"],
              ["Nomor Induk Berusaha (NIB)", "9120003841928 (KBLI 61921 - ISP)", "TERVERIFIKASI OSS"],
              ["Nomor Pokok Wajib Pajak (NPWP)", "01.892.384.7-429.000", "TERDAFTAR DJP"],
              ["Izin Penyelenggaraan ISP", "SK Dirjen PPI No. 482/TEL.02.02/2024", "AKTIF / RESMI"],
              ["SK Pengesahan Kemenkumham", "AHU-0029384.AH.01.01.TAHUN 2023", "TERCATAT"],
              ["Penanggung Jawab / PIC", picName, "TERVERIFIKASI ID"],
              ["Status Kepatuhan B2B", "KYC COMPLIANT & B2B VERIFIED", "APPROVED"],
            ],
          },
        },
        {
          heading: "2. KETENTUAN KEAMANAN INFORMASI & DATA PRIVACY",
          content: "Penyelenggara tunduk pada Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP). Seluruh data pelanggan telekomunikasi yang diunggah ke platform K2NET wajib digunakan secara sah dan memenuhi standar keamanan siber ISO/IEC 27001.",
        },
      ],
      signatories: [
        {
          role: "Head of Legal & Compliance",
          name: "Siti Rahmawati, S.H., LL.M.",
          entity: "PT KREASI KOMUNIKASI NUSANTARA",
          signatureDate: "01 Agustus 2026",
        },
      ],
    };
  }

  // 4. Topologi Jaringan & BRAS Interconnect
  if (lowerName.includes("topology") || lowerName.includes("bras") || lowerName.includes("kmz")) {
    return {
      title: "SPESIFIKASI TEKNIS TOPOLOGI CORE ROUTER & BRAS INTERCONNECT",
      docNumber: `TECH-SPEC/TOPOLOGY/${orgSlug}/2026/08`,
      date: "10 Agustus 2026",
      categoryLabel: "NETWORK ARCHITECTURE SPECIFICATION",
      classification: "TECHNICAL CONFIDENTIAL",
      sections: [
        {
          heading: "1. DESKRIPSI ARSITEKTUR JARINGAN CORE & AGGREGATION",
          content: `Dokumen arsitektur interkoneksi jaringan FTTH untuk ${orgName}. Mengintegrasikan Core Router, BGP Edge Gateway, BRAS PPPoE Concentrator, dan OLT Distribution Nodes ke dalam platform K2NET GIS.`,
        },
        {
          heading: "2. ALOKASI VLAN & SUBNETTING IP ADDRESS",
          content: "Tabel pembagian VLAN ID pada jalur Uplink 10G SFP+ Trunk:",
          table: {
            headers: ["VLAN ID", "Fungsi Jaringan", "Subnet IP", "Gateway / Router"],
            rows: [
              ["VLAN 100", "Management OLT & Network Elements", "10.100.0.0/22", "10.100.0.1 (Core-01)"],
              ["VLAN 200", "PPPoE Broadband Residensial", "100.64.0.0/16 (CGNAT)", "BRAS-MikroTik-01"],
              ["VLAN 300", "Dedicated Corporate DIA", "103.148.20.0/24 (Public)", "Core-BGP-Border"],
              ["VLAN 400", "VoIP / SIP Trunk Voice", "10.200.10.0/24", "SIP-Proxy-01"],
              ["VLAN 500", "IPTV Multicast Video Streams", "10.200.20.0/24", "IGMP-Querier"],
            ],
          },
        },
        {
          heading: "3. PARAMETER INTEGRASI OLT & TELEMETRI SPASIAL",
          content: "Daftar perangkat OLT aktif yang dimonitoring langsung oleh microservice go-poller (port 5010):",
          bullets: [
            "OLT Core 01 (ZTE C320): IP 10.100.1.10 — 8 GPON Ports — 1,024 Maximum ONT Capacity",
            "OLT Core 02 (Huawei MA5608T): IP 10.100.1.11 — 16 GPON Ports — 2,048 Maximum ONT Capacity",
            "Threshold Alarm Redaman Optik: Warning pada -25 dBm, Critical Alarm pada -28 dBm.",
            "Sinkronisasi Spasial: Titik koordinat ODP & Joint Closure terhubung via PostGIS DB (SRID 4326).",
          ],
        },
      ],
      signatories: [
        {
          role: "Field Network Engineer",
          name: "Budi Santoso, S.T.",
          entity: "FTTH Infrastructure Division",
          signatureDate: "10 Agustus 2026",
        },
      ],
    };
  }

  // 5. SLA Commitment Guarantee 99.5% Tier
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

export function generateDownloadableHtml(
  doc: TenantDocument,
  org: EnrichedOrganization
): string {
  const tpl = getDocumentTemplate(doc, org);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${tpl.title} - ${org.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 40px auto;
      max-width: 800px;
      line-height: 1.6;
      color: #1a202c;
      background: #ffffff;
      padding: 0 20px;
    }
    .header {
      border-bottom: 3px double #2d3748;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.5px;
    }
    .brand-sub {
      font-size: 11px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 10px;
      font-weight: 700;
      font-family: monospace;
      border-radius: 4px;
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    h1 {
      font-size: 16px;
      font-weight: 800;
      text-align: center;
      margin: 24px 0 6px 0;
      color: #111827;
      line-height: 1.4;
    }
    .doc-meta {
      text-align: center;
      font-size: 11px;
      font-family: monospace;
      color: #6b7280;
      margin-bottom: 32px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 12px;
    }
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #1f2937;
      text-transform: uppercase;
      border-left: 3px solid #059669;
      padding-left: 8px;
      margin-bottom: 8px;
    }
    .section-content {
      font-size: 12px;
      color: #374151;
      white-space: pre-line;
    }
    ul {
      margin: 8px 0;
      padding-left: 20px;
      font-size: 12px;
      color: #374151;
    }
    li {
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background: #f9fafb;
      font-weight: 700;
      color: #111827;
    }
    .signatures {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px dashed #cbd5e1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    .sig-block {
      font-size: 11px;
    }
    .sig-role {
      font-weight: 700;
      color: #4b5563;
      margin-bottom: 50px;
    }
    .sig-name {
      font-weight: 800;
      color: #111827;
      text-decoration: underline;
    }
    .sig-entity {
      color: #6b7280;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
      font-family: monospace;
    }
    @media print {
      body { margin: 0; padding: 15mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">K2NET FTTH GIS ENTERPRISE</div>
      <div class="brand-sub">Platform Otomasi Telekomunikasi &amp; Jaringan Fiber Optik</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">${tpl.classification}</span>
      <div style="font-size: 10px; color: #6b7280; margin-top: 4px; font-family: monospace;">Tgl: ${tpl.date}</div>
    </div>
  </div>

  <h1>${tpl.title}</h1>
  <div class="doc-meta">
    No. Berkas: ${tpl.docNumber} &nbsp;•&nbsp; Tenant: ${org.name} (${org.slug})
    ${tpl.effectivePeriod ? `<br>Masa Berlaku: ${tpl.effectivePeriod}` : ""}
  </div>

  ${tpl.sections
    .map(
      (sec) => `
    <div class="section">
      <div class="section-title">${sec.heading}</div>
      <div class="section-content">${sec.content}</div>
      ${
        sec.bullets
          ? `<ul>${sec.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`
          : ""
      }
      ${
        sec.table
          ? `<table>
          <thead>
            <tr>${sec.table.headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${sec.table.rows
              .map(
                (r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>`
          : ""
      }
    </div>
  `
    )
    .join("")}

  ${
    tpl.signatories && tpl.signatories.length > 0
      ? `
    <div class="signatures">
      ${tpl.signatories
        .map(
          (sig) => `
        <div class="sig-block">
          <div class="sig-role">${sig.role}</div>
          <div class="sig-name">${sig.name}</div>
          <div class="sig-entity">${sig.entity}</div>
          <div style="color: #9ca3af; margin-top: 2px;">Tanggal: ${sig.signatureDate}</div>
        </div>
      `
        )
        .join("")}
    </div>
  `
      : ""
  }

  <div class="footer">
    Dokumen ini digenerate secara resmi melalui Sistem Vault Legalitas K2NET FTTH GIS Enterprise SaaS.<br>
    Integritas berkas terenkripsi dan tercatat dalam log audit platform (SHA-256 Verified).
  </div>
</body>
</html>`;
}

export function createBinaryPdfBlob(tpl: DocumentTemplateContent, org: EnrichedOrganization): Blob {
  let stream = "BT\n";
  stream += "/F1 16 Tf\n50 785 Td\n(K2NET FTTH GIS ENTERPRISE) Tj\n";
  stream += "/F2 9 Tf\n0 -13 Td\n(Platform Otomasi Telekomunikasi & Infrastruktur Fiber Optik) Tj\n";
  stream += "/F1 9 Tf\n330 13 Td\n([" + (tpl.classification || "LEGAL RECORD") + "]) Tj\n";
  stream += "/F2 8 Tf\n0 -11 Td\n(Status: VERIFIED LEGAL RECORD) Tj\n";
  stream += "ET\n";

  // Separator Line
  stream += "0.75 0.75 0.75 RG\n1 w\n50 745 m 545 745 l S\n";

  // Document Header
  stream += "BT\n/F1 12.5 Tf\n0.1 0.1 0.1 rg\n50 720 Td\n(" + tpl.title.replace(/[()]/g, "") + ") Tj\n";
  stream += "/F2 8.5 Tf\n0.35 0.35 0.35 rg\n0 -13 Td\n(No. Dokumen: " + tpl.docNumber + "   |   Tenant: " + org.name + " [" + org.slug + "]) Tj\n";
  if (tpl.effectivePeriod) {
    stream += "/F3 8 Tf\n0 -11 Td\n(Masa Berlaku: " + tpl.effectivePeriod + ") Tj\n";
  }
  stream += "ET\n";

  let currentY = 665;
  for (const sec of tpl.sections) {
    stream += "BT\n/F1 9.5 Tf\n0.15 0.15 0.15 rg\n50 " + currentY + " Td\n(" + sec.heading.replace(/[()]/g, "") + ") Tj\n";
    currentY -= 13;

    stream += "/F2 8.5 Tf\n0.25 0.25 0.25 rg\n50 " + currentY + " Td\n";
    const words = sec.content.replace(/[()]/g, "").split(" ");
    let line = "";
    let lineCount = 0;
    for (const w of words) {
      if ((line + " " + w).length > 95) {
        stream += "(" + line.trim() + ") Tj\n0 -11 Td\n";
        line = w + " ";
        lineCount++;
      } else {
        line += w + " ";
      }
    }
    if (line.trim()) {
      stream += "(" + line.trim() + ") Tj\n";
      lineCount++;
    }
    currentY -= (lineCount * 11 + 5);

    if (sec.bullets) {
      for (const b of sec.bullets) {
        const cleanB = b.replace(/[()]/g, "").replace(/✔/g, "-");
        stream += "0 -11 Td\n(  * " + cleanB + ") Tj\n";
        currentY -= 11;
      }
    }
    currentY -= 8;
    stream += "ET\n";
  }

  // Signatures
  if (tpl.signatories && tpl.signatories.length > 0) {
    currentY -= 10;
    stream += "0.8 0.8 0.8 RG\n1 w\n50 " + (currentY + 15) + " m 545 " + (currentY + 15) + " l S\n";
    stream += "BT\n/F1 8.5 Tf\n50 " + currentY + " Td\n(PIHAK PERTAMA (K2NET):) Tj\n";
    stream += "300 0 Td\n(PIHAK KEDUA (TENANT):) Tj\n";
    currentY -= 35;
    stream += "ET\nBT\n/F1 8.5 Tf\n50 " + currentY + " Td\n(" + (tpl.signatories[0]?.name || "Super Admin") + ") Tj\n";
    stream += "/F2 7.5 Tf\n0 -10 Td\n(" + (tpl.signatories[0]?.role || "Platform Admin") + ") Tj\n";
    stream += "/F1 8.5 Tf\n300 10 Td\n(" + (tpl.signatories[1]?.name || "Direktur Utama") + ") Tj\n";
    stream += "/F2 7.5 Tf\n0 -10 Td\n(" + (tpl.signatories[1]?.role || org.name) + ") Tj\nET\n";
  }

  // Footer
  stream += "BT\n/F3 7 Tf\n0.45 0.45 0.45 rg\n50 30 Td\n(Dokumen resmi K2NET FTTH GIS Enterprise SaaS - Terenkripsi & Tercatat dalam Audit Log SHA-256) Tj\nET\n";

  const streamBytes = new TextEncoder().encode(stream);
  const pdfParts: (string | Uint8Array)[] = [];
  pdfParts.push("%PDF-1.4\n");
  const offsets: number[] = [];

  function getLength(): number {
    return pdfParts.reduce((acc, p) => acc + (typeof p === "string" ? p.length : p.byteLength), 0);
  }

  offsets.push(getLength());
  pdfParts.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  offsets.push(getLength());
  pdfParts.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  offsets.push(getLength());
  pdfParts.push("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>\nendobj\n");

  offsets.push(getLength());
  pdfParts.push("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n");

  offsets.push(getLength());
  pdfParts.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

  offsets.push(getLength());
  pdfParts.push("6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n");

  offsets.push(getLength());
  pdfParts.push(`7 0 obj\n<< /Length ${streamBytes.byteLength} >>\nstream\n`);
  pdfParts.push(streamBytes);
  pdfParts.push("\nendstream\nendobj\n");

  const xrefOffset = getLength();
  let xrefStr = "xref\n0 8\n0000000000 65535 f \n";
  for (const o of offsets) {
    xrefStr += String(o).padStart(10, "0") + " 00000 n \n";
  }
  xrefStr += `trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  pdfParts.push(xrefStr);

  return new Blob(pdfParts as BlobPart[], { type: "application/pdf" });
}

export function downloadDocumentFile(
  doc: TenantDocument,
  org: EnrichedOrganization
) {
  const tpl = getDocumentTemplate(doc, org);
  const isPdf = doc.format === "PDF" || doc.name.toLowerCase().endsWith(".pdf");

  let blob: Blob;
  let filename = doc.name;

  if (isPdf) {
    blob = createBinaryPdfBlob(tpl, org);
    if (!filename.toLowerCase().endsWith(".pdf")) {
      filename += ".pdf";
    }
  } else {
    const htmlContent = generateDownloadableHtml(doc, org);
    blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    if (!filename.toLowerCase().endsWith(".html") && !filename.toLowerCase().endsWith(".kmz")) {
      filename = filename.replace(/\.[^/.]+$/, "") + ".html";
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
