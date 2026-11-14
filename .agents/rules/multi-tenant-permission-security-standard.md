# Multi-Tenant PBAC, Scope Air-Gap & Architectural Integrity Standard

Dokumen ini mendefinisikan aturan hukum arsitektural mutlak untuk mencegah eskalasi hak akses (*privilege escalation*), kebocoran data (*data leakage*), dan halusinasi AI Agent dalam pengembangan ekosistem K2NET FTTH GIS.

---

## 🛡️ 1. Hukum Scope Air-Gap Mutlak & 11 Role Template Kanonikal (Absolute Invariants)

1. **Dua Alam Otorisasi Terpisah**:
   - **`SCOPE_SYSTEM`**: Hak akses platform internal K2NET (Manajemen tenant, arsitektur workspace, billing global, lisensi Ed25519, audit sistem, AI internal, observabilitas).
   - **`SCOPE_TENANT`**: Hak akses operasional internal penyewa ISP (GIS jaringan, ODP/ODC, tiket lapangan teknisi, inventaris kabel, tim internal ISP).
2. **Larangan Kontaminasi Lintas-Scope (Zero Cross-Scope Contamination)**:
   - Role dengan `scope = 'TENANT'` atau yang memiliki `organization_id IS NOT NULL` **DILARANG KERAS** memiliki permission berscope `SYSTEM`.
   - Role dengan `scope = 'SYSTEM'` (selain `super_admin`) **DILARANG KERAS** memiliki permission berscope `TENANT`.
   - Satu-satunya entitas yang memiliki hak lintas-alam secara legal adalah `super_admin` (God-Mode) dan sesi aktif **Impersonation Engine** via header bertandatangan ganda (`X-Impersonating-User` + token scoped).
3. **11 Role Template Kanonikal (`ftth_gis.roles` & `keycloak_db.keycloak_role` — V78)**:
   - **4 Role `SYSTEM` (`ftth-realm`)**: `super_admin`, `account_manager`, `system_auditor`, `system_support`.
   - **7 Role `TENANT` (`k2net-tenants`)**: `admin`, `viewer`, `technician`, `finance`, `helpdesk`, `noc`, `surveyor`.
   - Dilarang keras menambahkan kembali role pra-V78 (`tenant_owner`, `tenant_admin`, `network_engineer`, `noc_operator`, `field_technician`, `billing_staff`, `warehouse`) ke dalam `keycloak_db` maupun kode sumber.
4. **Arsitektur 3-Plane Domain & 6 Komponen Shared Error (`@k2net/ui`)**:
   - **Control Plane (`https://system-gis.kdua.net`)**: Rute login khusus `/auth/console/login` (rute `/login` merender 404 `<NotFoundError />`).
   - **K2NET Operational FTTH Workspace (`https://ops.kdua.net`)**: Diidentifikasi dengan atribut semantik `is_platform_root = true` (`realm_key = 'k2net-tenants'`, seluruh 21 paket marketplace aktif permanen; dilarang hardcode string `"default"`).
   - **Tenant ISP Plane (`https://<slug>.kdua.net`)**: Subdomain yang tidak terdaftar di database merender 404 `<TenantDomainError />` (form login dikunci penuh).
   - **6 Komponen Shared Error (`@k2net/ui`)**: `<NotFoundError />` (404), `<TenantDomainError />` (404 Unregistered Subdomain), `<ForbiddenError />` (403), `<SessionExpiredError />` (419 Sesi Kedaluwarsa / Login Perangkat Lain), `<ServerError />` (500/502), dan `<MaintenanceMode />` (503).

---

## 🏷️ 2. Standar Deklarasi Permission (Fail-Close Pattern)

1. **Konstruktor Wajib 4-Argumen di `PermissionSeeder.java`**:
   Setiap deklarasi permission baru pada `PermissionSeeder.java` wajib menyertakan 4 parameter eksplisit:
   ```java
   new PermissionData(code, name, module, scope)
   ```
   **DILARANG KERAS** membuat atau mengembalikan konstruktor 3-argumen dengan scope default implisit (*fail-open anti-pattern*).
