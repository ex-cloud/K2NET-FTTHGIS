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

---

## 📐 7. Standardisasi PageLayout: Varian Workspace vs Dashboard

Seluruh halaman baru **wajib** menggunakan komponen `<PageLayout>` dari `@k2net/ui` dengan pemilihan `variant` yang ketat berdasarkan keberadaan navigasi sekunder (*Secondary Sidebar*):

### A. Workspace Variant (`<PageLayout variant="workspace">`) — WAJIB UNTUK HALAMAN SUB-MENU
* **Penggunaan Wajib**: Digunakan untuk **seluruh halaman yang memiliki sub-menu / Secondary Sidebar 240px** (`SYSTEM_SIDEBAR_NAVIGATION`), yaitu rute:
  * `/settings/*` (`/settings/general`, `/settings/gis-spatial`, `/settings/branding`, `/settings/security`, `/settings/audit-logs`, `/settings/smtp-mail`)
  * `/users/*` (`/users`, `/users/roles`, `/users/sessions`)
  * `/security/*` (`/security/roles`, `/security/permissions`, `/security/auth`, `/security/sso`, `/security/audit`, `/security/alerts`, `/security/password-policy`, `/security/compliance`)
  * `/gateways/*` (`/gateways/overview`, `/gateways/notification`, `/gateways/payment`, `/gateways/map`, `/gateways/storage`, dll.)
  * `/observability/*` (apabila menggunakan sub-menu navigasi sekunder)
* **Perilaku Scroll**: Menggunakan `overflow-y-auto` pada kontainer konten dalam agar seluruh konten form/tabel yang panjang **dapat di-scroll vertikal 100% lancar** tanpa terpotong (*clipped*).

### B. Dashboard Variant (`<PageLayout variant="dashboard">`) — WAJIB UNTUK HALAMAN MANDIRI
* **Penggunaan Wajib**: Digunakan **hanya untuk halaman mandiri (standalone)** yang TIDAK memiliki sub-menu / Secondary Sidebar, yaitu rute:
  * `/overview`
  * `/organizations`
  * `/health`
* **Perilaku Scroll**: Menggunakan `overflow-y-auto` pada kanvas utama dengan margin terpusat `max-w-[95rem]` (`.page-layout-container`).

### C. Kebijakan Komponen TracingBeam (Anti-Inkonsistensi Layout)
* **Dilarang Gunakan pada Form Standar**: Komponen `TracingBeam` **dilarang keras** dipasang pada halaman form standar (termasuk seluruh rute `/settings/*`).
* **Penggunaan Terbatas**: `TracingBeam` hanya digunakan khusus untuk halaman dokumentasi bertingkat panjang, log audit timeline, atau wizard pendaftaran multi-step agar estetika antarmuka tetap bersih dan konsisten dengan rute workspace lainnya.

---

## 📊 8. Standardisasi Global Log Explorer & Audit Grouping

Setiap kali melakukan pembaruan atau penambahan visualisasi pada Global Log Explorer (`apps/studio-admin/src/app/(dashboard)/logs/page.tsx`):
* **Klasifikasi Log (`LOG_GROUPS`)**: Seluruh tipe log baru wajib dikelompokkan secara visual menggunakan model `LOG_GROUPS` yang membaginya menjadi 4 kategori:
  - `CORE`: Infrastruktur utama, otentikasi (Keycloak), routing API (Kong). Warna: Violet (`text-violet-400`).
  - `OPERATIONS`: Alur proses bisnis (pembayaran, scheduler, storage, user management). Warna: Sky (`text-sky-400`).
  - `NETWORK`: Perangkat keras jaringan dan pemetaan (OLT, ONT provisioning, poller). Warna: Emerald (`text-emerald-400`).
  - `MESSAGING`: Komunikasi eksternal (WhatsApp, SMS, Email). Warna: Amber (`text-amber-400`).
* **Multi-Tenancy Isolation**:
  - Halaman log wajib menyediakan input filter `tenantSlug` (hanya aktif untuk Super Admin). Filter ini secara default kosong (menampilkan seluruh tenant) dan dapat difilter secara spesifik per tenant.
  - Untuk non-Super Admin, filter `tenantSlug` diset otomatis ke tenant pengguna dan input filter disembunyikan.
* **Informasi Tambahan Detail Drawer**:
  - Detail drawer log wajib menampilkan parameter `tenantSlug`, `serviceSource` (container asal), dan `logGroup` secara rapi dan terformat.

---

## 🎯 9. Standardisasi Modul Task Management & Linear App Mental Model

Seluruh pengembangan modul manajemen tugas (*Task Management / Issue Tracker*) pada `apps/studio-admin` maupun `apps/studio-tenant` **wajib** mengikuti hierarki dan pola interaksi **Linear App (`linear.app`)**:

