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
├── bug/                               # Tiket temuan bug, vulnerabilitas, atau regresi
│   └── YYYY-MM-DD-<slug-temuan>.md
├── plans/
│   ├── active/                        # Action plan yang sedang aktif dikerjakan
│   │   └── YYYY-MM-DD-<slug-plan>.md
│   └── completed/                     # Action plan yang telah tuntas & lolos Quality Gate
│       └── YYYY-MM-DD-<slug-plan>.md
├── reports/                           # Laporan pasca-deploy, audit berkala, atau post-mortem
│   └── YYYY-MM-DD-<slug-laporan>.md
└── 06_Archive_Dev_History/            # Arsip dev history & catatan historis lama
```

---

## 🔄 Alur 5 Tahap Siklus Hidup (Artifact Lifecycle Loop)

Setiap pengerjaan perbaikan atau fitur baru wajib mengikuti tahapan baku:

### 1. Deteksi & Registrasi Bug (`docs/bug/`)
Ketika audit, CI/CD, linter, atau pengujian menemukan bug/celah keamanan:
- Agent wajib memastikan folder `/opt/project5/docs/bug` tersedia (`mkdir -p`).
- Buat tiket dengan format nama: `docs/bug/YYYY-MM-DD-<nama-temuan>.md`.
- Wajib memuat:
  - **Tingkat Urgensi**: `Severity: P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)`.
  - **Gejala & Bukti Masalah**: Log error, stack trace, atau screenshot input.
  - **Root Cause Analysis (RCA)**: Analisis teknis penyebab akar masalah.
  - **Daftar Berkas Terdampak**: Path absolut ke file-file terkait.

### 2. Formulasi Rencana Kerja (`docs/plans/active/`)
Sebelum mengubah kode sumber secara masif:
- Agent wajib membuat dokumen rencana kerja di `docs/plans/active/YYYY-MM-DD-<nama-plan>.md`.
- Rencana wajib menyertakan:
  - **Tujuan & Sasaran**: Hasil yang diharapkan.
  - **Batasan Arsitektur & Keamanan**: Prinsip non-breaking, PBAC, multi-tenant scope.
  - **Checklist Todo Granular**: Daftar tugas terukur menggunakan format markdown `- [ ]`.

### 3. Eksekusi Terkontrol (Execution & Task Ticking)
- Agent mengeksekusi kode per butir tugas.
- Setiap kali satu fase selesai, centang checklist `- [x]` pada file plan yang aktif.

### 4. Quality Gate Verification
Pekerjaan DILARANG dianggap selesai sebelum seluruh gerbang kualitas lulus:
- `bash scripts/verify-all.sh gateways` (untuk Go/Python microservices)
- `mvn test-compile -q` atau `mvn test` (untuk Spring Boot backend)
- `pnpm lint` dan `pnpm typecheck` (untuk frontend Admin & Tenant)
- `pnpm audit:versioning` (untuk kepatuhan Flyway & SemVer)
- `docker compose config -q` (untuk validitas compose & proxy)

### 5. Pengarsipan & Rekomendasi (Archival & Sign-Off)
Setelah Quality Gate lulus 100%:
- Pindahkan file rencana kerja secara otomatis menggunakan perintah shell:
  ```bash
  mv docs/plans/active/YYYY-MM-DD-<slug>.md docs/plans/completed/
  ```
- Tandai tiket bug di `docs/bug/` dengan status `[RESOLVED]` dan cantumkan hash commit / ringkasan solusi.
- Agent menyajikan ringkasan hasil kerja dan rekomendasi strategis berikutnya kepada developer.