2. **Kamus Modul Berbagi Nama (Shared-Name Modules)**:
   Modul yang memiliki nama sama namun beda scope wajib dipetakan secara presisi dan dilarang disaring hanya dengan prefix string pendek:
   - **Tenant Billing**: `billing.view`, `billing.manage` (Scope: `TENANT`).
   - **Platform Billing**: `billing.read`, `billing.subscriptions.*`, `billing.invoices.*` (Scope: `SYSTEM`).
   - **Organizations**: `organizations.view`, `organizations.update`, `organizations.create`, `organizations.delete` (Scope: `TENANT`); sedangkan `system.organizations.*` dan legacy alias `orgs.view`, `orgs.manage` (Scope: `SYSTEM`).
   - **Workspace vs Proyek**: `platform.workspace.*`, `platform.issues.*` (Scope: `SYSTEM`); sedangkan `projects.*`, `network.*` (Scope: `TENANT`).

---

## ⚙️ 3. Algoritma Sinkronisasi Seeder (`PermissionSeeder.java`)

1. **Air-Gap Scope Guard Wajib**:
   Sebelum mencocokkan pola string permission ke sebuah role, seeder wajib melakukan evaluasi scope terlebih dahulu:
   ```java
   if (!isSuperAdmin && !roleScope.equalsIgnoreCase(p.getScope())) {
       continue;
   }
   ```
2. **Pola Pencocokan Presisi (Anti-Greedy Matching)**:
   - **Exact match**: `p.getCode().equals(pattern)`
   - **Prefix wildcard**: `pattern.endsWith(".") && p.getCode().startsWith(pattern)` (contoh: `"platform."` hanya cocok dengan yang berawalan `"platform."`)
   - **Suffix wildcard**: `pattern.startsWith(".") && p.getCode().endsWith(pattern)` (contoh: `".view"` hanya mencocokkan permission yang berakhiran `".view"` **DAN** memiliki scope yang sama dengan role).
3. **Perbandingan Set Equality Berbasis Kode**:
   DILARANG membandingkan jumlah elemen (`.size() != targetPermissions.size()`). Seeder wajib membandingkan kesamaan himpunan kode permission:
   ```java
   currentCodes.equals(targetCodes)
   ```
4. **Post-Mutation Hibernate L2 Cache Eviction**:
   Setelah mutasi database permission dan role selesai dijalankan pada saat startup, seeder wajib membersihkan Hibernate L2 Cache:
   ```java
   entityManagerFactory.getCache().evictAll();
   ```

---

## 🔒 4. Pertahanan Berlapis Ingress Token (`SecurityConfig.java`)

1. **Penyaringan Ingress Platform Realm (`ftth-realm`)**:
   Resolusi nama role dari token `ftth-realm` wajib difilter dengan `.filter(r -> "SYSTEM".equalsIgnoreCase(r.getScope()))` agar tidak pernah memetakan ke role `TENANT`.
2. **Penyaringan Ingress Non-Platform Realm (`k2net-tenants`)**:
   Token dari realm non-platform (tenant) yang masuk ke backend Spring Boot wajib disaring dengan metode `isSystemScopedPermission(permission)`:
   - Memeriksa nilai database `permission.getScope() = 'SYSTEM'`.
   - Memeriksa fallback prefix menyeluruh: `system.*`, `platform.*`, `support.*`, `catalog.*`, `licensing.*`, `billing.subscriptions.*`, `billing.invoices.*`, `billing.read`, `orgs.*`.
3. **Drop Otomatis**:
   Setiap permission berscope `SYSTEM` yang terdeteksi pada token non-platform wajib di-drop sebelum `SimpleGrantedAuthority` dimasukkan ke dalam `SecurityContextHolder`.
