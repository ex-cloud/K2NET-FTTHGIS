# Go Microservices & Gateways Coding Rules

Halaman ini mendefinisikan aturan dan pola wajib untuk pengembangan mikroservis Go (services/).

---

## 🔌 1. Port Layanan Internal & API

Semua service internal berjalan pada port statis berikut:
* `5001` - notification-gateway (SMTP, Twilio SMS, WhatsApp)
* `5002` - payment-gateway (Xendit)
* `5003` - map-gateway (HERE / Google Maps APIs)
* `5004` - storage-gateway (MinIO S3)
* `5005` - whatsapp-gateway (Meta Cloud API)
* `5006` - scheduler-gateway (Cron Jobs)
* `5007` - export-gateway (S3 Export job)
* `5008` - olt-gateway (SNMP OLT client)
* `5009` - audit-gateway (Database audit logs)
* `5010` - go-poller (SNMP live status tracking API & Prometheus Metrics)
* `5011` - gateway-task (Obsidian Sync Worker)
* `5012` - **gateway-ai** (AI Assistant FastAPI Python — RAG + SSE + pgvector)

*Saat membuat service atau port baru, pastikan didaftarkan juga di `docker/prometheus/prometheus.yml` untuk monitoring.*

---

## 🔒 2. Multi-Tenant Isolation & X-Tenant-ID

Setiap gateway **wajib** mengekstrak header `X-Tenant-ID` yang dikirimkan oleh Kong API Gateway untuk membatasi ruang lingkup (scope) database transaksi, Redis cache, atau MinIO bucket.
* Validasi header internal `X-Gateway-Token` pada request yang masuk.
* Gunakan package `confighandler` bersama dari `services/shared/confighandler/config_handler.go` untuk membaca dan memuat konfigurasi.

---

## 🏗️ 3. Kompilasi & Go Workspace

* Project menggunakan multi-module `go.work` di root directory.
* **PENTING**: Module `gateways/shared` diselesaikan melalui workspace `go.work`. **Jangan** gunakan instruksi `require` untuk `gateways/shared` di dalam berkas `go.mod` lokal modul guna menghindari error path segment dot validation.

---

## 📊 4. Monitoring & Prometheus Metrics

* Setiap gateway disarankan mengekspos endpoint `/metrics` di port utama mereka.
* metrics tersebut harus memuat minimal counter request HTTP atau uptime dari service bersangkutan.

---

## 📊 5. Audit Logging & Client Standard

Setiap mikroservis Go baru atau lama yang memodifikasi state data (write operation) wajib menerapkan standarisasi audit logging:
* **Penggunaan Shared Client**: Gunakan shared package `gateways/shared/auditclient` yang diinisialisasi melalui helper `auditclient.NewFromEnv()`.
* **Mekanisme Non-Blocking (Asinkronus)**: Pengiriman audit log harus bersifat *fire-and-forget* dan dijalankan asinkronus menggunakan goroutine (`go client.LogEvent(...)`). Kegagalan koneksi audit tidak boleh mematikan alur eksekusi request utama.
* **Graceful Fallback**: Client wajib mendeteksi parameter `AUDIT_GATEWAY_URL`. Jika kosong, client harus otomatis dinonaktifkan (no-op) secara aman untuk mencegah crash pada development environment.
* **Noise Control pada Ingress Audit**: Endpoint penerima log audit (seperti log HTTP dari Kong) wajib menyaring dan mengabaikan request baca-saja (`GET`, `HEAD`, `OPTIONS`) guna mencegah membengkaknya ukuran database log.

---

## 🐍 6. Python FastAPI Microservice (`gateway-ai` Port 5012)

Aturan khusus untuk microservice Python yang berjalan berdampingan dengan service Go:

### Struktur Proyek
* Setiap microservice Python baru wajib mengikuti layout: `app/{api,core,db,models,services}/` dan `tests/`.
* Gunakan **Pydantic Settings** (`pydantic-settings`) untuk semua konfigurasi ENV — tidak boleh ada hardcoded credentials.

### Multi-Tenant Isolation (KRITIS)
* **SETIAP** query database PostgreSQL `pgvector` wajib menyertakan klausa `WHERE tenant_id = :tenant_id`.
* Gunakan dependency `verify_gateway_and_tenant()` (FastAPI Depends) yang memvalidasi `X-Gateway-Token` dari Kong dan mengekstrak `tenant_id` dari header `X-Tenant-ID`.
* Double-lock pada JOIN: jika query melibatkan join tabel, pastikan **kedua** tabel difilter dengan `tenant_id`.

### SSE Streaming
* Endpoint streaming wajib mengembalikan `StreamingResponse` dengan header `X-Accel-Buffering: no` untuk mencegah buffering di Traefik/Nginx.
* Format event SSE: `data: {"type": "sources"|"token"|"usage"|"error"|"done", ...}\n\n`

### pgvector & HNSW Index
* Gunakan dimensi embedding `1536` (OpenAI text-embedding-3-small / Gemini text-embedding-004).
* HNSW index dibuat dengan parameter `m=16, ef_construction=64` untuk balance antara kecepatan dan akurasi.
* Jangan pernah store atau query embedding tanpa filter tenant_id — ini adalah pelanggaran Zero Data Leakage.

### Pre-Deployment Checklist Python
```bash
cd services/gateway-ai
python -m py_compile app/**/*.py     # Syntax check
python -m pytest tests/ -v            # Unit tests
```