### A. Hierarki Entitas (Projects vs Issues)
* **Workspace**: Ruang kerja organisasi K2NET (`PLATFORM_INTERNAL` untuk Studio Admin, `TENANT_INTERNAL` untuk Studio Tenant).
* **Projects (Inisiatif / Plan Besar)**: Entitas payung untuk rencana kerja skala besar (contoh: *"Rancang Bangun FTTH Garut"*, *"Migrasi OLT Cluster Bandung"*, *"Website CMS"*). Memiliki target date, progress percentage, dan health status.
* **Issues / Tasks / Tickets (Unit Kerja Terkecil)**:
  * `type: "PROJECT"` (Pekerjaan bagian dari project plan)
  * `type: "TICKET"` (Tiket gangguan / permintaan bantuan B2B tenant)
  * `parent_task_id` (Relasi anak tugas / *Sub-issue*)
  * `obsidian_ref` (ID referensi unik / Obsidian vault sync)
  * `labels` (Tag kategori: `Bug`, `GIS Spasial`, `Fiber Routing`, `FO Cut`, dll.)

### B. Floating Pill Modal "New Issue" (`NewTaskDialog`)
Dialog pembuatan tugas **dilarang** menggunakan form bertingkat panjang. Wajib menggunakan floating window minimalis dengan **Pill Button Bar** di bagian bawah:
1. **Title & Description Canvas**: Input judul borderless besar + textarea deskripsi auto-resize.
2. **Pill Buttons Row**:
   * `[⭕ Status Pill]` — Backlog, Todo, In Progress, In Review, Done, Canceled
   * `[🔴 Priority Pill]` — Urgent, High, Normal, Low
   * `[👤 Assignee Pill]` — Dropdown anggota tim
   * `[📁 Project Pill]` — Dropdown pilihan project aktif atau *"No project"*
   * `[🏷️ Labels Pill]` — Checklist tag kategori
3. **Footer Actions**: Tombol lampiran `📎`, switch toggle `Create more`, dan tombol submit `Create Issue`.

### C. Full-Page & Side-Sheet Task Canvas (`/tasks/[id]` & `TaskDetailSheet`)
* **Header Bar**: Breadcrumb navigasi `Projects › [Project Name] › [Task Ref]` + tombol aksi full-page / close.
* **Left Canvas**:
  * Title inline-editable + Emoji icon trigger (`😀`).
  * Description markdown textarea dengan auto-save debounced (1.5 detik).
  * **Sub-issues Section**: Kotak daftar sub-tasks + tombol `+ Add sub-issues` (otomatis terikat ke parent task).
  * **Activity & Comments**: Linimasa riwayat status + kotak komentar dengan shortcut `Ctrl+Enter`, tombol lampiran file, dan emoji.
* **Right Properties Sidebar (w-72)**:
  * Status, Priority, Assignee, Due Date (semua inline dropdown editable).
  * Labels chip manager.
  * Project link badge (menampilkan nama project terkait dan tautan langsung).

### D. Pola Bounded Scroll Table (Query-Performance Pattern)
* **Root Container**: Return root `div` langsung dengan `flex flex-col w-full h-full bg-background overflow-hidden` (jangan bungkus dengan `<PageLayout>` jika ingin layout fixed viewport).
* **Inner Card Wrapper**: `border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col`.
* **Sticky Toolbar**: Ditempatkan di bagian atas card wrapper.
* **Scroll Area**: `div.flex-1.min-h-0.overflow-auto.custom-scrollbar-thin` — scroll hanya terjadi di dalam tabel data, bukan seluruh halaman.
* **Infinite Scroll**: Wajib menggunakan `IntersectionObserver` pada sentinel di bawah tabel dengan page size default `20`.

---

## 📱 10. Standar Desain Responsif Multi-Perangkat (Mobile, Tablet, Desktop, Ultra-Wide)

Setiap halaman dan komponen di `apps/studio-admin` maupun `apps/studio-tenant` **wajib** responsif dan nyaman dioperasikan di seluruh resolusi layar:

