# Aturan Baku Manajemen Knowledge Base AI — K2NET FTTH GIS

Dokumen ini adalah pedoman dan standar baku (*Standard Operating Procedure*) untuk penambahan, pembaruan, dan pengelolaan basis pengetahuan (*Knowledge Base*) AI Assistant Gateway pada platform K2NET Enterprise FTTH GIS.

---

## 🎯 1. Prinsip Utama (Core Principles)

1. **Server Sebagai Source of Truth**:
   - Direktori `/opt/project5/docs/` adalah repositori induk semua dokumentasi teknis, arsitektur, dan SOP sistem.
   - Perubahan di Obsidian Vault diselaraskan langsung dengan folder server ini via Nextcloud WebDAV.

2. **Isolasi Multi-Tenant Mutlak (Zero Data Leakage)**:
   - **Dokumentasi Platform / Global**: Menggunakan `tenant_id = 00000000-0000-0000-0000-000000000000` (hanya dapat diakses oleh Super Admin / DevOps di Portal Utama `system-gis.kdua.net`).
   - **Dokumentasi Khusus Mitra ISP**: Wajib menggunakan `tenant_id` spesifik tenant tersebut agar data tidak bocor ke tenant lain.

3. **Konsistensi Vektor & Dimensi**:
   - Teks dokumen dipecah (*chunked*) menggunakan `RAG_CHUNK_SIZE = 500` token dengan `RAG_CHUNK_OVERLAP = 50` token.
   - Vektor embedding disimpan di PostgreSQL 17 menggunakan ekstensi `pgvector` tipe `vector(1536)`.

---

## 📁 2. Taksonomi Kategori & Direktori Baku

Setiap pengetahuan baru **WAJIB** diklasifikasikan ke dalam salah satu dari 6 kategori baku berikut:

| Kategori (Enum DB) | Lokasi Direktori Server | Deskripsi & Contoh Dokumen |
|---|---|---|
| `NETWORK_CONFIG` | `/opt/project5/docs/01_Architecture/` | Master Blueprint, Arsitektur Backend, Hybrid RBAC, Port Gateway, Skema Database |
| `TROUBLESHOOTING` | `/opt/project5/docs/02_SOP_Troubleshooting/` | Panduan OLT ZTE/Huawei, Standar Redaman Optik (Nominal/Kritis), Solusi LOS/Dying Gasp |
| `INFRASTRUCTURE` | `/opt/project5/docs/03_Infrastructure/` | Panduan Docker Compose, Traefik SSL, Kong API Gateway, MinIO S3, Keycloak, Backup DR |
| `GIS_MANUAL` | `/opt/project5/docs/04_GIS_Mapping/` | Standar Koordinat EPSG:4326, QGIS Import/Export, Standar Survey ODP/FAT/Kabel |
| `PROJECT_MANAGEMENT` | `/opt/project5/docs/05_Plans_Roadmap/` | Inisiatif Roadmap, Rencana Upgrade Modul, Linear Projects & Tasks |
| `GENERAL` | `/opt/project5/docs/00_AI_Agent/` | Prompt Sistem AI, Definisi Persona, Skill Customization, SOP Sistem |

---

## 🛠️ 3. Alur Baku Penambahan Pengetahuan Baru

Penambahan pengetahuan baru dapat dilakukan melalui **3 metode resmi**:

### Metode A: Melalui Antarmuka Admin Portal (Direkomendasikan — Instan)
1. Buka Admin Portal ➔ Menu **Gateways & Integration** ➔ **Services Control** ➔ **AI Assistant Gateway** (`/gateways/ai`).
2. Pilih salah satu opsi:
   - **Tab "Unggah Berkas SOP"**: Unggah file `.md`, `.pdf`, atau `.txt`. Pilih kategori yang sesuai lalu klik *Unggah & Indeks*.
   - **Tab "Tulis Manual"**: Tulis catatan teknis langsung menggunakan Markdown editor. Masukkan judul dan kategori lalu klik *Simpan & Indeks Pengetahuan*.
3. Backend `gateway-ai` akan memproses dokumen secara real-time ke tabel `ai_documents` dan membuat chunk vektor di `ai_document_chunks`.

### Metode B: Menaruh File Baru di Folder Server (`/opt/project5/docs`)
1. Buat berkas markdown baru di subdirektori yang sesuai (misal: `/opt/project5/docs/02_SOP_Troubleshooting/SOP_MIGRASI_OLT_HUAWEI.md`).
2. Buka halaman `/gateways/ai` di browser dan klik tombol **"🔄 Sinkronkan Folder Server Docs"**, ATAU jalankan perintah terminal:
   ```bash
   docker exec ftth-ai-gateway python /app/scripts/ingest_local_knowledge.py --dir /opt/project5/docs/02_SOP_Troubleshooting --category TROUBLESHOOTING
   ```
3. Dokumen baru otomatis terindeks dan diperbarui di pgvector tanpa duplikasi.

### Metode C: Sinkronisasi Otomatis dari Obsidian Vault
1. Tulis atau edit dokumen di Obsidian Vault (`K2NET_Engineering_Vault/05_Documentation/`).
2. Jalankan skrip sinkronisasi berkas:
   ```bash
   bash /opt/project5/scripts/sync-docs-obsidian.sh
   ```

---

## 📝 4. Standar Penulisan Dokumen Markdown (Style Guide)

Agar representasi vektor (*embedding semantic accuracy*) menghasilkan jawaban AI yang tajam dan akurat, ikuti kaidah penulisan berikut:

1. **Judul H1 Tunggal yang Deskriptif**:
   ```markdown
   # Standar Operasional Prosedur: Penanganan Redaman Kritis OLT ZTE C320
   ```
2. **Sertakan Angka, Unit, dan Parameter Teknis Pasti**:
   - Sebutkan angka spesifik: *"Redaman normal: -15 dBm s/d -24 dBm. Redaman kritis: < -27 dBm."*
   - Sebutkan perintah CLI OLT: `show gpon onu state gpon-olt_1/1/1`
3. **Gunakan Tabel untuk Pemetaan Konfigurasi**:
   - Memudahkan AI membandingkan spesifikasi perangkat atau kode error.
4. **Panjang Dokumen Ideal**:
   - Dokumen berukuran 300 - 2500 kata sangat optimal untuk proses chunking 500 token.
