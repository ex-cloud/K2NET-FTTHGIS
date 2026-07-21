# Next.js Studio Frontend Coding Rules (Split Architecture)

Halaman ini mendefinisikan aturan dan pola wajib untuk pengembangan frontend Next.js pada kedua portal yang telah dipisah:
1. **System Admin Portal (`apps/studio-admin`)** — Portal pengelola sistem utama (super_admin).
2. **Tenant Portal (`apps/studio-tenant`)** — Portal operasional untuk tenant/organisasi (org_admin, member).

---

## 🛡️ 1. Page Guards & Permission Checks

Setiap halaman baru di `apps/studio-admin` maupun `apps/studio-tenant` **wajib** dilindungi oleh Page Guard pembungkus yang sesuai dari `src/components/page-guards/` sebelum merender komponen apa pun untuk menegakkan RBAC (Role-Based Access Control).

### A. Rute System Admin (`apps/studio-admin`)
Rute pada admin portal dikonfigurasi secara langsung (tanpa prefix `/system` karena dipetakan langsung oleh subdomain):
* **`/overview` dan `/health`**:
  Gunakan `SystemOverviewWrapper` atau `SystemHealthWrapper` (`permission="orgs.view"`).
* **`/gateways/...` dan `/settings`**:
  Gunakan `GatewayPageWrapper` or `SystemSettingsWrapper` (`permission="orgs.manage"`).
* **`/users`**:
  Gunakan `UsersPageWrapper` (`permission="users.view"`).
* **`/security/...`**:
  Gunakan `SystemSecurityWrapper` (`permission="orgs.manage"`).

### B. Rute Tenant (`apps/studio-tenant`)
Rute pada tenant portal dipetakan di bawah scope organisasi dan proyek:
* **`/dashboard` dan `/team`**:
  Gunakan `OrganizationPageWrapper`.
* **`/project/[projectId]/core/...`**:
  Gunakan `ProjectPageWrapper` bersama `InfrastructurePageWrapper` / `InventoryPageWrapper` sesuai dengan data yang diakses.
* **`/settings/...`**:
  Gunakan `SettingsPageWrapper`.

---

## 📦 2. Kebijakan Monorepo & Shared UI Component (`@k2net/ui`)

* **Larangan Duplikasi Primitif**: Seluruh komponen primitif UI (seperti `Button`, `Input`, `Dialog`, `Skeleton`, `DropdownMenu`) **wajib** diimpor dari paket `@k2net/ui`. Dilarang menyalin komponen UI Shadcn baru secara lokal ke dalam direktori `components/ui/` di masing-masing aplikasi.
* **Siklus Modifikasi Komponen**: Jika komponen primitif perlu disesuaikan (misalnya menambahkan variant baru pada `Button`), modifikasi harus dilakukan langsung di `packages/ui/src/components/...` kemudian lakukan kompilasi ulang paket (`pnpm build` di root package).
* **Pemetaan Impor**: Selalu gunakan path `@k2net/ui` alih-alih import path lokal relative (`../../ui`) untuk menjaga integritas bundler Next.js.

---

## 📋 3. Validasi Form & Zod

Semua form input konfigurasi wajib menggunakan **Zod** untuk validasi skema sebelum melakukan mutation atau API calls.
* Gunakan validasi **parsial** jika hanya menyimpan field yang diubah user (`schema.partial()`).
* Kembalikan pesan error berbahasa Indonesia yang jelas melalui `toast.error()` jika validasi gagal.
* Jangan biarkan input kosong atau format tidak valid lolos ke backend.

### Skema Validasi Standard
* **Database URL**:
  ```typescript
  z.string().url("Format URL database tidak valid").startsWith("postgres://", "Database harus berupa URL PostgreSQL (postgres://)")
  ```
* **Redis Address**:
  ```typescript
  z.string().regex(/^[^:]+:\d+$/, "Format Redis Address harus host:port")
  ```
* **Port**:
  ```typescript
  z.coerce.number().int().min(1).max(65535, "Port harus antara 1-65535")
  ```

---

## 🎨 4. Estetika UI & Styling (Dynamic Brand Aware)

Aplikasi studio FTTH GIS menggunakan tema **dynamic brand-aware** bernuansa premium:
* Gunakan background dinamis (`bg-background` dan `bg-card`).
* Gunakan border tipis semi-transparan (`border-border`).
* **Larangan Emerald Hardcoded**: Dilarang keras menuliskan warna secara statis seperti `bg-emerald-500` / `text-emerald-500` untuk aksen brand. Gunakan **`bg-primary`** / **`text-primary`** agar aksen berubah menjadi biru langit secara dinamis saat menggunakan tema **Version 2 (Blue/Sky)**.
* Gunakan warna biru langit/sky (`text-sky-400`) hanya untuk data grafik/line charts non-brand.
* Elemen interaktif harus memiliki micro-animations (hover transitions, pulsing dot indicator `animate-pulse` menggunakan `var(--primary)` untuk status active).
* Gunakan ikon dari `lucide-react`.

---

## 💬 5. Notifikasi & Toast

* Gunakan `sonner` (`toast.success`, `toast.error`, `toast.info`) untuk feedback operasi.
* Jangan gunakan browser `alert()` atau console error mentah tanpa informasi di UI.

---

## 🔒 6. Isolasi Level Akses: System Plane vs Tenant Plane

* **System/Admin Portal (`apps/studio-admin`)**:
  * Hanya boleh berinteraksi dengan API global (misal: `/api/v1/system/...`).
  * Wajib memverifikasi role global `"super_admin"` menggunakan page-guards di frontend dan `@PreAuthorize("hasRole('ROLE_SUPER_ADMIN')")` di backend.
  * Melewatkan header `X-Tenant-ID` kosong atau bernilai `system` ke API Gateway Kong.
  
* **Tenant Portal (`apps/studio-tenant`)**:
  * Setiap request API **wajib** menyertakan parameter `orgId` / `projectId` yang valid pada rute.
  * Frontend wajib menyematkan header `X-Tenant-ID: <orgId>` pada setiap API call untuk diverifikasi oleh Kong.
  * Segala transaksi database, cache Redis, dan bucket MinIO di microservices Go wajib di-scope menggunakan ID Tenant yang aktif.

