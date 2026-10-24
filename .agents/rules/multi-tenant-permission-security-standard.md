# Multi-Tenant PBAC, Scope Air-Gap & Architectural Integrity Standard

Dokumen ini mendefinisikan aturan hukum arsitektural mutlak untuk mencegah eskalasi hak akses (*privilege escalation*), kebocoran data (*data leakage*), dan halusinasi AI Agent dalam pengembangan ekosistem K2NET FTTH GIS.

---

## 🛡️ 1. Hukum Scope Air-Gap Mutlak (Absolute Invariants)

1. **Dua Alam Otorisasi Terpisah**:
   - **`SCOPE_SYSTEM`**: Hak akses platform internal K2NET (Manajemen tenant, arsitektur workspace, billing global, lisensi Ed25519, audit sistem, AI internal, observabilitas).
   - **`SCOPE_TENANT`**: Hak akses operasional internal penyewa ISP (GIS jaringan, ODP/ODC, tiket lapangan teknisi, inventaris kabel, tim internal ISP).
2. **Larangan Kontaminasi Lintas-Scope (Zero Cross-Scope Contamination)**:
   - Role dengan `scope = 'TENANT'` atau yang memiliki `organization_id IS NOT NULL` **DILARANG KERAS** memiliki permission berscope `SYSTEM`.
   - Role dengan `scope = 'SYSTEM'` (selain `super_admin`) **DILARANG KERAS** memiliki permission berscope `TENANT`.
   - Satu-satunya entitas yang memiliki hak lintas-alam secara legal adalah `super_admin` (God-Mode) dan sesi aktif **Impersonation Engine** via header bertandatangan ganda (`X-Impersonating-User` + token scoped).

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

1. **Penyaringan Ingress Non-Platform Realm**:
   Token dari realm non-platform (tenant) yang masuk ke backend Spring Boot wajib disaring dengan metode `isSystemScopedPermission(permission)`:
   - Memeriksa nilai database `permission.getScope() = 'SYSTEM'`.
   - Memeriksa fallback prefix menyeluruh: `system.*`, `platform.*`, `support.*`, `catalog.*`, `licensing.*`, `billing.subscriptions.*`, `billing.invoices.*`, `billing.read`, `orgs.*`.
2. **Drop Otomatis**:
   Setiap permission berscope `SYSTEM` yang terdeteksi pada token non-platform wajib di-drop sebelum `SimpleGrantedAuthority` dimasukkan ke dalam `SecurityContextHolder`.

---

## 🏛️ 5. Pemisahan Domain: `PLATFORM` Plane vs `OPERATIONS` Plane & IDOR Air-Gap

1. **Pemisahan Domain Endpoint**:
   - **`PLATFORM` Plane (`/api/v1/system/workspace/**`)**: Khusus inisiatif makro, PRD/Spesifikasi TipTap internal, roadmap, dan backlog engineering issue. Seluruh data terikat ke sentinel platform `00000000-0000-0000-0000-000000000001` dengan `scope = 'PLATFORM_INTERNAL'`.
   - **`OPERATIONS` Plane (`/api/v1/system/support/**`)**: Khusus tiket eskalasi B2B tenant, SLA countdown, dan Tenant 360.
2. **IDOR Air-Gap Protection**:
   Jika user meminta resource berdasarkan ID namun ID tersebut berada di luar batasan domainnya (contoh: staff support mencoba mengakses PRD arsitektur internal atau developer mengakses tiket tenant tanpa hak), sistem **WAJIB** merespons dengan **`404 Not Found`** (bukan `403 Forbidden`) untuk mencegah teknik *resource enumeration*.

---

## 🤖 6. AI RAG Boundary Server-Side Enforcement (`services/gateway-ai`)

1. **Enforcement Sisi Server**:
   Penyaringan batas data RAG wajib dieksekusi di sisi server Python FastAPI (`services/gateway-ai`), bukan mengandalkan filter frontend.
2. **Metadata `visibility_scope`**:
   Seluruh embedding vektor di PostgreSQL `pgvector` yang bertanda `visibility_scope = 'SYSTEM_INTERNAL_ONLY'` (seperti spesifikasi teknis TipTap platform) **DILARANG KERAS** dikembalikan pada query RAG jika request berasal dari tenant ISP (`X-Tenant-ID` != Sentinel Platform).

---

## 🚫 7. Larangan Halusinasi & Kewajiban Konfirmasi Improvisasi

1. **Dilarang Keras Berhalusinasi**:
   AI Agent dilarang berasumsi, mengarang nama tabel, memprediksi schema tanpa memeriksa `\d+`, atau membuat file konfigurasi fiktif. Seluruh pekerjaan harus berlandaskan file aktif di workspace dan database live `ftth_gis`.
2. **Kepatuhan Konteks Arsitektur**:
   AI Agent dilarang mengubah arsitektur monorepo (seperti mengubah SPA Vite menjadi SSR Next.js, menghapus Flyway migration lama, atau menjalankan build di server produksi).
3. **Kewajiban Konfirmasi untuk Segala Bentuk Improvisasi**:
   Jika Agent menemukan solusi alternatif yang lebih baik atau ingin melakukan perbaikan di luar cakupan tugas aktif:
   - **WAJIB** memaparkan analisis dan alasan teknis kepada pengguna terlebih dahulu.
   - **DILARANG** mengeksekusi perubahan tersebut sebelum pengguna memberikan konfirmasi eksplisit `"ya setuju"`.

---

## 🧪 8. Matriks Kepatuhan & Automated CI Testing

Setiap perubahan pada role, permission, atau controller wajib lulus pengujian:
1. `mvn test -Dtest=PermissionSecurityInvariantTest` (Invarian scope dan least-privilege).
2. `mvn test -Dtest=ComprehensiveControllerSecurityCoverageTest` (100% controller terlindungi PBAC).
3. `bash scripts/audit-security-matrix.sh` (0 baris kebocoran pada PostgreSQL live).
4. `bash scripts/audit-api-versioning.sh` (Migrasi Flyway sekuensial tanpa celah).
