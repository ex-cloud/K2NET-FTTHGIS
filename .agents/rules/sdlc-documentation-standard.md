---
trigger: always_on
description: Standar Hukum Urutan Dokumentasi 13-Folder SDLC (Hulu -> Tengah -> Hilir), Matriks Skenario Kerja, Cross-Linking Traceability, dan Audit Otomatis (audit:sdlc)
---

# 📚 Standar Urutan Dokumentasi 13-Folder SDLC & Governance AI Agent

> **TINGKAT KEPATUHAN**: **MANDATORY / ALWAYS-ON (P0 BLOCKER)**  
> **Lingkup**: Seluruh AI Agent (Antigravity, Cursor, Claude Code, Windsurf, CLI) yang bekerja di monorepo `/opt/project5`.  
> **Verifikasi Otomatis**: `pnpm audit:sdlc` (`bash scripts/audit-sdlc-docs.sh`) & `bash scripts/preflight-check.sh`.

---

## 🎯 1. Prinsip Dasar: Dokumentasi Hulu-ke-Hilir Tanpa Terlewat

AI Agent **DILARANG KERAS** langsung menulis atau mengubah kode produksi tanpa terlebih dahulu memastikan dokumen siklus hidup (*SDLC Lifecycle*) pada 13 folder standar berada dalam urutan yang benar dan saling tertaut (*cross-linked*).

Seluruh ekosistem dokumentasi K2NET FTTH GIS terbagi ke dalam **13 Folder Baku** yang dikelompokkan menurut **3 Fase Aliran Kerja (Hulu → Tengah → Hilir)**:

