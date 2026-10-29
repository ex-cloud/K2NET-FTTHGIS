# FTTH GIS — K2NET Enterprise SaaS Platform Customization Context

Dokumen ini adalah repositori memori persisten dan aturan pengkodean untuk AI Agent pada proyek K2NET FTTH GIS. Aturan ini dimuat otomatis oleh IDE.

---

## 🏗️ Gambaran Arsitektur Utama

> ⚠️ **MIGRASI VITE (Sept 2026)**: `studio-admin` & `studio-tenant` adalah **React 19 + Vite 6 + TanStack Router (CSR SPA)**. Dilarang pola Next.js (SSR, API routes, `loading.tsx`). Satu-satunya Next.js adalah `apps/www` (SSG).

- **Frontend Admin**: Vite 6 CSR SPA — [apps/studio-admin](file:///opt/project5/apps/studio-admin) (port 3001)
- **Frontend Tenant**: Vite 6 CSR SPA — [apps/studio-tenant](file:///opt/project5/apps/studio-tenant) (port 3000)
- **Backend Core**: Spring Boot 3.x — [apps/api](file:///opt/project5/apps/api) (port 9090)
- **14 Go/Python Gateways**: [services/](file:///opt/project5/services/) (ports: 5001–5014)
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

## 📋 7 Aturan Inti (Core Always-On Rules — `.agents/rules/`)

Aturan deklaratif inti (*guardrails*) yang selalu dimuat otomatis:
1. [rules/frontend.md](file:///opt/project5/.agents/rules/frontend.md): Vite 6 CSR SPA, Page Guards PBAC, Form Zod, paritas `@k2net/i18n`, ukuran kontrol `size="sm"`/`size="xs"`.
2. [rules/styles.md](file:///opt/project5/.agents/rules/styles.md): Token warna monokrom semantik, dark/light theme, anti-hardcode `zinc-*`/`text-white`, Shell `@k2net/ui`.
3. [rules/backend.md](file:///opt/project5/.agents/rules/backend.md): Spring Security `@PreAuthorize`, Hibernate PostGIS (`SRID 4326`), Envers `@Audited` (`_aud`), snake_case DB mapping.
4. [rules/multi-tenant-permission-security-standard.md](file:///opt/project5/.agents/rules/multi-tenant-permission-security-standard.md): Standar hukum arsitektural otorisasi PBAC, Scope Air-Gap mutlak (0 kebocoran SYSTEM ke TENANT), algoritma presisi Seeder, SecurityConfig double-defense, dan larangan halusinasi AI.
5. [rules/microservices.md](file:///opt/project5/.agents/rules/microservices.md): Port map internal, header `X-Tenant-ID` & `X-Gateway-Token`, kompilasi `services/go.work`, non-blocking `auditclient`.
6. [rules/infrastructure.md](file:///opt/project5/.agents/rules/infrastructure.md): Routing Kong/Traefik, SSL termination, larangan hardcode IP `172.18.0.x`, MinIO Tailscale.
7. [rules/versioning-and-patching-standard.md](file:///opt/project5/.agents/rules/versioning-and-patching-standard.md): Rute `/api/v[0-9]+/`, Flyway sekuensial anti-downtime (`V1..VN`), SemVer.

---

## ⚡ 6 Skills AI Otomatisasi (On-Demand SOP & Playbooks — `.agents/skills/`)

Prosedur langkah-demi-langkah (*Progressive Disclosure*) beserta dokumentasi referensi mendalam (`references/`):
1. [skills/bug-triage-and-plan](file:///opt/project5/.agents/skills/bug-triage-and-plan/SKILL.md): SOP siklus hidup tiket bug `docs/bug/{pending,active,resolved}`, rencana aksi `docs/plans/{active,completed}`, pengarsipan otomatis, dan laporan akhir `docs/reports/`.
2. [skills/new-module-and-pbac](file:///opt/project5/.agents/skills/new-module-and-pbac/SKILL.md): SOP 6-langkah pembuatan modul/endpoint baru, Flyway SQL, registrasi 4-argumen `PermissionSeeder.java`, `@PreAuthorize`, dan `ComprehensiveControllerSecurityCoverageTest`.
3. [skills/marketplace-package-builder](file:///opt/project5/.agents/skills/marketplace-package-builder/SKILL.md): SOP 6-Pilar pembuatan paket add-on Marketplace (`platform_packages`, Envers `_aud`, pemilihan engine polyglot Java/Go/Python/Rust, dan 5 state kartu UI).
4. [skills/polyglot-gateway-service](file:///opt/project5/.agents/skills/polyglot-gateway-service/SKILL.md): SOP pengembangan & observabilitas microservice Go (`services/gateway-*`, port 5001–5014) dan Python (`gateway-ai`), `services/go.work`, Prometheus `/metrics`, dan Kong routing.
5. [skills/ui-component-and-i18n](file:///opt/project5/.agents/skills/ui-component-and-i18n/SKILL.md): SOP pembuatan halaman/komponen React, Arsitektur 2-Lapisan (`PageLayout` + `PageHero`), anatomi kontrol, Knowledge Base AI, dan paritas 100% `@k2net/i18n`.
6. [skills/anti-slop-and-hygiene](file:///opt/project5/.agents/skills/anti-slop-and-hygiene/SKILL.md): SOP Anti-AI-Slop (`knip` dead-code detector + `eslint-plugin-sonarjs` logic smell detector), Quality Gate 5-Pilar (`pnpm verify`), dan pembersihan ghost process/swap server (`scripts/cleanup.sh`).

---

## 🧠 Pembelajaran Masalah Terselesaikan (Knowledge Base)

- **MinIO Connection**: Terikat pada Tailscale IP `100.110.205.109:9005`. Dilarang `localhost:9005`.
- **Zero Hardcoded Strings (`@k2net/i18n`)**: Seluruh teks antarmuka wajib `useTranslation()` terdaftar simultan di `en/*.json` & `id/*.json`.
- **CI Security Gate**: 100% endpoint dilindungi PBAC (`ComprehensiveControllerSecurityCoverageTest`). Dilarang `isAuthenticated()`.
- **Scope Air-Gap & Anti-Leakage (`PermissionSeeder` & `SecurityConfig`)**: Role `TENANT` haram memiliki permission berscope `SYSTEM`. Seeder wajib fail-close 4-argumen (`code, name, module, scope`), perbandingan Set code equality (`currentCodes.equals(targetCodes)`), dan ingress `SecurityConfig.java` double-defense memblokir seluruh prefix berscope `SYSTEM` (`platform.*`, `support.*`, `catalog.*`, `licensing.*`, `billing.subscriptions.*`, `billing.invoices.*`, `billing.read`, `orgs.*`) dari token non-platform realm.
- **Larangan Halusinasi & Konfirmasi Improvisasi**: AI Agent DILARANG KERAS berhalusinasi atau keluar dari konteks monorepo K2NET. Segala bentuk ide perbaikan di luar tugas aktif atau improvisasi arsitektural WAJIB dikonfirmasikan terlebih dahulu ke pengguna sebelum dieksekusi.
- **Ukuran Kontrol Baku**: Toolbar & card footer wajib `size="sm"` (`h-7 px-2.5`, icon `size-3.5`). Tabel data padat wajib `size="xs"` (`h-6 px-2`, icon `size-3`).
- **Shared Layout Shell**: Sub-sidebar wajib `<SecondarySidebarHeader />` (`h-12 py-2 px-4`). Kanvas wajib `<PageLayout>` + `<PageHero>`.