### A. Breakpoints Baku (Tailwind CSS Scale)
| Breakpoint | Resolusi Layar | Target Perangkat | Aturan Layout & Penataan |
| :--- | :--- | :--- | :--- |
| **Mobile (`< 768px`)** | Smartphone (360px – 430px) | iPhone, Android phone | - Sidebar otomatis tersembunyi (*off-canvas / drawer*).<br>- Padding halaman: `px-3.5 py-4` (hemat ruang).<br>- Form & Card: 1-kolom tumpuk vertikal (`grid-cols-1`).<br>- Tabel data: Pembungkus `overflow-x-auto custom-scrollbar` dengan *touch drag*.<br>- Target sentuh tombol: Minimal tinggi `h-9` / `h-10` ($36\text{px} - 40\text{px}$) agar mudah ditekan jari. |
| **Tablet (`768px - 1023px`)** | Tablet Portrait/Landscape (768px – 1024px) | iPad, Samsung Galaxy Tab | - Main Sidebar icon-only (50px), Secondary Sidebar dapat di-collapse (*toggle button*).<br>- Padding: `px-4 md:px-6`.<br>- Grid form: 2-kolom seimbang (`md:grid-cols-2`).<br>- Tabel data: Menampilkan kolom prioritas dengan responsivitas lebar proporsional. |
| **Desktop / Laptop (`1024px - 1439px`)** | Laptop & Monitor Kantor (1280px – 1440px) | MacBook, ThinkPad, 1080p | - Main Sidebar (50px / 200px hover) + Secondary Sidebar (240px).<br>- Layout Form: **2-Kolom Master-Detail (`lg:grid-cols-12` -> `lg:col-span-7` editor + `lg:col-span-5` info guide)**.<br>- Tabel data: Lebar penuh dengan kolom dinamis `minmax(320px, 1fr)`. |
| **Ultra-Wide (`≥ 1440px / 1920px`)** | Monitor Lebar / Display NOC (1920px – 4K) | Monitor 24"-34", TV NOC | - Kontainer utama merenggang elastis (*1fr dynamic stretch*) atau dibatasi secara anggun (`max-w-[95rem]` / `max-w-6xl` terpusat).<br>- **Dilarang Celah Kosong**: Seluruh tabel wajib memanfaatkan 100% lebar kanvas (`minmax(320px, 1fr)`) sehingga tidak menyisakan ruang kosong hitam (*black void*) di sisi kanan. |

### B. Aturan Khusus Komponen Visual & Interaktif
1. **Interactive 2D Canvas (Obsidian Graph)**:
   - Wajib menangani event mouse (*click, pan, wheel zoom*) serta *touch gestures* di layar sentuh mobile/tablet.
   - Toolbar zoom/pan diposisikan mengambang (*floating*) di sudut kanan atas agar mudah dijangkau jari.
2. **Solid Sticky Headers**:
   - Header tabel wajib menggunakan solid 100% opaque (`bg-card` atau `bg-background`) dengan `z-20` agar baris data di bawahnya tidak tembus pandang di semua perangkat.
3. **Form Segmented Switcher & Pill Tabs**:
   - Wajib menggunakan `overflow-x-auto` dan `whitespace-nowrap` pada tab bar agar tidak patah/terpotong di layar smartphone sempit.

---

## 🎯 11. Standar Wajib Tooltip Global (Linear-Style Tooltip Pattern)

Seluruh tombol aksi (terutama *icon-only buttons*, tombol toolbar, dan shortcut actions) di `apps/studio-admin` dan `apps/studio-tenant` **WAJIB** dibungkus dengan komponen `<ActionTooltip>` atau `<TooltipContent>` dari `@k2net/ui`.

### A. Aturan Visual & Perilaku Tooltip:
1. **Zero Arrow (Bebas Panah/Segitiga Putih)**:
   - Tooltip dilarang menampilkan panah segitiga putih default (`showArrow=false`).
   - Tampilan visual wajib menggunakan kapsul gelap (*dark pill*) minimalis: `bg-popover text-popover-foreground border border-border shadow-xl rounded-lg px-2.5 py-1 text-[11px] font-medium tracking-tight`.
2. **Badge Shortcut Keyboard Dinamis (`shortcut`)**:
   - Jika tombol memiliki shortcut keyboard bawaan, properti `shortcut` **wajib** diisi (misal: `"S"` untuk sync, `"R"` untuk refresh, `"C"` untuk create/add, `"⌘K"` untuk global search, `"Del"` untuk hapus, `"Alt+F"` untuk favorit).
   - Jika tombol tidak memiliki shortcut, kosongkan properti `shortcut` (tooltip akan otomatis hanya menampilkan teks label bersih tanpa kotak badge kosong).
3. **Offset & Penempatan Presisi**:
   - Default offset: `sideOffset={6}` di bawah tombol (`side="bottom"`).

### B. Contoh Penggunaan Baku:
```tsx
import { ActionTooltip } from "@k2net/ui";

// 1. Tombol dengan single-key shortcut
<ActionTooltip label="Tambah Pengetahuan" shortcut="C">
  <button onClick={handleCreate} className="h-8 w-8 rounded-lg ...">
    <Plus className="w-4 h-4" />
  </button>
</ActionTooltip>

// 2. Tombol dengan status dinamis
<ActionTooltip label={isSyncing ? "Menyinkronkan Server..." : "Sinkronkan Direktori Server"} shortcut="S">
  <button onClick={handleSync} className="h-8 w-8 rounded-lg ...">
    <FolderSync className="w-4 h-4" />
  </button>
</ActionTooltip>

// 3. Tombol tanpa shortcut
<ActionTooltip label="Pengaturan Gateway">
  <button onClick={handleSettings} className="h-8 w-8 rounded-lg ...">
    <Settings className="w-4 h-4" />
  </button>
</ActionTooltip>
```

