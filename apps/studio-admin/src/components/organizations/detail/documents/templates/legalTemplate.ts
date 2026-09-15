import type { EnrichedOrganization } from "../../../types";
import type { DocumentTemplateContent } from "./types";

export function getLegalTemplate(
  _org: EnrichedOrganization,
  orgName: string,
  orgSlug: string,
  picName: string
): DocumentTemplateContent {
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
