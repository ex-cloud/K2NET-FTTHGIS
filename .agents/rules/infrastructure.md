# Infrastructure & Gateway Routing Coding Rules

Halaman ini mendefinisikan aturan dan pola wajib untuk pengelolaan infrastruktur server, reverse proxy, API gateway, dan integrasi antar service (Kong, Traefik, Keycloak, Postgres, Redis, MinIO).

---

## 🔀 1. Traefik Ingress (Edge Reverse Proxy)

Traefik bertindak sebagai SSL termination dan Edge Ingress Router di port 80/443 (override port 2053 di Cloudflare).
* **Konfigurasi Rute Baru**: Definisikan rute baru di label `docker-compose.yml` (untuk service internal compose) atau dynamic file [`docker/traefik/dynamic/services.yml`](file:///opt/project5/docker/traefik/dynamic/services.yml) (untuk port host/bridge).
* **Docker Network**: Pastikan service baru terhubung ke network `project5_default` agar dapat dijangkau oleh Traefik dan Prometheus menggunakan nama kontainernya.
* **SSL**: Jangan membuat LetsEncrypt manual. Gunakan sertifikat Origin CA Cloudflare (`gis.pem`/`gis.key`) yang sudah dimuat otomatis oleh Traefik.

---

## 🔒 2. Kong API Gateway (DB-less Mode)

Kong mengelola CORS, rate-limiting global, dan validasi token JWT.
* **Port API**: Kong mendengarkan pada port `8000` (HTTP) dan `8443` (HTTPS) secara internal.
* **Routing API**: Semua rute API (`/api/v1/...`) dan Gateway API (`/gateway/...`) wajib melewati Kong sebelum diteruskan ke backend Spring Boot (`ftth-backend`) atau microservices Go.
* **Header Forwarding**: Kong secara otomatis mendekode klaim JWT Keycloak dan menyematkan header `X-Tenant-ID` untuk multi-tenant isolation. Microservices di belakang Kong harus mempercayai header ini.

---

## 🔑 3. Keycloak Identity Access Management (IAM)

Keycloak mengelola otentikasi pengguna global dan tenant.
* **Endpoint Dynamic**: NextAuth Studio menggunakan dynamic issuer matching subdomain tenant untuk merujuk ke Realm Keycloak yang sesuai (contoh: `system-gis.k2net.id` -> `ftth-realm`, `garut-gis.k2net.id` -> `garut` realm).
* **Bypass Cloudflare**: Komunikasi server-to-server (misal refresh token dari Next.js ke Keycloak) wajib menggunakan URL internal Keycloak (`http://ftth-keycloak:8080` atau `http://localhost:8081`) untuk memotong proteksi Cloudflare WAF/403.

---

## 🗄️ 4. Databases & Cache

* **PostgreSQL Spatial**: PostgreSQL 17 (`ftth_gis` database) berjalan di port `5432` dengan ekstensi PostGIS aktif untuk spatial queries.
* **Redis Cache**: Redis digunakan untuk session store, rate-limiting, event store, dan queue logs. Pastikan koneksi Redis menggunakan format target `host:port` (contoh `redis:6379` internal docker, atau localhost jika dev).

---

## 🪣 5. Object Storage (MinIO S3)

* **Endpoints**: MinIO API menggunakan port `9005` (API) dan `9006` (Console).
* **PENTING**: Koneksi API MinIO wajib diikat ke Tailscale IP `100.110.205.109:9005`. Jangan gunakan localhost/127.0.0.1 dalam script/config server untuk menjamin konektivitas lintas node.

---

## 🚀 6. Prosedur Rebuild & Hot-reload Container

* **Pembersihan Cache NPM/PNPM**: Saat melakukan pembaruan pada paket `@k2net/design-system` atau `@k2net/ui`, proses build Docker **wajib** menyertakan argumen `--no-cache` pada container frontend bersangkutan (contoh: `docker compose build --no-cache frontend-admin` atau `docker compose build --no-cache frontend-tenant`).
* **Siklus Dependensi Kontainer**: Saat kontainer frontend diperbarui, pastikan reverse proxy **Traefik** dan **Kong API Gateway** dalam kondisi aktif terlebih dahulu untuk menghindari kegagalan otentikasi NextAuth saat kontainer baru melakukan booting awal.
