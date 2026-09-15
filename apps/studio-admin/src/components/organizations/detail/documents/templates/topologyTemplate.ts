import type { EnrichedOrganization } from "../../../types";
import type { DocumentTemplateContent } from "./types";

export function getTopologyTemplate(
  _org: EnrichedOrganization,
  orgName: string,
  orgSlug: string
): DocumentTemplateContent {
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
