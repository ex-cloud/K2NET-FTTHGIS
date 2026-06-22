# K2NET-FTTHGIS Monorepo

Selamat datang di repositori tunggal (monorepo) **K2NET-FTTHGIS**. Repositori ini menggabungkan semua komponen aplikasi, gateway, serta konfigurasi operasional dalam satu tempat untuk memudahkan pengelolaan dan deployment.

---

## 🗂️ Struktur Repositori

```text
K2NET-FTTHGIS/
│
├── 📂 apps/                          ← Aplikasi Utama (User-Facing)
│   ├── 📂 api/                       ← Backend Java Spring Boot
│   ├── 📂 studio/                    ← Frontend Next.js (GIS Dashboard)
│   ├── 📂 www/                       ← [Fase 3] Landing Page / Marketing
│   └── 📂 docs/                      ← [Fase 3] Dokumentasi Publik
│
├── 📂 services/                      ← Microservices & Infrastruktur (Go)
│   ├── 📂 storage-gateway/           ← Service Upload & File Management MinIO
│   ├── 📂 map-gateway/               ← Spatial/Tile Server Proxy
│   ├── 📂 notification-gateway/      ← Push Alerts & Notifications
│   ├── 📂 payment-gateway/           ← Integrasi Layanan Pembayaran
│   ├── 📂 poller/                    ← SNMP Poller (Monitoring Jaringan)
│   └── 📂 shared/                    ← Shared Libraries Go
│
├── 📂 packages/                      ← Shared Packages & Libraries
│   ├── 📂 ui/                        ← Shared UI components (React)
│   └── 📂 design-system/             ← Token warna, tipografi, dsb.
│
├── 📂 database/                      ← Skema & Migrasi Database PostgreSQL/PostGIS
│   └── 📂 migrations/
│
├── 📂 docker/                        ← Observability & Monitoring Configs (Grafana/Prometheus)
├── 📂 scripts/                       ← Otomatisasi deploy, backup, dan inisialisasi
├── docker-compose.yml                ← Orkestrasi Docker (Production)
├── docker-compose.staging.yml        ← Orkestrasi Docker (Staging)
└── README.md                         ← Berkas dokumentasi ini
```

---

## 🚀 Memulai (Getting Started)

### 📋 Prasyarat
- Docker Engine >= 20.10
- Docker Compose >= v2.0
- Node.js >= 20 (untuk pengembangan Frontend)
- JDK >= 17 (untuk pengembangan Backend Java)
- Go >= 1.25 (untuk pengembangan Services Go)

### ⚙️ Konfigurasi Environment
Salin template berkas `.env.example` menjadi `.env` di root direktori dan isi dengan kredensial yang sesuai:
```bash
cp .env.example .env
```
> [!CAUTION]
> **Jangan pernah menyimpan kredensial asli ke Git.** Berkas `.env` telah dimasukkan ke dalam `.gitignore`.

### 🐳 Menjalankan Layanan Docker Compose

#### Lokal / Development:
Anda bisa menjalankan stack infrastruktur secara parsial atau keseluruhan menggunakan Docker Compose:
```bash
docker compose up -d
```

#### Staging Environment:
Untuk menjalankan di staging server:
```bash
docker compose -f docker-compose.staging.yml up -d
```

---

## 🔒 Kebijakan Keamanan Kredensial

1. **JANGAN PERNAH** melakukan commit berkas `.env` atau `.env.*` lainnya.
2. Selalu gunakan variabel environment di Docker Compose untuk memetakan rahasia ke aplikasi/services.
3. Berkas-berkas `.properties` lokal dan folder data seperti `minio_data/` serta `backups/` telah terabaikan secara permanen melalui `.gitignore`.
