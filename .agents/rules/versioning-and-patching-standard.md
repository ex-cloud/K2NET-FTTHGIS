# Standar Baku API Versioning, Semantic Versioning (SemVer) & Database Patching

Dokumen ini adalah aturan baku operasional (*Operational Guidelines*) yang wajib dipatuhi oleh seluruh pengembang dan AI Agent untuk menjaga kestabilan, modularitas, dan keteraturan evolusi platform K2NET Enterprise SaaS.

---

## 🏛️ Pilar 1: Standar API Versioning (`/api/v1` vs `/api/v2`)

API Versioning adalah **perjanjian kontrak (*contract stability*)** antara Backend/Gateway dengan Client (Frontend Web SPA, Mobile App Teknisi, atau Integrasi Eksternal).

### 1.1 Aturan Penamaan Endpoint REST API
1. **Wajib Prefix Versi**: Seluruh endpoint REST API di Spring Boot dan Go Gateway **WAJIB** menggunakan prefix `/api/v[0-9]+/` (misal: `/api/v1/projects`, `/api/v1/zones`, `/api/v1/audit`).
2. **Pengecualian yang Diizinkan**: Endpoint internal diagnostik seperti `/actuator/health`, `/actuator/prometheus`, `/health`, dan `/api/health`.

### 1.2 Prinsip *"Expand and Contract"* (Non-Breaking Changes di `/api/v1`)
Pertahankan `/api/v1` sebagai basis utama. **DILARANG** menaikkan versi API jika perubahan bersifat ramah ke belakang (*backward-compatible*):
- ✅ **Menambah Endpoint Baru**: Contoh pembuatan endpoint `/api/v1/zones` atau `/api/v1/boq` tetap berada di bawah `/api/v1/`.
- ✅ **Menambah Kolom/Field Baru pada Response JSON**: Client lama akan mengabaikan field baru secara aman tanpa error parsing.
- ✅ **Menambah Query Parameter Opsional**: Contoh `GET /api/v1/zones?stage=LIVE&limit=10`.
- ✅ **Optimasi Logic & Query Performance**: Selama response schema tetap konsisten.

### 1.3 Kapan Harus Membuat `/api/v2`? (Breaking Changes)
Versi baru (`/api/v2`) **HANYA** dibuat jika terdapat perubahan kontrak data yang pasti akan merusak (*break*) client lama:
1. Mengubah tipe data atau struktur hierarki field utama (misal: `customer_name: string` diubah menjadi objek `customer: { firstName, lastName }`).
2. Menghapus endpoint atau field wajib yang sedang aktif digunakan client versi lama.
3. Mengubah arsitektur autentikasi/header wajib yang tidak kompatibel ke belakang.

### 1.4 Prinsip *Per-Module / Per-Controller Versioning*
- **TIDAK PERLU** menaikkan seluruh backend ke `v2` secara serentak.
- Terapkan versioning per-modul (contoh: buat `FiberCableV2Controller.java` dengan path `/api/v2/fiber-cables` sementara modul lain tetap di `/api/v1/`).
- **Siklus Deprecasi**: Berikan header HTTP `Sunset` dan `Deprecation: true` pada controller `v1` yang akan digantikan.

---

## 🏷️ Pilar 2: Standar Semantic Versioning (SemVer) & Release Tags

Format baku versi rilis platform K2NET mengikuti standar internasional **Semantic Versioning 2.0.0**:

$$\text{Format Release Tag: } \mathbf{vMAJOR.MINOR.PATCH}$$

```
                v1.0.0 (Baseline Stabil Platform)
                   │
                   ├── [PATCH] v1.0.1 (Hotfix Bug Null Telemetry / Typo i18n)
                   ├── [PATCH] v1.0.2 (Optimasi Query Index PostgreSQL)
                   │
                v1.1.0 (MINOR: Rilis Coverage Zone Lifecycle & Stages)
                   │
                   ├── [PATCH] v1.1.1 (Hotfix BoQ Calculation / Quota Edge Case)
                   │
                v1.2.0 (MINOR: Rilis OLT Realtime Auto-Discovery & SNMP Engine)
                   │
                v2.0.0 (MAJOR: Rilis Arsitektur Masif / Multi-Region Cloud)
```