4. **PostgreSQL `organization_members` sebagai Single Source of Truth (Anti-Race Condition)**:
   - Untuk token non-platform (`k2net-tenants`), `KeycloakRoleConverter` wajib membaca role otoritatif dari tabel `organization_members` (untuk organisasi aktif) dan fallback ke `users.role` sebagai **Single Source of Truth**. Hal ini mencegah `Final Mapped Authorities: []` dan kondisi balapan (*race condition*) ketika Admin Tenant mengubah role atau permission anggota secara real-time sebelum JWT Keycloak kedaluwarsa.
   - `UserSyncService.relinkExistingUserToKeycloakId` **DILARANG KERAS** memanggil `userRepository.delete(user)` secara mentah tanpa memulihkan relasi `organization_members` dan `project_members`.
5. **Prinsip Strict Least-Privilege untuk Role `viewer` & Custom Roles Tenant**:
   - Role `viewer` **DILARANG KERAS** di-seed menggunakan wildcard `.view`. Role `viewer` hanya boleh memiliki tepat 7 permission operasional baca-saja (`dashboard.view`, `projects.view`, `map.view`, `zones.view`, `coverage.view`, `network.view`, `inventory.view`) dan haram memiliki `billing.view`, `audit.view`, `team.view`, `members.view`, `users.view`, `roles.view`, `security.policy.view`, `security.sso.view`, atau `organizations.view`.
   - Admin Tenant (`roles.manage` / `roles.update`) diizinkan membuat **Custom Role Tenant** (`is_system_role = false`, `scope = 'TENANT'`, `organization_id = <tenant_uuid>`) atau menyesuaikan permission role di organisasi mereka melalui endpoint `/api/v1/roles`, dan seluruh komponen navigasi (`TenantOrgSidebar`, `TenantProjectSidebar`, `TenantSecondarySidebar`, `TenantCommandPalette`, `TenantUserNav`, `PageGuard`) wajib tersinkronisasi dinamis dengan `usePermissions().canAccess(...)`.

---

## 🌐 5. Pemisahan Batasan Social Login (All Tiers) vs Enterprise Corporate SSO (Enterprise Plan) & Invite-First Governance

1. **Social Login (Google & GitHub) Bukanlah SSO Korporat**:
   - Google & GitHub berfungsi murni sebagai **Verified Email Authentication Bridge** (Pola Cloudflare/Supabase).
   - Pengaturan `Allow social login` terletak di **`/settings/security`** (`tenant_security_policies.allow_social_login`) dan terbuka untuk **SEMUA PAKET / SUBSCRIPTION TIERS** (`FREE`, `STARTER`, `PRO`, `ENTERPRISE`).
   - Tenant Admin bebas mengaktifkan/menonaktifkan login sosial tanpa memerlukan add-on marketplace berbayar.
2. **Enterprise Corporate SSO Terikat Batasan Lisensi / Plan**:
   - Federasi SAML 2.0, Microsoft Entra ID, Okta, Custom OIDC, Domain-Based Home Realm Discovery (HRD), dan JIT Auto-Provisioning **HANYA BERLAKU UNTUK PAKET ENTERPRISE** (atau Add-on Marketplace `enterprise_sso`).
   - Dikonfigurasi terpisah secara eksklusif di **`/settings/sso`**, dilindungi PBAC `@tenantSecurity.hasEffectivePermission('org.sso.manage')` dan runtime license entitlement check.
3. **Invite-First Multi-Tenant Governance Mutlak**:
   - Login sosial (Google/GitHub) **TIDAK MENGIZINKAN** self-registration publik di portal tenant.
   - Pintu gerbang utama `gateway-auth` (`/api/v1/auth/sso-exchange`) memvalidasi 7 gerbang sekuensial: jika email pengguna tidak terdaftar di tabel `organization_members` dengan status `ACTIVE` atau `INVITED` yang valid, sistem **WAJIB menolak dengan `403 TENANT_ACCESS_DENIED` dan mencabut sesi Keycloak**.
   - Flow Keycloak `social-invite-first broker login` menyetel `Create User If Unique` ke `DISABLED` untuk menjamin tidak ada akun orphan Keycloak liar tanpa baris di database PostgreSQL.

