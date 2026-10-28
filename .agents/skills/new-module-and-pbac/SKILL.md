---
name: new-module-and-pbac
description: >-
  Use this skill whenever creating or modifying a backend module, REST API controller,
  database migration, or PBAC permission in K2NET FTTH GIS. Guides sequential Flyway
  SQL creation, 4-argument PermissionSeeder registration with SYSTEM vs TENANT Scope
  Air-Gap, @PreAuthorize annotations, frontend sidebar/page guards, and CI security verification.
---

# SOP: Pembuatan Modul Baru, Flyway Migration & Otorisasi Granular PBAC

Gunakan prosedur ini setiap kali membuat modul baru, menambah endpoint REST API di `apps/api`, atau mendaftarkan permission baru di database `ftth_gis`.

## Referensi Lengkap
- [Standar Pembuatan Modul Baru (6-Langkah)](./references/module-creation-standard.md)
- [Hukum Multi-Tenant Permission & Scope Air-Gap](../../rules/multi-tenant-permission-security-standard.md)
- [Standar Versioning API & Flyway](../../rules/versioning-and-patching-standard.md)

---

## Alur Eksekusi Wajib (6 Langkah)

### 1. Cek Nomor Urut Flyway Terakhir & Buat Migrasi Sekuensial
- Periksa nomor tertinggi `V<N>__*.sql` di `apps/api/src/main/resources/db/migration/` dan gunakan `V<N+1>__<deskripsi_snake_case>.sql`.
- **Dilarang keras** mengedit file migrasi lama atau melompati nomor versi.
- Jika membuat tabel entitas bisnis yang menggunakan `@Audited` (Hibernate Envers), **WAJIB** menyertakan tabel `<nama_tabel>_aud` di dalam file migrasi yang sama.
- Jika mendaftarkan permission baru:
  - Deklarasikan kolom `scope` secara eksplisit (`'SYSTEM'` atau `'TENANT'`).
  - Petakan langsung ke role default (`INSERT INTO role_permissions ...`) di dalam file migrasi yang sama.
  - **Scope Air-Gap**: Role `TENANT` (`is_system_role = false`) **HARAM** menerima permission berscope `'SYSTEM'`.

### 2. Sinkronisasi `PermissionSeeder.java` (Fail-Close 4 Argumen)
- Daftarkan permission baru di [`PermissionSeeder.java`](file:///opt/project5/apps/api/src/main/java/com/company/ftthgis/config/PermissionSeeder.java) menggunakan konstruktor 4-argumen:
  ```java
  new PermissionData("system.<modul>.<aksi>", "Nama Permission", "<modul>", "SYSTEM")
  ```
- Pastikan perbandingan pencocokan menggunakan Set code equality (`currentCodes.equals(targetCodes)`).

### 3. Proteksi Endpoint Controller (`@RequestMapping("/api/v1/...")`)
- Seluruh controller wajib berada di bawah namespace `/api/v1/...`.
- Setiap method endpoint wajib memiliki `@PreAuthorize` eksplisit (dilarang `isAuthenticated()` polos):
  - **Scope SYSTEM**: `@PreAuthorize("hasAuthority('system.<modul>.<aksi>')")`
  - **Scope TENANT**: `@PreAuthorize("@tenantSecurity.hasEffectivePermission('<modul>.<aksi>')")`
  - **Mutasi Spasial/Proyek**: `@PreAuthorize("@spatialSecurityEvaluator.hasProjectPermission(#dto.projectId, 'network.manage')")`

### 4. Integrasi Sidebar & Page Guard Frontend
- Daftarkan item navigasi di `apps/studio-admin/src/config/system-sidebar-navigation.ts` (atau navigasi tenant) dengan properti `permission`.
- Bungkus halaman dengan Page Guard / `<PermissionGuard>` dan tombol mutasi dengan `<PermissionGuard permission="...">`.

### 5. Verifikasi CI Security Gate & Versioning
Jalankan perintah verifikasi wajib berikut:
```bash
pnpm audit:versioning
mvn test -Dtest=ComprehensiveControllerSecurityCoverageTest -f apps/api/pom.xml
pnpm audit:security
```

