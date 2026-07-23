# FTTH GIS — K2NET Enterprise SaaS Platform Customization Context

Dokumen ini adalah repositori memori persisten dan aturan pengkodean untuk AI Agent yang bekerja pada proyek K2NET FTTH GIS. Aturan ini dimuat secara otomatis oleh sistem IDE untuk menjaga konsistensi pengerjaan.

---

## 🏗️ Gambaran Arsitektur Utama
- **Frontend Next.js**: [apps/studio](file:///opt/project5/apps/studio)
- **Backend Spring Boot**: [apps/api](file:///opt/project5/apps/api)
- **Go Microservices & Gateways**: [services/](file:///opt/project5/services/)
- **API Gateway**: Kong (Port 8000 / DB-less declarative)
- **Edge Reverse Proxy & SSL**: Traefik (Port 80/443)
- **Identity IAM**: Keycloak 26 (Port 8081)

---

## 🔒 Otentikasi & Super Admin (God Mode)
- Super Admin ditandai oleh role `"super_admin"` atau `"ROLE_SUPER_ADMIN"`.
- Logika otentikasi di client (`usePermissions`) dan backend **wajib** membypass semua pengecekan hak akses (return `true`) untuk Super Admin.

---

## 🧪 Aturan Baku Verifikasi Kode Sebelum Deploy (Pre-Deployment Checklist)

Sebelum mengirimkan perubahan (*commit/push/deploy*) ke server, seluruh kode **WAJIB** melewati pengujian sintaks, linter, unit test, dan kompilasi per modul sebagai berikut:

### 1. Frontend Next.js (`apps/studio-admin` & `apps/studio-tenant`)
```bash
pnpm --filter @k2net/ui build          # Memastikan paket UI terkompilasi
pnpm --filter @k2net/studio-admin lint # Memeriksa standar penulisan kode linter
pnpm --filter @k2net/studio-admin build# Memastikan Next.js terkompilasi 100% tanpa error
```

### 2. Backend Spring Boot (`apps/api`)
```bash
mvn clean test                         # Menjalankan seluruh pengujian unit backend Java
mvn clean package -DskipTests=false    # Memastikan aplikasi Java terkompilasi & terkemas (.jar)
```

### 3. Go Microservices & Gateways (`services/*`)
```bash
go vet ./...                           # Static analysis memeriksa bug potensial Go
go test ./...                          # Menjalankan unit test pada seluruh gateway Go
go build ./...                         # Memastikan kompilasi workspace Go (go.work) sukses
```

### 4. API Gateway Kong (`docker/kong/kong.yml`)
```bash
kong config parse docker/kong/kong.yml # Memeriksa keabsahan deklaratif kong.yml
```

### 5. Reverse Proxy Traefik (`docker/traefik/dynamic/`)
```bash
# Validasi konfigurasi YAML dynamic router Traefik v3 sebelum direstart
```

### 8. Docker Engine & Network Inspection
```bash
docker compose config                  # Memeriksa keabsahan file compose
docker network inspect project5_default | grep -E '"Name"|"IPv4Address"' # Verifikasi IP dinamis kontainer
```

---

## 🚫 ATURAN MUTLAK DEPLOYMENT — TERLARANG BUILD DI SERVER

> 🛑 **DILARANG KERAS**: Meminta agent atau mengosongkan/menjalankan perintah `docker compose build --no-cache` atau `docker build` langsung di server/VM produksi. Build Docker **WAJIB** dilakukan oleh GitHub Actions Runner (compute eksternal) untuk mencegah insiden server overload (Load Avg > 30).

### Alur Deployment Produksi Wajib:
1. Jalankan **Pre-Deployment Checklist** di atas secara lokal / di sandbox environment.
2. Push commit ke branch `main`.
3. GitHub Actions (`.github/workflows/deploy-production.yml`) akan:
   - **Job 1 (Validate)**: Linting, type-checking, test suite, dan audit anti-regression.
   - **Job 2 (Docker Build)**: Build Docker image di runner GitHub dan push ke `ghcr.io`.
   - **Job 3 (Deploy)**: Trigger SSH ke server untuk `docker pull` + `docker compose up -d --no-build`.

---

---

## 🌐 Aturan Komunikasi Jaringan & IP Docker (Docker IP Rules)

1. **Dilarang Hardcode IP Internal (`172.18.0.x`)**: Seluruh inter-service communication wajib menggunakan **Container/Service Hostname** (`http://backend:9090`, `http://ftth-postgres:5432`, `http://keycloak:8081`, `http://ftth-poller:5010`). IP internal Docker bersifat dinamis dan dapat berubah setiap kali kontainer di-recreate.
2. **Penggunaan CIDR Subnet Range**: Pada IP Whitelist (seperti `kong.yml`), wajib menggunakan range Subnet CIDR (`172.18.0.0/16`) alih-alih IP tunggal (`172.18.0.1`).
3. **Pengecualian IP Tailscale**: Tailscale IP `100.110.205.109` digunakan khusus untuk MinIO S3 API (port 9005) dan Grafana (port 3002) untuk akses backup on-premise offsite.

---

## 📋 Aturan Pengkodean per Bagian (Coding Rules)

Untuk menjaga kualitas dan standardisasi sistem, ikuti petunjuk teknis pada tautan berikut sebelum mulai melakukan modifikasi:

1. **Aturan Frontend (Next.js & UI)**: [rules/frontend.md](file:///opt/project5/.agents/rules/frontend.md)
   *Membahas: Page Guards wajib, skema validasi Zod, sonner notification, dark mode styling.*
   
2. **Aturan Backend (Spring Boot & DB)**: [rules/backend.md](file:///opt/project5/.agents/rules/backend.md)
   *Membahas: Spring Security PreAuthorize, Hibernate PostGIS audit, snake_case.*

3. **Aturan Microservices (Go & Gateways)**: [rules/microservices.md](file:///opt/project5/.agents/rules/microservices.md)
   *Membahas: Port map internal, X-Tenant-ID header, go.work workspace compilation.*

4. **Aturan Infrastruktur (Kong & Traefik Proxy)**: [rules/infrastructure.md](file:///opt/project5/.agents/rules/infrastructure.md)
   *Membahas: Routing Kong/Traefik, SSL termination, Keycloak local bypass, MinIO Tailscale connection.*

5. **Aturan Gaya UI & Konsistensi Tema**: [rules/styles.md](file:///opt/project5/.agents/rules/styles.md)
   *Membahas: Sistem warna global (Tailwind v4), style card, button, typografi, serta perbedaan aksen portal utama vs portal tenant.*

---

## 🧠 Pembelajaran Masalah Terselesaikan (Knowledge Base)

### Infrastruktur & Jaringan
- **MinIO Connection**: Akses menggunakan Tailscale IP `100.110.205.109:9005`. Jangan gunakan `localhost:9005`.
- **Prometheus Port go-poller**: Port scrape yang benar untuk poller metrics adalah `ftth-poller:5010` (bukan 9091).
- **Traefik Proxy poller**: Routing `/poller` di Traefik dynamic service mengarah ke internal container `http://ftth-poller:5010` (bukan host.docker.internal).

### UI Compliance — Hardcoded Color Refactoring (Juli 2026)
- **Root Cause Bug Light Mode**: Penggunaan `text-zinc-*`, `bg-zinc-*`, `text-white`, dan `bg-emerald-*` di komponen menyebabkan teks tidak terbaca dan card tetap gelap di Light Mode. Solusi: migrasi 100% ke token semantik (`text-foreground`, `bg-card`, `text-primary`, `border-border`, dsb.).
- **Cheat Sheet Migrasi**: Lihat [rules/styles.md](file:///opt/project5/.agents/rules/styles.md) Seksi 3 untuk tabel pemetaan lengkap semua class hardcoded ke token semantik.
- **Perintah Audit**: `grep -rn "text-zinc-\|bg-zinc-\|border-zinc-\|text-white\|bg-emerald-\|text-emerald-" apps/studio-admin/src --include="*.tsx" --include="*.ts" | wc -l` — Target: **0** sebelum commit.
- **globals.css Safety Net**: File `apps/studio-admin/src/app/globals.css` mengandung selektor `.light` yang memetakan kelas `zinc-*` ke nilai Light Mode sebagai fallback terakhir. Ini **bukan** pengganti migrasi komponen.
- **Scope Refactoring**: Sesi Juli 2026 berhasil memigrasi **918 pelanggaran** di 55+ file di `apps/studio-admin`. `apps/studio` (baseline tenant) tidak diubah.

### UI Compliance — Skeleton Loading Architecture (Juli 2026)
- **Pattern**: Seluruh komponen skeleton dibuat sebagai shared di `packages/ui/src/components/skeletons.tsx` — bukan hardcoded per-halaman. Setiap `loading.tsx` di route hanya menjadi thin wrapper 3 baris mengimpor dari `@k2net/ui`.
- **Komponen tersedia**: `PageHeaderSkeleton`, `DashboardPageSkeleton`, `TablePageSkeleton`, `FormPageSkeleton`, `CardGridSkeleton` — semua diekspor dari `@k2net/ui`.
- **Verifikasi coverage**: `find apps/studio-admin/src/app -name "loading.tsx" | wc -l` → harus ≥ 25.
- **Reuse**: `studio-tenant` dapat mengimpor skeleton yang sama dari `@k2net/ui` di fase berikutnya tanpa duplikasi.

### UI Compliance — TracingBeam (Juli 2026)
- **Penggunaan**: Bungkus halaman berkonten panjang (settings, compliance, password-policy) dengan `<TracingBeam className="px-4">` dari `@k2net/ui`.
- **Padding dalam**: Tambahkan `pl-4 md:pl-10` pada container dalam `<TracingBeam>` agar garis SVG beam tidak menimpa sisi kiri konten card/form.

### Docker Build & Deployment
- **Build Time**: `docker compose build --no-cache frontend-admin` memerlukan sekitar **5-6 menit** (328s pada mesin produksi). Gunakan `docker images project5-frontend-admin --format "table {{.CreatedAt}}"` untuk verifikasi image terbaru sudah terbuild.
- **Server Restart Risk**: Background task Docker build **akan terpotong** jika server restart. Selalu verifikasi timestamp image setelah deployment: jika `CreatedAt` tidak sesuai waktu build terbaru, perlu build ulang.
- **Deploy Command Urutan**: `docker compose build --no-cache frontend-admin` → `docker compose up -d frontend-admin` (jangan jalankan `up` sebelum `build` selesai).