---

## 🏛️ 6. Pemisahan Domain: `PLATFORM` Plane vs `OPERATIONS` Plane & IDOR Air-Gap

1. **Pemisahan Domain Endpoint**:
   - **`PLATFORM` Plane (`/api/v1/system/workspace/**`)**: Khusus inisiatif makro, PRD/Spesifikasi TipTap internal, roadmap, dan backlog engineering issue. Seluruh data terikat ke sentinel platform `00000000-0000-0000-0000-000000000001` dengan `scope = 'PLATFORM_INTERNAL'`.
   - **`OPERATIONS` Plane (`/api/v1/system/support/**`)**: Khusus tiket eskalasi B2B tenant, SLA countdown, dan Tenant 360.
2. **IDOR Air-Gap Protection**:
   Jika user meminta resource berdasarkan ID namun ID tersebut berada di luar batasan domainnya (contoh: staff support mencoba mengakses PRD arsitektur internal atau developer mengakses tiket tenant tanpa hak), sistem **WAJIB** merespons dengan **`404 Not Found`** (bukan `403 Forbidden`) untuk mencegah teknik *resource enumeration*.

---

## 🤖 7. AI RAG Boundary Server-Side Enforcement (`services/gateway-ai`)

1. **Enforcement Sisi Server**:
   Penyaringan batas data RAG wajib dieksekusi di sisi server Python FastAPI (`services/gateway-ai`), bukan mengandalkan filter frontend.
2. **Metadata `visibility_scope`**:
   Seluruh embedding vektor di PostgreSQL `pgvector` yang bertanda `visibility_scope = 'SYSTEM_INTERNAL_ONLY'` (seperti spesifikasi teknis TipTap platform) **DILARANG KERAS** dikembalikan pada query RAG jika request berasal dari tenant ISP (`X-Tenant-ID` != Sentinel Platform).

---

## 🚫 8. Larangan Halusinasi & Kewajiban Konfirmasi Improvisasi

1. **Dilarang Keras Berhalusinasi**:
   AI Agent dilarang berasumsi, mengarang nama tabel, memprediksi schema tanpa memeriksa `\d+`, atau membuat file konfigurasi fiktif. Seluruh pekerjaan harus berlandaskan file aktif di workspace dan database live `ftth_gis`.
2. **Kepatuhan Konteks Arsitektur**:
   AI Agent dilarang mengubah arsitektur monorepo (seperti mengubah SPA Vite menjadi SSR Next.js, menghapus Flyway migration lama, atau menjalankan build di server produksi).
3. **Kewajiban Konfirmasi untuk Segala Bentuk Improvisasi**:
   Jika Agent menemukan solusi alternatif yang lebih baik atau ingin melakukan perbaikan di luar cakupan tugas aktif:
   - **WAJIB** memaparkan analisis dan alasan teknis kepada pengguna terlebih dahulu.
   - **DILARANG** mengeksekusi perubahan tersebut sebelum pengguna memberikan konfirmasi eksplisit `"ya setuju"`.

---

## 🧪 9. Matriks Kepatuhan & Automated CI Testing

Setiap perubahan pada role, permission, atau controller wajib lulus pengujian:
1. `mvn test -Dtest=PermissionSecurityInvariantTest` (Invarian scope dan least-privilege).
2. `mvn test -Dtest=ComprehensiveControllerSecurityCoverageTest` (100% controller terlindungi PBAC).
3. `bash scripts/audit-security-matrix.sh` (0 baris kebocoran pada PostgreSQL live).
4. `bash scripts/audit-api-versioning.sh` (Migrasi Flyway sekuensial tanpa celah).
