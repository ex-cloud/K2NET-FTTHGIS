---
name: bug-triage-and-plan
description: >-
  Prosedur terautomasi standar enterprise saat AI agent menemukan bug, celah keamanan,
  atau kegagalan audit/CI: membuat tiket bug terstruktur di docs/bug/YYYY-MM-DD-nama.md,
  merumuskan action plan di docs/plans/active/YYYY-MM-DD-nama.md, menyusun checklist tugas,
  menjalankan perbaikan & Quality Gate, memindahkan plan ke docs/plans/completed/,
  serta menyusun laporan akhir dan rekomendasi.
---

# 🛠️ Standard Operating Procedure: Bug Triage, Implementation Planning & Lifecycle Archival

Skill ini diaktifkan saat AI Agent menemukan bug, menerima laporan kegagalan audit, kegagalan CI/CD runner, atau saat merencanakan perbaikan/fitur terstruktur pada platform K2NET FTTH GIS.

---

## 🎯 Tujuan Prosedur
Memastikan setiap temuan memiliki tiket terdokumentasi rapi, tidak ada berkas acak yang mengotori repositori, rencana kerja tereksekusi dengan kendali checklist ketat, dan seluruh pekerjaan yang selesai diarsipkan secara otomatis.

- **Referensi Lengkap**: [Standar Siklus Hidup Dokumen, Tiket Bug & Implementation Plan](./references/lifecycle-and-documentation.md)

---

## 📋 Alur Eksekusi Langkah-demi-Langkah

### Langkah 1: Inisialisasi Direktori Lifecycle
Pastikan seluruh direktori lifecycle telah siap di host server:
```bash
mkdir -p /opt/project5/docs/bug/pending \
         /opt/project5/docs/bug/active \
         /opt/project5/docs/bug/resolved \
         /opt/project5/docs/plans/active \
         /opt/project5/docs/plans/completed \
         /opt/project5/docs/reports
```

---

### Langkah 2: Pembuatan Tiket Temuan Bug (`docs/bug/`)
Buat berkas markdown dengan konvensi nama:
`/opt/project5/docs/bug/YYYY-MM-DD-<slug-deskriptif>.md`

Gunakan struktur template berikut:
```markdown
# 🐛 [BUG / VULNERABILITY]: <Judul Singkat Masalah>
- **Tanggal Ditemukan**: YYYY-MM-DD
- **Severity**: P0 (Urgent/Blocker) | P1 (High) | P2 (Medium) | P3 (Low)
- **Komponen Terdampak**: (Contoh: `services/payment-gateway`, `apps/api`)
- **Status**: [OPEN]

---

## 1. Gejala & Ringkasan Masalah
<Jelaskan error, log kegagalan, atau indikasi kegagalan sistem>

## 2. Bukti & Log Replikasi
\`\`\`text
<Tempelkan potongan error log / stack trace di sini>
\`\`\`

## 3. Analisis Akar Masalah (Root Cause Analysis - RCA)
<Uraikan secara teknis mengapa masalah ini terjadi>

## 4. Tautan Rencana Aksi (Action Plan)
- Rencana Implementasi: [docs/plans/active/YYYY-MM-DD-<slug>.md](file:///opt/project5/docs/plans/active/YYYY-MM-DD-<slug>.md)
```

---

### Langkah 3: Formulasi Implementation Plan Baru (`docs/plans/active/`)
Buat berkas rencana kerja aktif di folder:
`/opt/project5/docs/plans/active/YYYY-MM-DD-<slug-deskriptif>.md`

Gunakan struktur template berikut:
```markdown
# 📋 Implementation Plan: <Nama Perbaikan / Fitur>
- **Tanggal Dibuat**: YYYY-MM-DD
- **Status**: [IN PROGRESS]
- **Tiket Terkait**: [docs/bug/YYYY-MM-DD-<slug>.md](file:///opt/project5/docs/bug/YYYY-MM-DD-<slug>.md)

---

## 🎯 Target & Batasan
- **Sasaran Utama**: <Apa yang ingin dicapai>
- **Batasan**: Dilarang breaking change, pertahankan PBAC, isolasi multi-tenant.

---

## 📝 Granular Task Todo List
### Fase 1: Persiapan & Analisis Kode
- [ ] 1.1. <Tugas 1>
- [ ] 1.2. <Tugas 2>

### Fase 2: Eksekusi Kode & Remediasi
- [ ] 2.1. <Tugas 3>
- [ ] 2.2. <Tugas 4>

### Fase 3: Pengujian & Quality Gate
- [ ] 3.1. Validasi unit test & static analysis
- [ ] 3.2. Pemeriksaan kompilasi container / monorepo
```

---

### Langkah 4: Eksekusi Terkendali & Centang Checklist
1. Kerjakan perubahan kode sumber secara bertahap sesuai butir tugas pada Implementation Plan.
2. Setiap kali butir tugas selesai dan terverifikasi secara lokal, ubah status checkbox menjadi `- [x]`.

---

### Langkah 5: Verifikasi Quality Gate Domain-Aware (WAJIB)

> 🛑 **ATURAN MUTLAK**: AI Agent **DILARANG** memindahkan plan ke `completed/` atau mengumumkan "selesai" sebelum menjalankan seluruh perintah QG yang relevan dan mencatat hasilnya.