---

## 🖱️ 12. Standar Wajib Right-Click Context Menu Global (Enterprise Action Drawer)

Setiap tabel data enterprise, kartu inventaris, dan daftar entitas (seperti Daftar SOP AI, Tasks & Tickets, Pengguna Global, dan OLT Device Table) **WAJIB** mendukung interaksi klik kanan (*Right-Click Context Menu*) menggunakan `<UniversalContextMenu>` dari `@k2net/ui`.

### A. Anatomi Standar Context Menu:
1. **Grup 1 — Aksi Utama & AI Copilot**:
   * Aksi Tanya AI tentang entitas terkait (Ikon `Sparkles`, teks berwarna `text-primary`, shortcut `Ctrl+J`).
   * Aksi Inspeksi Vektor / Quick View (Ikon `BrainCircuit`/`Eye`, shortcut `Alt+I`).
2. **Grup 2 — Sub-Menu Bertingkat (Jika Relevan)**:
   * Pilihan status (Backlog, Todo, In Progress, Resolved).
   * Pilihan prioritas, assignee, atau kategori.
3. **Grup 3 — Aksi Salin Data Cepat (Clipboard)**:
   * Salin Judul / Nama (shortcut `Ctrl+C`).
   * Salin UUID / Kode Perangkat (shortcut `Alt+C`).
4. **Grup 4 — Aksi Destruktif (Hapus/Arsipkan)**:
   * Wajib menggunakan `variant="destructive"` (teks dan ikon merah).
   * Shortcut `Del` atau `Ctrl+Del`.
   * Wajib memunculkan konfirmasi dialog / toast konfirmasi sebelum eksekusi fisik.

### B. Contoh Penggunaan Baku:
```tsx
import { UniversalContextMenu, ContextMenuGroupConfig } from "@k2net/ui";

const contextMenuGroups: ContextMenuGroupConfig[] = [
  {
    items: [
      {
        label: "Tanya AI tentang Dokumen",
        icon: Sparkles,
        shortcut: "Ctrl+J",
        onClick: () => handleAskAi(item),
      },
      {
        label: "Inspeksi Vektor (Explorer)",
        icon: BrainCircuit,
        shortcut: "Alt+I",
        onClick: () => handleInspect(item),
      },
    ],
  },
  {
    items: [
      {
        label: "Salin Judul",
        icon: Copy,
        shortcut: "Ctrl+C",
        onClick: () => copyToClipboard(item.title),
      },
      {
        label: "Salin ID (UUID)",
        icon: FileCode,
        shortcut: "Alt+C",
        onClick: () => copyToClipboard(item.id),
      },
    ],
  },
  {
    items: [
      {
        label: "Hapus dari Database",
        icon: Trash2,
        variant: "destructive",
        shortcut: "Del",
        onClick: () => handleDelete(item.id),
      },
    ],
  },
];

// Bungkus baris tabel / kartu
<UniversalContextMenu groups={contextMenuGroups}>
  <tr className="hover:bg-muted/40 cursor-pointer">
    <td>{item.title}</td>
    ...
  </tr>
</UniversalContextMenu>
```

---

## 💡 13. Standar Wajib KPI Cards & Efek Glow Interaktif (GlowingEffect)

Seluruh baris KPI Cards / Metric Summary Strip di bagian atas dashboard (`/tasks`, `/observability/*`, `/gateways/*`, `/organizations`, `/users`, `/ai`) **WAJIB** menerapkan efek border glow dinamis:

### A. Kaidah Implementasi:
1. **Penggunaan `<Card glowingEffect>`**:
   * Komponen `<Card glowingEffect>` dari `@k2net/ui` mendeteksi pergerakan kursor mouse secara otomatis (*mouse-tracking dynamic rainbow/primary border glow*).
   * Dilarang menggunakan styling border hover statis (`hover:border-primary/60`) pada KPI summary cards utama.
2. **Struktur Grid Baku**:
   * Grid KPI responsif: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full`.
3. **Anatomi Internal KPI Card**:
   * Header: Label kategori (`text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase`) + Status Icon.
   * Nilai Utama: Angka/Statistik besar (`text-2xl font-bold text-foreground font-mono`).
   * Sub-keterangan / Progress Bar: Progress status (`h-1.5 bg-muted rounded-full overflow-hidden`).
