---
name: bug-triage-and-plan
description: >-
  Prosedur terautomasi standar enterprise (7-Tahap SDLC di docs/sop_sdlc/) saat AI agent menemukan bug, celah keamanan,
  perubahan kebijakan, atau kegagalan audit/CI: (1) membuat tiket bug di docs/sop_sdlc/bug/active/,
  (2) menyusun dokumen diskusi & RCA di docs/sop_sdlc/discussions/active/, (3) mencatat keputusan arsitektur
  di docs/sop_sdlc/adr/NNNN-*.md (jika menyentuh arsitektur/keamanan/PBAC), (4) merumuskan action plan di
  docs/sop_sdlc/plans/active/, (5) menjalankan kode, Quality Gate 0-warning/0-error, commit/push & CI/CD deploy,
  (6) BERHENTI di Gerbang Wajib QA & User UAT (docs/sop_sdlc/qa/active/) untuk verifikasi kode & UI/UX bersama pengguna,
  serta (7) setelah lulus UAT pengguna, memindahkan QA ke qa/completed/, menerbitkan laporan akhir di
  docs/sop_sdlc/reports/, dan mengarsipkan dokumen ke completed/ & resolved/.
---

# 🛠️ Standard Operating Procedure: 7-Stage SDLC Bug Triage, Discussion, ADR, Planning, Mandatory QA/UAT Gate & Lifecycle Archival (`docs/sop_sdlc/`)

Skill ini diaktifkan saat AI Agent menemukan bug, menerima laporan kegagalan audit, merancang perubahan kebijakan/arsitektur, atau merencanakan perbaikan/fitur terstruktur pada platform K2NET FTTH GIS.

> 📂 **LOKASI RUANG KERJA SDLC MURNI**: Seluruh 12 folder dokumen SDLC berada di dalam **`/opt/project5/docs/sop_sdlc/`** agar tidak bercampur dengan dokumen arsip lama di `/opt/project5/docs/`.

---

## 🎯 Urutan Baku 7-Tahap SDLC & Gerbang Wajib QA/UAT (Wajib Dipatuhi Tanpa Terlewat)

Setiap temuan bug, diskusi perubahan kebijakan, atau fitur baru **WAJIB** mengikuti urutan berjenjang 7 tahap berikut:

```text
[1. Bug Ticket / RFC]  docs/sop_sdlc/bug/active/YYYY-MM-DD-<slug>.md (atau docs/sop_sdlc/rfc/)
        ↓
[2. Discussion]        docs/sop_sdlc/discussions/active/YYYY-MM-DD-<slug>.md ──(Disepakati)──► discussions/resolved/
        ↓
[3. ADR & Rules]       docs/sop_sdlc/adr/NNNN-<slug>.md + adr/README.md + .agents/rules/*.md (jika arsitektur/keamanan/PBAC)
        ↓
[4. Action Plan]       docs/sop_sdlc/plans/active/YYYY-MM-DD-<slug>.md [Status: LOCKED - IN PROGRESS]
        ↓
[5. Code, QG & Deploy] Eksekusi Kode + Unit Test + Lint/Typecheck/i18n/Colors/Security + Commit & Push + CI/CD Deploy Live
        ↓
[6. 🛑 QA & UAT GATE]  docs/sop_sdlc/qa/active/YYYY-MM-DD-<slug>.md [Status Plan: IN QA & USER UAT VERIFICATION]
                       ⚠️ WAJIB BERHENTI DI SINI! Uji kode, DB live & skenario UI/UX bersama Pengguna hingga 100% PASSED!
                       (DILARANG membuat reports/ atau memindahkan plan ke completed/ sebelum lulus UAT pengguna!)
        ↓
[7. Report & Close]    1. Pindahkan QA ke docs/sop_sdlc/qa/completed/YYYY-MM-DD-<slug>.md
                       2. Buat Laporan Akhir di docs/sop_sdlc/reports/YYYY-MM-DD-<slug>.md
                       3. Pindahkan Plan ke docs/sop_sdlc/plans/completed/ & Bug ke docs/sop_sdlc/bug/resolved/
```

- **Referensi Lengkap**: [Standar Siklus Hidup Dokumen, Tiket Bug, QA Gate & Implementation Plan](./references/lifecycle-and-documentation.md) & [SOP Kolaborasi Multi-Agent](../../../docs/sop_sdlc/plans/SOP-KOLABORASI-MULTI-AGENT.md)

---

## 📋 Alur Eksekusi Langkah-demi-Langkah

### Langkah 1: Inisialisasi Direktori Lifecycle di `/opt/project5/docs/sop_sdlc/`
Pastikan seluruh direktori lifecycle telah siap di host server:
```bash
mkdir -p /opt/project5/docs/sop_sdlc/bug/pending \
         /opt/project5/docs/sop_sdlc/bug/active \
         /opt/project5/docs/sop_sdlc/bug/resolved \
         /opt/project5/docs/sop_sdlc/discussions/active \
         /opt/project5/docs/sop_sdlc/discussions/resolved \
         /opt/project5/docs/sop_sdlc/adr \
         /opt/project5/docs/sop_sdlc/plans/active \
         /opt/project5/docs/sop_sdlc/plans/completed \
         /opt/project5/docs/sop_sdlc/qa/active \
         /opt/project5/docs/sop_sdlc/qa/completed \
         /opt/project5/docs/sop_sdlc/reports
```

---