### 2.1 Definisi Kenaikan Angka Versi:
1. **MAJOR (`v2.0.0`)**:
   - Perombakan arsitektur masif (contoh: migrasi total database engine, redesign antarmuka seluruh platform, atau restrukturisasi sistem perizinan IAM).
2. **MINOR (`v1.1.0`)**:
   - Penambahan modul atau kemampuan fitur baru yang kompatibel ke belakang (contoh: *Fase B Coverage Zone Lifecycle & Topology Stages*, *Automated BoQ Export*, *AI Knowledge Copilot*).
3. **PATCH (`v1.0.1`)**:
   - Perbaikan bug (*bugfix*), penambalan keamanan CVE (*security patch*), penyesuaian CSS/UI bug, atau optimasi performa tanpa fitur baru.

### 2.2 Penyelarasan Metadata Monorepo:
- Root `package.json` memuat versi SemVer platform (contoh: `"version": "1.0.0"`).
- Spring Boot `pom.xml` memuat versi build dan terhubung dengan Git commit ID (`git-commit-id-maven-plugin`).

---

## 🩹 Pilar 3: Standar Database Migration & Patching (Flyway Anti-Downtime)

Karena K2NET melayani tenant ISP aktif dalam arsitektur Multi-Tenant SaaS, perubahan skema database dilarang memicu *downtime* atau korupsi data.

### 3.1 Aturan Baku Flyway Migration:
1. **Dilarang Mengedit File Migrasi Lama (`V1` s/d `V51`)**: File migrasi yang sudah pernah dieksekusi di database produksi tidak boleh diubah isinya karena akan memicu kegagalan *Flyway Checksum Validation*.
2. **Penamaan Berkas Sekuensial**:
   - Pola: `V{NOMOR}__{deskripsi_singkat_snake_case}.sql` (contoh: `V51__project_zones_and_topology_lifecycle.sql`, `V52__add_index_to_network_nodes.sql`).
   - Dilarang ada nomor versi ganda (*duplicate version*) atau nomor yang terlewati (*gaps*).
3. **Prinsip Non-Destructive DDL (Zero-Downtime Migration)**:
   - Menambah kolom baru **WAJIB** `NULL` atau memiliki nilai `DEFAULT` (agar baris data lama tidak gagal).
   - Dilarang langsung menjalankan `DROP COLUMN` pada kolom aktif. Gunakan strategi 2-fase: (Fase 1: tandai deprecated di kode, Fase 2 di rilis berikutnya: hapus kolom fisik).
4. **Audit Trail Paritas**: Setiap pembuatan tabel bisnis baru wajib menyertakan tabel audit Hibernate Envers (`*_aud`) dan pendaftaran permissions di tabel `permissions`.

---

## 🔍 Pilar 4: Telemetri & Commit Correlation (Realtime Tracking)

Seluruh request yang melewati sistem otomatis diperkaya dengan telemetri runtime:
- **`appVersion`**: Terisi otomatis oleh Git commit hash pendek (contoh: `135a869`).
- **`req.url`**: Mencatat rute API lengkap termasuk versi (`/api/v1/zones`).
- **`cf_ray` / `client_country`**: Mencatat ID trace Cloudflare Edge dan asal geografis.

Jika terjadi error setelah deployment patch baru, developer dapat langsung memfilter `appVersion: "<commit_hash>"` di Log Explorer untuk mengisolasi akar masalah.

---

## 🚫 Tabel Anti-Patterns (Dilarang Keras)

| Anti-Pattern | Mengapa Dilarang? | Solusi Benar |
|---|---|---|
| **Menghapus prefix versi** (`/projects` tanpa `/api/v1`) | Merusak routing Kong Gateway, bypass token extractor, dan menyulitkan evolusi API. | Wajib selalu gunakan `/api/v1/<modul>`. |
| **Membuat `/api/v2` hanya karena menambah tabel baru** | Menimbulkan redundansi kode dan membebani frontend untuk memelihara 2 client terpisah. | Tetap gunakan `/api/v1` dan tambahkan endpoint baru. |
| **Mengubah isi file Flyway `V1`..`V51` yang sudah commit** | Mengakibatkan database container crash saat startup karena *Flyway Checksum Mismatch*. | Buat file migrasi baru `V52__...sql`. |
| **Membuat breaking change tanpa fallback field** | Membuat aplikasi mobile teknisi atau integrasi billing tenant langsung error. | Terapkan pola *Expand and Contract*. |
