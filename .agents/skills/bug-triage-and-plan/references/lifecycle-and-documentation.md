# 📑 Standar Siklus Hidup Dokumen, Tiket Bug & Implementation Plan

Dokumen ini adalah aturan baku (*Hard Constraint*) bagi seluruh AI Agent dan Developer dalam mencatat temuan bug, merumuskan rencana implementasi, dan mengarsipkan dokumen pekerjaan di repositori K2NET FTTH GIS.

---

## 🚫 Larangan Keras (Zero Chaos Policy)
1. **Dilarang Menulis di Sembarang Tempat**: Dilarang meletakkan file markdown dokumentasi/rencana baru di root `/opt/project5/`, root `/opt/project5/docs/`, atau di dalam folder source code (`apps/`, `services/`, `packages/`).
2. **Dilarang Mencampur Pengetahuan AI**: Folder `/opt/project5/knowledge-base/` murni dialokasikan untuk korpus RAG vektor AI Gateway dan **100% di-gitignore**. Seluruh dokumentasi aktivitas developer berada di `/opt/project5/docs/`.
3. **Dilarang Meninggalkan Plan Menggantung**: Setiap rencana kerja yang telah selesai dieksekusi dan lolos verifikasi WAJIB dipindahkan ke folder `docs/plans/completed/`.

---

## 🗂️ Struktur Direktori Baku `docs/`

```text
/opt/project5/docs/
├── bug/
│   ├── pending/                       # Tiket temuan bug/backlog yang belum aktif dikerjakan
│   │   └── YYYY-MM-DD-<slug-temuan>.md
│   ├── active/                        # Tiket bug yang sedang aktif dalam investigasi/remediasi
│   │   └── YYYY-MM-DD-<slug-temuan>.md
│   └── resolved/                      # Tiket bug yang telah tuntas, lolos Quality Gate, & terverifikasi
│       └── YYYY-MM-DD-<slug-temuan>.md
├── plans/
│   ├── active/                        # Action plan yang sedang aktif dikerjakan
│   │   └── YYYY-MM-DD-<slug-plan>.md
│   └── completed/                     # Action plan yang telah tuntas & lolos Quality Gate
│       └── YYYY-MM-DD-<slug-plan>.md
├── reports/                           # Laporan komprehensif formal pasca-remediasi, deploy, atau audit
│   └── YYYY-MM-DD-<slug-laporan>.md
└── 06_Archive_Dev_History/            # Arsip dev history & catatan historis lama
```

---

## 🔄 Alur 6 Tahap Siklus Hidup (Artifact Lifecycle Loop)

Setiap pengerjaan perbaikan atau fitur baru wajib mengikuti tahapan baku:

### 1. Deteksi & Registrasi Bug (`docs/bug/pending/` atau `docs/bug/active/`)
Ketika audit, CI/CD, linter, atau pengujian menemukan bug/celah keamanan:
- Pastikan folder subdirektori status tersedia (`mkdir -p docs/bug/{pending,active,resolved}`).
- Buat tiket awal di `docs/bug/pending/YYYY-MM-DD-<nama-temuan>.md` (atau langsung di `docs/bug/active/` jika rencana penanganan langsung dimulai saat itu juga).
- Wajib memuat:
  - **Tingkat Urgensi**: `Severity: P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)`.
  - **Gejala & Bukti Masalah**: Log error, stack trace, atau screenshot input.
  - **Root Cause Analysis (RCA)**: Analisis teknis penyebab akar masalah.
  - **Daftar Berkas Terdampak**: Path absolut ke file-file terkait.

### 2. Formulasi Rencana Kerja (`docs/plans/active/`)
Sebelum mengubah kode sumber secara masif:
- Agent wajib membuat dokumen rencana kerja di `docs/plans/active/YYYY-MM-DD-<nama-plan>.md`.
- Jika tiket bug sebelumnya berada di `docs/bug/pending/`, pindahkan ke `docs/bug/active/`.
- Rencana wajib menyertakan:
  - **Tujuan & Sasaran**: Hasil yang diharapkan.
  - **Batasan Arsitektur & Keamanan**: Prinsip non-breaking, PBAC, multi-tenant scope, larangan build docker di server produksi.
  - **Checklist Todo Granular**: Daftar tugas terukur menggunakan format markdown `- [ ]`.

### 3. Eksekusi Terkontrol (Execution & Task Ticking)
- Agent mengeksekusi kode per butir tugas.
- Setiap kali satu fase selesai, centang checklist `- [x]` pada file plan yang aktif.

### 4. Quality Gate Verification
Pekerjaan DILARANG dianggap selesai sebelum seluruh gerbang kualitas lulus:
- `bash scripts/verify-all.sh gateways` (untuk Go/Python microservices)
- `mvn test-compile -q` atau `mvn test` (untuk Spring Boot backend)
- `pnpm lint` dan `pnpm --filter <app> exec tsc --noEmit` (untuk frontend Admin & Tenant)
- `pnpm audit:versioning` (untuk kepatuhan Flyway & SemVer)
- `docker compose config -q` (untuk validitas compose & proxy)

### 5. Pengarsipan Selesai (Archival to `completed/` & `resolved/`)
Setelah Quality Gate lulus 100% dan verifikasi fungsional terkonfirmasi:
- Pindahkan file rencana kerja secara otomatis menggunakan perintah shell:
  ```bash
  mv docs/plans/active/YYYY-MM-DD-<slug>.md docs/plans/completed/
  ```
- Pindahkan tiket bug terkait secara otomatis ke folder resolved:
  ```bash
  mv docs/bug/active/YYYY-MM-DD-<slug>.md docs/bug/resolved/
  ```
- Tandai header tiket bug di `docs/bug/resolved/` dengan status `[RESOLVED]` dan cantumkan hash commit serta dokumen plan penyelesaian.

### 6. Penyusunan Laporan Akhir Resmi (`docs/reports/`)
Setelah bug dan plan selesai diarsipkan, Agent WAJIB menyusun dokumen laporan komprehensif di:
`/opt/project5/docs/reports/YYYY-MM-DD-<slug-laporan>.md`

Laporan wajib mencakup:
1. **Ringkasan Eksekutif & Sasaran**
2. **Matriks Bug, Gejala & Root Cause Analysis (RCA)**
3. **Solusi Rekayasa & Rincian Perubahan Kode Sumber**
4. **Tabel Verifikasi Quality Gate Monorepo (100% Pass)**
5. **Bukti Pengujian Penerimaan Pengguna (Acceptance Test)**
6. **Hash Commit Git, Status Pipeline CI/CD & Rekomendasi Selanjutnya**
