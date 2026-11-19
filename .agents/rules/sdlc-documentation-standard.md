# 📚 Standar Urutan Dokumentasi 13-Folder SDLC (`docs/sop_sdlc/`), Mandatory QA & User UAT Gate, dan Governance AI Agent

> **TINGKAT KEPATUHAN**: **MANDATORY / ALWAYS-ON (P0 BLOCKER)**  
> **Lingkup**: Seluruh AI Agent (Antigravity, Cursor, Claude Code, Windsurf, CLI) yang bekerja di monorepo `/opt/project5`.  
> **Lokasi Ruang Kerja SDLC Murni**: [`/opt/project5/docs/sop_sdlc/`](file:///opt/project5/docs/sop_sdlc) (terpisah penuh dari arsip lama di `/opt/project5/docs/`).  
> **Verifikasi Otomatis**: `pnpm audit:sdlc` (`bash scripts/audit-sdlc-docs.sh`) & `bash scripts/preflight-check.sh`.

---

## 🎯 1. Prinsip Dasar: Dokumentasi Hulu-ke-Hilir 7-Tahap & Gerbang Wajib QA / User UAT

AI Agent **DILARANG KERAS**:
1. Langsung menulis atau mengubah kode produksi tanpa memastikan dokumen siklus hidup (*SDLC Lifecycle*) pada 13 folder standar di `docs/sop_sdlc/` berada dalam urutan yang benar dan saling tertaut (*cross-linked*).
2. **MELOMPATI TAHAP QA (`docs/sop_sdlc/qa/active/`)**: Setelah `git commit`, `git push`, dan deployment CI/CD selesai, AI Agent **DILARANG KERAS langsung membuat laporan di `docs/sop_sdlc/reports/` atau memindahkan plan ke `docs/sop_sdlc/plans/completed/`!** AI Agent **WAJIB berhenti di Gerbang QA (`docs/sop_sdlc/qa/active/YYYY-MM-DD-<slug>.md`)** untuk menguji hasil pekerjaan (kode, database live, dan skenario UI/UX) serta menunggu **Verifikasi & Validasi Langsung oleh Pengguna (User Acceptance Testing / UAT)** hingga 100% lulus uji.

Seluruh ekosistem dokumentasi SDLC K2NET FTTH GIS terpusat di dalam **`/opt/project5/docs/sop_sdlc/`** (12 Folder di dalam `docs/sop_sdlc/` + 1 Folder `.agents/` = **13 Folder Baku**) yang dikelompokkan menurut **3 Fase Aliran Kerja (Hulu → Tengah → Hilir)**:

| Fase | Urutan | Folder | Sifat Dokumen | Fungsi Utama & Kapan Dibuat/Diperbarui |
|---|---|---|---|---|
| **I. HULU**<br/>*(Inisiasi, Triase & Keputusan)* | **1A** | [`docs/sop_sdlc/bug/`](file:///opt/project5/docs/sop_sdlc/bug) | *Operasional Triase* (`pending/`, `active/`, `resolved/`) | Dibuat **pertama kali** saat ditemukan bug, regresi, gap PBAC, atau celah keamanan. Berisi gejala, bukti replikasi, dan RCA. |
| **I. HULU** | **1B** | [`docs/sop_sdlc/rfc/`](file:///opt/project5/docs/sop_sdlc/rfc) | *Proposal Desain* (`NNNN-<slug>.md`) | Dibuat **pertama kali** saat merancang fitur baru berskala besar, modul baru, atau integrasi eksternal baru. |
| **I. HULU** | **2** | [`docs/sop_sdlc/discussions/`](file:///opt/project5/docs/sop_sdlc/discussions) | *Musyawarah Lintas-Agent* (`active/` → `resolved/`) | Dibuat **sebelum menyentuh kode** untuk mendiskusikan hasil audit, opsi arsitektur, trade-off, dan rekomendasi bersama pengguna & agent lain. Dipindahkan ke `resolved/` setelah disepakati. |
| **I. HULU** | **3** | [`docs/sop_sdlc/adr/`](file:///opt/project5/docs/sop_sdlc/adr) | *Keputusan Arsitektur Immutable* (`NNNN-<slug>.md` + `README.md`) | **WAJIB dibuat** jika keputusan menyentuh arsitektur, PBAC/RBAC, multi-tenant isolation, skema DB utama, atau batas layanan. Diverifikasi via `pnpm audit:adr`. |
| **II. TENGAH**<br/>*(Spesifikasi, Rencana & Guardrails)* | **4A** | [`docs/sop_sdlc/specs/`](file:///opt/project5/docs/sop_sdlc/specs) | *Kontrak & Registri* (`registry-alokasi-sumber-daya.md`, OpenAPI, MIB) | Tempat memesan nomor migrasi Flyway (`V<N>`), port microservice, penguncian plan (`LOCK`), serta kontrak payload antar-service. |
| **II. TENGAH** | **4B** | [`docs/sop_sdlc/security/`](file:///opt/project5/docs/sop_sdlc/security) | *Katalog Kebijakan Keamanan* | Diperbarui apabila ada perubahan matriks otorisasi, MFA, sesi, sandi, atau kebijakan Scope Air-Gap. |
| **II. TENGAH** | **4C** | [`docs/sop_sdlc/ui-ux/`](file:///opt/project5/docs/sop_sdlc/ui-ux) | *Standar Desain & Heuristik Visual* | Acuan anatomi kontrol (`size="sm"` / `size="xs"`), token monokrom semantik, dan pola 5-state komponen; diperbarui jika ada pola UI/UX baru. |
| **II. TENGAH** | **5** | [`docs/sop_sdlc/plans/`](file:///opt/project5/docs/sop_sdlc/plans) | *Rencana Eksekusi* (`active/` → `completed/`) | Checklist teknis bertahap berdasarkan hasil diskusi & ADR. Berstatus `[LOCKED - IN PROGRESS]` saat coding dan `[IN QA & USER UAT VERIFICATION]` saat diuji di `qa/active/`. **DILARANG** dipindah ke `completed/` sebelum `qa/active/` lulus UAT pengguna! |
| **II. TENGAH** | **6** | [`.agents/`](file:///opt/project5/.agents) | *Memori & Guardrails AI* (`rules/`, `skills/`, `AGENTS.md`) | Diperbarui setiap kali ada standar arsitektur/SOP baru agar seluruh AI Agent pada sesi berikutnya langsung mematuhi aturan tersebut secara otomatis. |
| **III. HILIR**<br/>*(QA/UAT, Bukti & Operasional)* | **7** | [`docs/sop_sdlc/qa/`](file:///opt/project5/docs/sop_sdlc/qa) | **🛑 Gerbang Wajib Uji QA & UAT** (`active/` → `completed/`, `quality-gate-checklist.md`) | **WAJIB dibuat di `qa/active/YYYY-MM-DD-<slug>.md` setelah kode selesai & di-deploy.** Berisi bukti Unit Test/QG otomatis + Matriks Skenario Uji Live & UI/UX bagi pengguna (`TC-01..TC-N`). Dipindahkan ke `qa/completed/` **HANYA SETELAH** pengguna menyatakan lulus uji. |
| **III. HILIR** | **8** | [`docs/sop_sdlc/reports/`](file:///opt/project5/docs/sop_sdlc/reports) | *Bukti Penyelesaian Permanen* (`YYYY-MM-DD-<slug>.md`) | **HANYA dibuat SETELAH dokumen `qa/active/` lulus UAT pengguna dan dipindahkan ke `qa/completed/`.** Berisi ringkasan perubahan, bukti QG & UAT, serta tautan silang ke Bug/Diskusi/ADR/Plan/QA. |
| **III. HILIR** | **9A** | [`docs/sop_sdlc/releases/`](file:///opt/project5/docs/sop_sdlc/releases) | *Catatan Rilis SemVer* (`vX.Y.Z.md`, `CHANGELOG.md`) | Diperbarui saat menerbitkan versi rilis produksi atau perubahan prosedur deployment Staged Booting. |
| **III. HILIR** | **9B** | [`docs/sop_sdlc/runbooks/`](file:///opt/project5/docs/sop_sdlc/runbooks) | *SOP Tanggap Darurat SRE/NOC* (`RB-NN-<slug>.md`) | Dibuat atau diperbarui jika ada prosedur operasional pemulihan insiden server, database, gateway, atau jaringan. |

---

## 🧭 2. Matriks Keputusan 4-Skenario (Urutan 7-Tahap Pembuatan Dokumen Wajib)

Setiap kali menerima instruksi dari pengguna atau menemukan masalah di kode/database, AI Agent **WAJIB mengklasifikasikan pekerjaan ke dalam salah satu dari 4 skenario berikut** dan mengeksekusi pembuatan dokumen sesuai nomor urutnya tanpa melompati **Tahap 6 (Gerbang QA & User UAT)**:

### 🔴 Skenario A: Temuan Bug, Regresi, atau Celah Keamanan (Bug / Security Fix)
1. **Buat Tiket Bug**: [`docs/sop_sdlc/bug/active/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/sop_sdlc/bug/active) (catat gejala, bukti log/screenshot, dan RCA).
2. **Buat Dokumen Diskusi**: [`docs/sop_sdlc/discussions/active/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/sop_sdlc/discussions/active) (paparkan hasil audit, opsi perbaikan, dan rekomendasi). Setelah disetujui pengguna, pindahkan ke `docs/sop_sdlc/discussions/resolved/`.
3. **Buat ADR (Kondisional Wajib)**: [`docs/sop_sdlc/adr/NNNN-<slug>.md`](file:///opt/project5/docs/sop_sdlc/adr) + daftar di [`docs/sop_sdlc/adr/README.md`](file:///opt/project5/docs/sop_sdlc/adr/README.md) apabila perbaikan mengubah arsitektur, PBAC/RBAC, multi-tenant isolation, atau skema database.
4. **Buat Rencana Aksi Aktif**: [`docs/sop_sdlc/plans/active/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/sop_sdlc/plans/active) + kunci sumber daya di [`docs/sop_sdlc/specs/registry-alokasi-sumber-daya.md`](file:///opt/project5/docs/sop_sdlc/specs/registry-alokasi-sumber-daya.md) + perbarui aturan di [`.agents/rules/`](file:///opt/project5/.agents/rules) bila relevan.
5. **Eksekusi Kode, Quality Gate Lokal, Commit, Push & Deploy CI/CD**: Jalankan seluruh perintah wajib di [`docs/sop_sdlc/qa/quality-gate-checklist.md`](file:///opt/project5/docs/sop_sdlc/qa/quality-gate-checklist.md) hingga `0 error, 0 warning`, commit & push ke GitHub, dan pantau CI/CD hingga container live ter-update.
6. **🛑 GERBANG WAJIB QA & USER UAT (`docs/sop_sdlc/qa/active/YYYY-MM-DD-<slug>.md`)**:
   - Buat lembar pengujian di `docs/sop_sdlc/qa/active/YYYY-MM-DD-<slug>.md` yang berisi hasil Unit Test/QG otomatis, hasil verifikasi teknis live oleh Agent, dan daftar skenario uji UI/UX (`TC-01..TC-N`) untuk diuji bersama pengguna.
   - Ubah status Plan menjadi `[IN QA & USER UAT VERIFICATION]` (**JANGAN** pindahkan plan ke `completed/` dan **JANGAN** buat file `reports/` dulu!).
   - Jika saat diuji ditemukan masalah/gagal, catat hasil gagal di `qa/active/`, perbaiki kode, deploy ulang, dan uji kembali hingga **100% LULUS UAT PENGGUNA**.
7. **Terbitkan Laporan Akhir & Arsipkan (Pasca-Konfirmasi Lulus UAT Pengguna)**:
   - Setelah pengguna menyatakan pengujian berhasil/lulus:
     1. Pindahkan lembar QA dari `docs/sop_sdlc/qa/active/` ke `docs/sop_sdlc/qa/completed/`.
     2. Buat Laporan Akhir di [`docs/sop_sdlc/reports/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/sop_sdlc/reports) (tertaut ke `qa/completed/`).
     3. Pindahkan Plan ke `docs/sop_sdlc/plans/completed/` dan Bug ke `docs/sop_sdlc/bug/resolved/`.

### 🟦 Skenario B: Fitur Baru, Modul Baru, atau Paket Marketplace Baru
1. **Buat Proposal RFC**: [`docs/sop_sdlc/rfc/NNNN-<slug>.md`](file:///opt/project5/docs/sop_sdlc/rfc).
2. **Buat Dokumen Diskusi**: [`docs/sop_sdlc/discussions/active/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/sop_sdlc/discussions/active) (pindahkan ke `resolved/` setelah konsensus).
3. **Buat ADR**: [`docs/sop_sdlc/adr/NNNN-<slug>.md`](file:///opt/project5/docs/sop_sdlc/adr) + [`docs/sop_sdlc/adr/README.md`](file:///opt/project5/docs/sop_sdlc/adr/README.md).
4. **Perbarui Spesifikasi & Standar**: [`docs/sop_sdlc/specs/`](file:///opt/project5/docs/sop_sdlc/specs), [`docs/sop_sdlc/ui-ux/`](file:///opt/project5/docs/sop_sdlc/ui-ux), dan [`docs/sop_sdlc/security/`](file:///opt/project5/docs/sop_sdlc/security).
5. **Buat Rencana Aksi, Guardrails, Eksekusi Kode & Deploy**: [`docs/sop_sdlc/plans/active/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/sop_sdlc/plans/active) + perbarui [`.agents/`](file:///opt/project5/.agents) + jalankan [`docs/sop_sdlc/qa/quality-gate-checklist.md`](file:///opt/project5/docs/sop_sdlc/qa/quality-gate-checklist.md) + deploy live.
6. **🛑 GERBANG WAJIB QA & USER UAT**: Buat [`docs/sop_sdlc/qa/active/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/sop_sdlc/qa/active), lakukan pengujian kode & UI/UX bersama pengguna hingga 100% lulus.
7. **Terbitkan Laporan Akhir & Arsipkan**: Pindahkan QA ke `qa/completed/`, buat [`docs/sop_sdlc/reports/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/sop_sdlc/reports), dan arsipkan Plan ke `plans/completed/`.

### 🟨 Skenario C: Perubahan Kebijakan, Refactoring Arsitektur, atau Standarisasi PBAC/UI
1. **Buat Dokumen Diskusi**: [`docs/sop_sdlc/discussions/active/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/sop_sdlc/discussions/active) (pindahkan ke `resolved/` setelah disetujui).
2. **Buat ADR Baru**: [`docs/sop_sdlc/adr/NNNN-<slug>.md`](file:///opt/project5/docs/sop_sdlc/adr) + [`docs/sop_sdlc/adr/README.md`](file:///opt/project5/docs/sop_sdlc/adr/README.md) (**Wajib 100%**).
3. **Perbarui Katalog Normatif & Aturan AI**: Perbarui [`docs/sop_sdlc/security/`](file:///opt/project5/docs/sop_sdlc/security), [`docs/sop_sdlc/ui-ux/`](file:///opt/project5/docs/sop_sdlc/ui-ux), atau [`docs/sop_sdlc/specs/`](file:///opt/project5/docs/sop_sdlc/specs), serta [`.agents/rules/`](file:///opt/project5/.agents/rules), [`.agents/skills/`](file:///opt/project5/.agents/skills), dan [`AGENTS.md`](file:///opt/project5/AGENTS.md).
4. **Buat Rencana Aksi Aktif, Eksekusi Kode & Deploy**: [`docs/sop_sdlc/plans/active/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/sop_sdlc/plans/active).
5. **🛑 GERBANG WAJIB QA & USER UAT**: Buat [`docs/sop_sdlc/qa/active/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/sop_sdlc/qa/active) dan tunggu konfirmasi kelulusan uji dari pengguna.
6. **Terbitkan Laporan Akhir & Arsipkan**: Pindahkan QA ke `qa/completed/`, terbitkan [`docs/sop_sdlc/reports/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/sop_sdlc/reports), dan arsipkan Plan/Bug.

### 🟩 Skenario D: Rilis Produksi (SemVer) atau Mitigasi Insiden Operasional (SRE/NOC)
1. **Jalankan Full Release Quality Gate & Lembar QA**: Eksekusi verifikasi menyeluruh sesuai [`docs/sop_sdlc/qa/quality-gate-checklist.md`](file:///opt/project5/docs/sop_sdlc/qa/quality-gate-checklist.md) dan catat di `docs/sop_sdlc/qa/active/`.
2. **Catat Dokumen Rilis**: Buat [`docs/sop_sdlc/releases/vX.Y.Z.md`](file:///opt/project5/docs/sop_sdlc/releases) dan perbarui [`docs/sop_sdlc/releases/CHANGELOG.md`](file:///opt/project5/docs/sop_sdlc/releases/CHANGELOG.md).
3. **Catat Runbook Operasional**: Buat atau perbarui [`docs/sop_sdlc/runbooks/RB-NN-<slug>.md`](file:///opt/project5/docs/sop_sdlc/runbooks) apabila terdapat SOP pemulihan/mitigasi baru.
4. **Terbitkan Laporan Akhir**: Setelah QA dipindah ke `qa/completed/`, buat [`docs/sop_sdlc/reports/YYYY-MM-DD-<slug>.md`](file:///opt/project5/docs/sop_sdlc/reports).

---

## 🔗 3. Standar Cross-Linking & Traceability Wajib

Setiap dokumen di `docs/sop_sdlc/plans/active/*.md`, `docs/sop_sdlc/qa/active/*.md`, dan `docs/sop_sdlc/reports/*.md` **WAJIB** memuat blok metadata referensi silang di bagian header dokumen agar dapat divalidasi oleh `pnpm audit:sdlc`:

- **Tautan Hulu**: Merujuk ke berkas `docs/sop_sdlc/bug/...` atau `docs/sop_sdlc/rfc/...` serta `docs/sop_sdlc/discussions/...` (dan `docs/sop_sdlc/adr/NNNN-...` bila menyentuh arsitektur/kebijakan).
- **Tautan Tengah**: Merujuk ke berkas `docs/sop_sdlc/plans/...` dan aturan `.agents/rules/...` yang diperbarui.
- **Tautan QA / UAT**: Merujuk ke [`docs/sop_sdlc/qa/quality-gate-checklist.md`](file:///opt/project5/docs/sop_sdlc/qa/quality-gate-checklist.md) dan lembar pengujian spesifik di `docs/sop_sdlc/qa/{active,completed}/YYYY-MM-DD-<slug>.md`.
- **Tautan Hilir**: Merujuk ke laporan penyelesaian di `docs/sop_sdlc/reports/YYYY-MM-DD-<slug>.md`.

---

## 🛡️ 4. Aturan Keamanan Git & Otomatisasi Pre-Flight

1. **Verifikasi Otomatis**:
   - Di awal sesi: `bash scripts/preflight-check.sh` (secara otomatis memanggil ringkasan `scripts/audit-sdlc-docs.sh`).
   - Sebelum menyatakan tugas selesai: `pnpm audit:sdlc` dan `pnpm audit:adr`.
2. **Isolasi Git Publik vs Lokal Server**:
   - Folder [`docs/`](file:///opt/project5/docs) (termasuk [`docs/sop_sdlc/`](file:///opt/project5/docs/sop_sdlc)) dan [`scripts/`](file:///opt/project5/scripts) bersifat **privat di server lokal** (git-ignored) dan **DILARANG KERAS** di-commit ke repositori GitHub publik (`ex-cloud/K2NET-FTTHGIS`).
   - Folder [`.agents/`](file:///opt/project5/.agents) **WAJIB di-commit** ke Git agar seluruh AI Agent di berbagai perangkat memiliki aturan guardrails yang sinkron.