### Langkah 2: Pembuatan Tiket Temuan Bug (`docs/sop_sdlc/bug/active/`) & Dokumen Diskusi (`docs/sop_sdlc/discussions/active/`)
1. **Tiket Bug (`docs/sop_sdlc/bug/active/YYYY-MM-DD-<slug-deskriptif>.md`)**: Catat gejala, bukti/log replikasi, dan Root Cause Analysis (RCA).
2. **Dokumen Diskusi (`docs/sop_sdlc/discussions/active/YYYY-MM-DD-<slug-deskriptif>.md`)**: Buat dokumen diskusi terlebih dahulu sebelum mengeksekusi kode. Setelah disepakati pengguna, pindahkan diskusi ke `docs/sop_sdlc/discussions/resolved/`.
3. **Architecture Decision Record (`docs/sop_sdlc/adr/NNNN-<slug>.md`)**: Jika keputusan menyentuh arsitektur, keamanan, isolasi multi-tenant, PBAC/RBAC, atau batas domain, buat ADR baru berurutan, daftarkan di `docs/sop_sdlc/adr/README.md`, perbarui `.agents/rules/` terkait, dan jalankan `bash scripts/audit-adr.sh`.

---

### Langkah 3: Formulasi Implementation Plan Baru (`docs/sop_sdlc/plans/active/`)
Buat berkas rencana kerja aktif di folder:
`/opt/project5/docs/sop_sdlc/plans/active/YYYY-MM-DD-<slug-deskriptif>.md`

---

### Langkah 4: Eksekusi Kode, Verifikasi Quality Gate Domain-Aware, Commit, Push & Deploy CI/CD
1. Kerjakan perubahan kode sumber secara bertahap dan centang `- [x]` pada Implementation Plan.
2. Jalankan perintah Quality Gate sesuai domain di [`docs/sop_sdlc/qa/quality-gate-checklist.md`](file:///opt/project5/docs/sop_sdlc/qa/quality-gate-checklist.md) hingga `0 Error, 0 Warning`.
3. Lakukan `git commit` dan `git push origin main`, pantau GitHub Actions (`bash scripts/check-cicd-status.sh --watch`), dan pastikan container ter-update serta `healthy`.

---

### 🛑 Langkah 5: GERBANG WAJIB QA & USER ACCEPTANCE TEST (`docs/sop_sdlc/qa/active/`)

> 🛑 **ATURAN MUTLAK (HARD HOLD GATE)**: AI Agent **DILARANG KERAS** langsung membuat dokumen `reports/` atau memindahkan plan ke `completed/` sesaat setelah CI/CD sukses!

1. Buat dokumen lembar pengujian di **`/opt/project5/docs/sop_sdlc/qa/active/YYYY-MM-DD-<slug>.md`** mengacu pada [`docs/sop_sdlc/qa/TEMPLATE.md`](file:///opt/project5/docs/sop_sdlc/qa/TEMPLATE.md) yang berisi:
   - **Bagian 1**: Bukti hasil Automated Quality Gate & Unit Test (`mvn test`, `go test`, `verify-all.sh frontend`, `audit:security`, `audit:sdlc`).
   - **Bagian 2**: Bukti verifikasi teknis lingkungan live oleh Agent (status container, query DB PostgreSQL live, probe endpoint).
   - **Bagian 3**: Matriks Skenario Uji Fungsional & UI/UX (`TC-01`, `TC-02`, dst.) berstatus `⏳ WAITING_UAT` untuk diuji oleh Pengguna.
2. Ubah header status pada berkas plan di `docs/sop_sdlc/plans/active/YYYY-MM-DD-<slug>.md` menjadi:
   `- **Status**: [IN QA & USER UAT VERIFICATION]`
3. Sajikan panduan skenario uji `TC-01..TC-N` kepada pengguna dan **tunggu hasil pengujian langsung oleh pengguna**:
   - **Jika ditemukan kegagalan / koreksi saat uji QA/UAT**: Catat kegagalan di Bagian 4 pada berkas `docs/sop_sdlc/qa/active/YYYY-MM-DD-<slug>.md`, lakukan remediasi kode, deploy ulang, dan uji kembali hingga seluruh `TC` berstatus `✅ PASSED`.

---

### Langkah 6: Penutupan QA, Penyusunan Laporan Akhir (`docs/sop_sdlc/reports/`) & Pengarsipan
**HANYA SETELAH** pengguna mengonfirmasi bahwa pengujian QA / UAT telah lulus (`100% PASSED`):
1. Perbarui status dokumen QA menjadi `[PASSED ✅]` dan pindahkan ke folder `completed`:
   ```bash
   mv /opt/project5/docs/sop_sdlc/qa/active/YYYY-MM-DD-<slug>.md /opt/project5/docs/sop_sdlc/qa/completed/
   ```
2. Buat laporan akhir resmi komprehensif di:
   `/opt/project5/docs/sop_sdlc/reports/YYYY-MM-DD-<slug>.md` (lengkap dengan tautan ke `docs/sop_sdlc/qa/completed/YYYY-MM-DD-<slug>.md`).
3. Pindahkan berkas rencana kerja ke folder `completed`:
   ```bash
   mv /opt/project5/docs/sop_sdlc/plans/active/YYYY-MM-DD-<slug>.md /opt/project5/docs/sop_sdlc/plans/completed/
   ```
4. Pindahkan berkas tiket bug ke folder `resolved`:
   ```bash
   mv /opt/project5/docs/sop_sdlc/bug/active/YYYY-MM-DD-<slug>.md /opt/project5/docs/sop_sdlc/bug/resolved/
   ```
5. Jalankan `bash scripts/audit-sdlc-docs.sh` (`pnpm audit:sdlc`) untuk memastikan `0 Error, 0 Warning`.
