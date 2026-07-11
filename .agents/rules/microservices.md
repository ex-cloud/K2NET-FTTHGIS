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