| Fase | Urutan | Folder | Sifat Dokumen | Fungsi Utama & Kapan Dibuat/Diperbarui |
|---|---|---|---|---|
| **I. HULU**<br/>*(Inisiasi, Triase & Keputusan)* | **1A** | [`docs/bug/`](file:///opt/project5/docs/bug) | *Operasional Triase* (`pending/`, `active/`, `resolved/`) | Dibuat **pertama kali** saat ditemukan bug, regresi, gap PBAC, atau celah keamanan. Berisi gejala, bukti replikasi, dan RCA. |
| **I. HULU** | **1B** | [`docs/rfc/`](file:///opt/project5/docs/rfc) | *Proposal Desain* (`NNNN-<slug>.md`) | Dibuat **pertama kali** saat merancang fitur baru berskala besar, modul baru, atau integrasi eksternal baru. |
| **I. HULU** | **2** | [`docs/discussions/`](file:///opt/project5/docs/discussions) | *Musyawarah Lintas-Agent* (`active/` → `resolved/`) | Dibuat **sebelum menyentuh kode** untuk mendiskusikan hasil audit, opsi arsitektur, trade-off, dan rekomendasi bersama pengguna & agent lain. Dipindahkan ke `resolved/` setelah disepakati. |
| **I. HULU** | **3** | [`docs/adr/`](file:///opt/project5/docs/adr) | *Keputusan Arsitektur Immutable* (`NNNN-<slug>.md` + `README.md`) | **WAJIB dibuat** jika keputusan menyentuh arsitektur, PBAC/RBAC, multi-tenant isolation, skema DB utama, atau batas layanan. Diverifikasi via `pnpm audit:adr`. |
| **II. TENGAH**<br/>*(Spesifikasi, Rencana & Guardrails)* | **4A** | [`docs/specs/`](file:///opt/project5/docs/specs) | *Kontrak & Registri* (`registry-alokasi-sumber-daya.md`, OpenAPI, MIB) | Tempat memesan nomor migrasi Flyway (`V<N>`), port microservice, penguncian plan (`LOCK`), serta kontrak payload antar-service. |
| **II. TENGAH** | **4B** | [`docs/security/`](file:///opt/project5/docs/security) | *Katalog Kebijakan Keamanan* | Diperbarui apabila ada perubahan matriks otorisasi, MFA, sesi, sandi, atau kebijakan Scope Air-Gap. |
| **II. TENGAH** | **4C** | [`docs/ui-ux/`](file:///opt/project5/docs/ui-ux) | *Standar Desain & Heuristik Visual* | Acuan anatomi kontrol (`size="sm"` / `size="xs"`), token monokrom semantik, dan pola 5-state komponen; diperbarui jika ada pola UI/UX baru. |
| **II. TENGAH** | **5** | [`docs/plans/`](file:///opt/project5/docs/plans) | *Rencana Eksekusi* (`active/` → `completed/`) | Checklist teknis bertahap berdasarkan hasil diskusi & ADR. Berstatus `[LOCKED - IN PROGRESS]` selama dikerjakan dan wajib memuat tabel hasil Quality Gate. |
| **II. TENGAH** | **6** | [`.agents/`](file:///opt/project5/.agents) | *Memori & Guardrails AI* (`rules/`, `skills/`, `AGENTS.md`) | Diperbarui setiap kali ada standar arsitektur/SOP baru agar seluruh AI Agent pada sesi berikutnya langsung mematuhi aturan tersebut secara otomatis. |
| **III. HILIR**<br/>*(Verifikasi, Bukti & Operasional)* | **7** | [`docs/qa/`](file:///opt/project5/docs/qa) | *Standar Quality Gate & Benchmark* (`quality-gate-checklist.md`) | Peta Domain → Perintah verifikasi wajib (`0 error, 0 warning`) yang harus dieksekusi sebelum komit dan sebelum menutup plan. |
| **III. HILIR** | **8** | [`docs/reports/`](file:///opt/project5/docs/reports) | *Bukti Penyelesaian Permanen* (`YYYY-MM-DD-<slug>.md`) | Laporan akhir resmi berisi ringkasan perubahan, bukti kelulusan seluruh Quality Gate, dan tautan silang ke Bug/Diskusi/ADR/Plan. |
| **III. HILIR** | **9A** | [`docs/releases/`](file:///opt/project5/docs/releases) | *Catatan Rilis SemVer* (`vX.Y.Z.md`, `CHANGELOG.md`) | Diperbarui saat menerbitkan versi rilis produksi atau perubahan prosedur deployment Staged Booting. |
| **III. HILIR** | **9B** | [`docs/runbooks/`](file:///opt/project5/docs/runbooks) | *SOP Tanggap Darurat SRE/NOC* (`RB-NN-<slug>.md`) | Dibuat atau diperbarui jika ada prosedur operasional pemulihan insiden server, database, gateway, atau jaringan. |

---

## 🧭 2. Matriks Keputusan 4-Skenario (Urutan Pembuatan Dokumen Wajib)

Setiap kali menerima instruksi dari pengguna atau menemukan masalah di kode/database, AI Agent **WAJIB mengklasifikasikan pekerjaan ke dalam salah satu dari 4 skenario berikut** dan mengeksekusi pembuatan dokumen sesuai nomor urutnya:

### 🔴 Skenario A: Temuan Bug, Regresi, atau Celah Keamanan (Bug / Security Fix)
1. **Buat Tiket Bug**: [`docs/bug/active/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/bug/active) (catat gejala, bukti log/screenshot, dan RCA).
2. **Buat Dokumen Diskusi**: [`docs/discussions/active/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/discussions/active) (paparkan hasil audit, opsi perbaikan, dan rekomendasi). Setelah disetujui pengguna, pindahkan ke `docs/discussions/resolved/`.
3. **Buat ADR (Kondisional Wajib)**: [`docs/adr/NNNN-<slug>.md`](file:///opt/project5/docs/adr) + daftar di [`docs/adr/README.md`](file:///opt/project5/docs/adr/README.md) apabila perbaikan mengubah arsitektur, PBAC/RBAC, multi-tenant isolation, atau skema database.
4. **Buat Rencana Aksi Aktif**: [`docs/plans/active/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/plans/active) + kunci sumber daya di [`docs/specs/registry-alokasi-sumber-daya.md`](file:///opt/project5/docs/specs/registry-alokasi-sumber-daya.md) + perbarui aturan di [`.agents/rules/`](file:///opt/project5/.agents/rules) bila relevan.
5. **Eksekusi Kode & Quality Gate Domain**: Jalankan seluruh perintah wajib di [`docs/qa/quality-gate-checklist.md`](file:///opt/project5/docs/qa/quality-gate-checklist.md) hingga `0 error, 0 warning` dan rekam hasilnya di berkas Plan.
6. **Terbitkan Laporan Akhir & Arsipkan**: Buat [`docs/reports/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/reports); setelah verifikasi live lulus, pindahkan Plan ke `docs/plans/completed/` dan Bug ke `docs/bug/resolved/`.

### 🟦 Skenario B: Fitur Baru, Modul Baru, atau Paket Marketplace Baru
1. **Buat Proposal RFC**: [`docs/rfc/NNNN-<slug>.md`](file:///opt/project5/docs/rfc).
2. **Buat Dokumen Diskusi**: [`docs/discussions/active/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/discussions/active) (pindahkan ke `resolved/` setelah konsensus).
3. **Buat ADR**: [`docs/adr/NNNN-<slug>.md`](file:///opt/project5/docs/adr) + [`docs/adr/README.md`](file:///opt/project5/docs/adr/README.md).
4. **Perbarui Spesifikasi & Standar**: [`docs/specs/`](file:///opt/project5/docs/specs) (kontrak API & reservasi Flyway), [`docs/ui-ux/`](file:///opt/project5/docs/ui-ux) (pola komponen), dan [`docs/security/`](file:///opt/project5/docs/security) (permission PBAC baru).
5. **Buat Rencana Aksi & Guardrails**: [`docs/plans/active/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/plans/active) + perbarui [`.agents/`](file:///opt/project5/.agents).
6. **Eksekusi Kode, Quality Gate & Laporan**: Jalankan [`docs/qa/quality-gate-checklist.md`](file:///opt/project5/docs/qa/quality-gate-checklist.md), terbitkan [`docs/reports/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/reports), dan arsipkan Plan ke `completed/` pasca-verifikasi live.

### 🟨 Skenario C: Perubahan Kebijakan, Refactoring Arsitektur, atau Standarisasi PBAC/UI
1. **Buat Dokumen Diskusi**: [`docs/discussions/active/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/discussions/active) (dan [`docs/bug/active/`](file:///opt/project5/docs/bug/active) jika dipicu oleh temuan ketidaksinkronan sistem). Pindahkan diskusi ke `resolved/` setelah disetujui.
2. **Buat ADR Baru**: [`docs/adr/NNNN-<slug>.md`](file:///opt/project5/docs/adr) + [`docs/adr/README.md`](file:///opt/project5/docs/adr/README.md) (**Wajib 100%**).
3. **Perbarui Katalog Normatif & Aturan AI**: Perbarui [`docs/security/`](file:///opt/project5/docs/security), [`docs/ui-ux/`](file:///opt/project5/docs/ui-ux), atau [`docs/specs/`](file:///opt/project5/docs/specs), serta perbarui [`.agents/rules/`](file:///opt/project5/.agents/rules), [`.agents/skills/`](file:///opt/project5/.agents/skills), dan [`AGENTS.md`](file:///opt/project5/AGENTS.md).
4. **Buat Rencana Aksi Aktif**: [`docs/plans/active/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/plans/active).
5. **Eksekusi Kode, Quality Gate & Laporan**: Jalankan [`docs/qa/quality-gate-checklist.md`](file:///opt/project5/docs/qa/quality-gate-checklist.md), terbitkan [`docs/reports/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/reports), dan arsipkan Plan/Bug pasca-verifikasi live.

### 🟩 Skenario D: Rilis Produksi (SemVer) atau Mitigasi Insiden Operasional (SRE/NOC)
1. **Jalankan Full Release Quality Gate**: Eksekusi verifikasi menyeluruh sesuai [`docs/qa/quality-gate-checklist.md`](file:///opt/project5/docs/qa/quality-gate-checklist.md).
2. **Catat Dokumen Rilis**: Buat [`docs/releases/vX.Y.Z.md`](file:///opt/project5/docs/releases) dan perbarui [`docs/releases/CHANGELOG.md`](file:///opt/project5/docs/releases/CHANGELOG.md).
3. **Catat Runbook Operasional**: Buat atau perbarui [`docs/runbooks/RB-NN-<slug>.md`](file:///opt/project5/docs/runbooks) apabila terdapat SOP pemulihan/mitigasi baru.
4. **Terbitkan Laporan Akhir**: Buat [`docs/reports/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/reports).

---

## 🔗 3. Standar Cross-Linking & Traceability Wajib

Setiap dokumen di `docs/plans/active/*.md` dan `docs/reports/*.md` **WAJIB** memuat blok metadata referensi silang di bagian header dokumen agar dapat divalidasi oleh `pnpm audit:sdlc`:

- **Tautan Hulu**: Merujuk ke berkas `docs/bug/...` atau `docs/rfc/...` serta `docs/discussions/...` (dan `docs/adr/NNNN-...` bila menyentuh arsitektur/kebijakan).
- **Tautan Tengah**: Merujuk ke berkas `docs/plans/...` dan aturan `.agents/rules/...` yang diperbarui.
- **Tautan Hilir**: Merujuk ke [`docs/qa/quality-gate-checklist.md`](file:///opt/project5/docs/qa/quality-gate-checklist.md) dan laporan penyelesaian di `docs/reports/...`.

---

## 🛡️ 4. Aturan Keamanan Git & Otomatisasi Pre-Flight

1. **Verifikasi Otomatis**:
   - Di awal sesi: `bash scripts/preflight-check.sh` (secara otomatis memanggil ringkasan `scripts/audit-sdlc-docs.sh`).
   - Sebelum menyatakan tugas selesai: `pnpm audit:sdlc` dan `pnpm audit:adr`.
2. **Isolasi Git Publik vs Lokal Server**:
   - Folder [`docs/`](file:///opt/project5/docs) dan [`scripts/`](file:///opt/project5/scripts) bersifat **privat di server lokal** (git-ignored) dan **DILARANG KERAS** di-commit ke repositori GitHub publik (`ex-cloud/K2NET-FTTHGIS`).
   - Folder [`.agents/`](file:///opt/project5/.agents) dan [`AGENTS.md`](file:///opt/project5/AGENTS.md) **WAJIB di-commit** ke Git agar seluruh AI Agent di berbagai perangkat memiliki aturan guardrails yang sinkron.