**Langkah 5.1** — Identifikasi domain yang disentuh selama sesi kerja (file/folder apa yang berubah?):

| Domain | Trigger File/Folder | Gunakan QG Set |
|---|---|---|
| Frontend | `apps/studio-*/`, `packages/` | QG Set 1 |
| Backend Spring Boot | `apps/api/src/`, `*.java`, Flyway SQL | QG Set 2 |
| Go Microservices | `services/gateway-*/`, `*.go` | QG Set 3 |
| Infrastruktur | `docker-compose*.yml`, `docker/kong/` | QG Set 4 |
| PBAC / Security | `PermissionSeeder.java`, `SecurityConfig.java` | QG Set 5 |
| ADR / Docs | `docs/adr/`, `docs/rfc/` | QG Set 6 |

**Langkah 5.2** — Jalankan perintah QG sesuai domain yang teridentifikasi:

> 📋 **Referensi lengkap perintah per domain**: [`docs/qa/quality-gate-checklist.md`](file:///opt/project5/docs/qa/quality-gate-checklist.md)

```bash
# ⚠️ WAJIB: Set environment variable sebelum perintah Java/Go
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
export PATH=$PATH:/usr/local/go/bin

# Frontend (jalankan jika domain Frontend tersentuh)
pnpm --filter @k2net/studio-admin typecheck
pnpm --filter @k2net/studio-tenant typecheck
pnpm audit:i18n && pnpm audit:colors && pnpm audit:design-system

# Backend Spring Boot (jalankan jika domain Backend tersentuh)
JAVA_HOME=/usr/lib/jvm/java-21-openjdk mvn -f apps/api/pom.xml test-compile -q
JAVA_HOME=/usr/lib/jvm/java-21-openjdk mvn -f apps/api/pom.xml test
pnpm audit:versioning

# Go Microservices (jalankan jika domain Go tersentuh)
bash scripts/verify-all.sh gateways

# Infrastruktur (jalankan jika docker/kong config berubah)
docker compose config -q
docker exec kong kong config parse /usr/local/kong/declarative/kong.yml

# PBAC/Security (jalankan jika Permission atau SecurityConfig berubah)
JAVA_HOME=/usr/lib/jvm/java-21-openjdk bash scripts/audit-security-matrix.sh

# ADR/Docs (jalankan jika docs/adr berubah)
pnpm audit:adr
```

**Langkah 5.3** — Catat hasil eksekusi di tabel `## ✅ Verifikasi Quality Gate` pada berkas plan aktif:
- Ganti `🔲 PENDING` → `✅ PASS` atau `❌ FAIL`
- Jika ada `❌ FAIL`, **perbaiki masalahnya terlebih dahulu** sebelum melanjutkan ke Langkah 6.

---

### Langkah 6: Pemindahan Plan & Bug ke Status Selesai
Setelah seluruh Quality Gate lulus 100%:
1. Pindahkan berkas rencana kerja secara otomatis menggunakan shell command:
   ```bash
   mv /opt/project5/docs/plans/active/YYYY-MM-DD-<slug>.md /opt/project5/docs/plans/completed/
   ```
2. Perbarui header pada berkas plan yang telah dipindahkan:
   - Ubah `- **Status**: [IN PROGRESS]` menjadi `- **Status**: [COMPLETED ✅]`
3. Pindahkan berkas tiket bug ke folder resolved:
   ```bash
   mv /opt/project5/docs/bug/active/YYYY-MM-DD-<slug>.md /opt/project5/docs/bug/resolved/
   ```
4. Perbarui tiket bug di `/opt/project5/docs/bug/resolved/YYYY-MM-DD-<slug>.md`:
   - Ubah `- **Status**: [OPEN]` menjadi `- **Status**: [RESOLVED ✅]`
   - Tambahkan bagian **Resolusi & Commit Hash**:
     ```markdown
     ## 5. Resolusi & Commit
     - **Status Akhir**: RESOLVED
     - **Tanggal Selesai**: YYYY-MM-DD
     - **Commit Hash**: `<git_commit_hash>`
     - **Dokumen Penyelesaian**: [docs/plans/completed/YYYY-MM-DD-<slug>.md](file:///opt/project5/docs/plans/completed/YYYY-MM-DD-<slug>.md)
     ```

---

### Langkah 7: Penyusunan Laporan Akhir Resmi (`docs/reports/`)
Setelah bug dan plan diarsipkan, Agent WAJIB membuat laporan resmi komprehensif di:
`/opt/project5/docs/reports/YYYY-MM-DD-<slug-laporan>.md`

Laporan memuat:
1. **Ringkasan Eksekutif & Sasaran**
2. **Matriks Bug, Gejala & Root Cause Analysis (RCA)**
3. **Solusi Rekayasa & Rincian Perubahan Kode Sumber**
4. **Tabel Verifikasi Quality Gate Monorepo (100% Pass)**
5. **Bukti Pengujian Penerimaan Pengguna (Acceptance Test)**
6. **Hash Commit Git, Status Pipeline CI/CD & Rekomendasi Selanjutnya**
