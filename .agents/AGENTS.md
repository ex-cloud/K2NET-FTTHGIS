# FTTH GIS — K2NET Enterprise SaaS Platform Customization Context

Dokumen ini adalah repositori memori persisten dan aturan pengkodean untuk AI Agent pada proyek K2NET FTTH GIS. Aturan ini dimuat otomatis oleh IDE.

---

## 🏗️ Gambaran Arsitektur Utama

> ⚠️ **MIGRASI VITE (Sept 2026)**: `studio-admin` & `studio-tenant` adalah **React 19 + Vite 6 + TanStack Router (CSR SPA)**. Dilarang pola Next.js (SSR, API routes, `loading.tsx`). Satu-satunya Next.js adalah `apps/www` (SSG).

- **Frontend Admin**: Vite 6 CSR SPA — [apps/studio-admin](file:///opt/project5/apps/studio-admin) (port 3001)
- **Frontend Tenant**: Vite 6 CSR SPA — [apps/studio-tenant](file:///opt/project5/apps/studio-tenant) (port 3000)
- **Backend Core**: Spring Boot 3.x — [apps/api](file:///opt/project5/apps/api) (port 9090)
- **13 Go/Python Gateways**: [services/](file:///opt/project5/services/) (ports: 5001–5013)
- **Gateway & Proxy**: Kong (port 8000), Traefik (port 80/443)
- **Identity & DB**: Keycloak 26 (port 8081), PostgreSQL 17 (`ftth_gis`), MinIO S3 (`:9005`), Redis

---

## 🔒 Otentikasi, Granular PBAC & Super Admin
- **Role Kanonikal**: Super Admin `"super_admin"` lowercase tanpa prefix `role_`.
- **Anotasi Backend**: SYSTEM scope `@PreAuthorize("hasAuthority('system.<modul>.<aksi>')")`; TENANT scope `@PreAuthorize("@tenantSecurity.hasEffectivePermission('<modul>.<aksi>')")`. Dilarang role semu `hasRole('authenticated')`.
- **Scope Isolation**: Super Admin mengelola konfigurasi platform. Akses operasional tenant WAJIB via **Impersonation Engine** (Step-Up MFA, 30 min, dual-identity audit trail).
- **L2 Cache Eviction**: Permission baru didukung Flyway SQL, cache L2 di-refresh startup via `PermissionSeeder.java`.

---

## 🧪 Pre-Deployment Checklist & Larangan Build Server

> 🛑 **ATURAN MUTLAK**: Dilarang keras `docker compose build` di server produksi (risiko OOM crash). Docker build hanya berjalan di GitHub Actions Runner.

| Modul | Perintah Verifikasi Wajib |
|---|---|
| **Frontend Admin & Tenant** | `npx tsc --noEmit` · `pnpm verify:admin` · `pnpm audit:colors` · `pnpm audit:design-system` |
| **Backend Spring Boot** | `mvn clean test` · `mvn test-compile -q` · `pnpm audit:versioning` |
| **Go & Gateways** | `bash scripts/verify-all.sh gateways` (`go vet ./...` & `go test ./...`) |
| **Infra & Config** | `docker compose config -q` · `kong config parse docker/kong/kong.yml` |

*Alur Deploy*: Push `main` → GitHub Actions compile Docker & push ke `ghcr.io` → SSH runner pull image terbaru (`docker compose up -d --no-build`). Jika SSH mati, jalankan `bash scripts/deploy.sh production frontend-admin` dari server setelah login `ghcr.io`.

---

## 🌐 Aturan Jaringan & Docker IP
1. **Dilarang Hardcode IP Internal (`172.18.0.x`)**: Wajib hostname (`http://backend:9090`, `http://ftth-postgres:5432`, `http://ftth-poller:5010`).
2. **CIDR Subnet**: Whitelist Kong wajib format CIDR `172.18.0.0/16`.
3. **Tailscale IP**: `100.110.205.109:9005` khusus untuk akses MinIO S3 backup offsite.

---

## 📋 Aturan Pengkodean per Bagian (Coding Rules)

1. [rules/frontend.md](file:///opt/project5/.agents/rules/frontend.md): Page Guards PBAC, Form Zod, styling dark mode, Plane isolation, Log Explorer.
2. [rules/frontend-advanced.md](file:///opt/project5/.agents/rules/frontend-advanced.md): Linear Task Management, Responsif, Tooltip, Context Menu, KPI Glow, Three.js, i18n, Anatomi Kontrol.
3. [rules/backend.md](file:///opt/project5/.agents/rules/backend.md): Spring Security `@PreAuthorize`, Hibernate PostGIS, snake_case DB mapping.
4. [rules/microservices.md](file:///opt/project5/.agents/rules/microservices.md): Port map internal, header `X-Tenant-ID`, `go.work` compilation.
5. [rules/infrastructure.md](file:///opt/project5/.agents/rules/infrastructure.md): Routing Kong/Traefik, SSL termination, Keycloak bypass, MinIO Tailscale.
6. [rules/styles.md](file:///opt/project5/.agents/rules/styles.md): Token warna monokrom, dark/light theme, anti-hardcode `zinc-*`/`text-white`.
7. [rules/styles-components.md](file:///opt/project5/.agents/rules/styles-components.md): Form inputs, badges, switchers, Skeleton CSR, Dynamic Theme, Tooltip, Context Menu.
8. [rules/ui-layout-architecture.md](file:///opt/project5/.agents/rules/ui-layout-architecture.md): Arsitektur 2-lapisan (Shell vs Canvas `<Outlet />`), `PageLayout`, `PageHero`.
9. [rules/ai-knowledge.md](file:///opt/project5/.agents/rules/ai-knowledge.md): Taksonomi 6 kategori pengetahuan, 500 token chunking, tenant isolation.
10. [rules/service-audit-standards.md](file:///opt/project5/.agents/rules/service-audit-standards.md): Matriks Quality Gate 5 pilar & `pnpm verify`.
11. [rules/module-creation-standard.md](file:///opt/project5/.agents/rules/module-creation-standard.md): Alur 5-langkah modul baru, Flyway SQL, `@PreAuthorize`, sidebar filtering.
12. [rules/versioning-and-patching-standard.md](file:///opt/project5/.agents/rules/versioning-and-patching-standard.md): Rute `/api/v[0-9]+/`, Flyway sekuensial anti-downtime, SemVer.
13. [rules/dev-history-observability.md](file:///opt/project5/.agents/rules/dev-history-observability.md): Riwayat audit 10 modul observabilitas, Prometheus, OLT Poller, Storage.
14. [rules/dev-history-platform.md](file:///opt/project5/.agents/rules/dev-history-platform.md): Riwayat Linear task management, TipTap, AI assistant, PBAC CI gate.
15. [rules/marketplace-package-standard.md](file:///opt/project5/.agents/rules/marketplace-package-standard.md): Standar 6-Pilar pembuatan paket marketplace, pola audit Envers Flyway, dan evaluasi kartu UI.
16. [rules/marketplace-engines.md](file:///opt/project5/.agents/rules/marketplace-engines.md): Panduan pemilihan bahasa engine polyglot (Java, Go, Python, Rust) & pemetaan port 12 paket resmi.

---

## 🧠 Pembelajaran Masalah Terselesaikan (Knowledge Base)

- **MinIO Connection**: Terikat pada Tailscale IP `100.110.205.109:9005`. Dilarang `localhost:9005`.
- **Zero Hardcoded Strings (`@k2net/i18n`)**: Seluruh teks antarmuka wajib `useTranslation()` terdaftar simultan di `en/*.json` & `id/*.json`.
- **CI Security Gate**: 100% endpoint dilindungi PBAC (`ComprehensiveControllerSecurityCoverageTest`). Dilarang `isAuthenticated()`.
- **Ukuran Kontrol Baku**: Toolbar & card footer wajib `size="sm"` (`h-7 px-2.5`, icon `size-3.5`). Tabel data padat wajib `size="xs"` (`h-6 px-2`, icon `size-3`).
- **Shared Layout Shell**: Sub-sidebar wajib `<SecondarySidebarHeader />` (`h-12 py-2 px-4`). Kanvas wajib `<PageLayout>` + `<PageHero>`.
