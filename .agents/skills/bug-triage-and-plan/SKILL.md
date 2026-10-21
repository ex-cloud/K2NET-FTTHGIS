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

### Langkah 5: Verifikasi Quality Gate Monorepo
Sebelum menyatakan perbaikan selesai, wajib menjalankan perintah verifikasi yang relevan:
* **Microservices & Gateways**:
  ```bash
  bash scripts/verify-all.sh gateways
  ```
* **Spring Boot API**:
  ```bash
  mvn test-compile -q
  ```
* **Frontend Admin / Tenant**:
  ```bash
  pnpm lint
  pnpm --filter @k2net/studio-admin typecheck
  ```
* **API Versioning & Flyway**:
  ```bash
  pnpm audit:versioning
  ```

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
