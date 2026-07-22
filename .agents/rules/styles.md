# Global UI Style & Theme Consistency Rules

Halaman ini mendefinisikan aturan wajib untuk menjaga keseragaman visual (style warna, card, button, tipografi, dsb.) di seluruh platform **K2NET-FTTHGIS**, baik untuk Portal Utama (System Admin) maupun Portal Tenant (Organization/Dashboard). Aturan ini harus dipatuhi secara ketat untuk menjamin kecocokan di mode **Light/Dark** dan pilihan **Brand Style (Green/Blue)**.

---

## 🎨 1. Sistem Warna Global (Tailwind v4 & CSS Variables)

Aplikasi ini mendukung tema warna dinamis (**Version 1 - Green** dan **Version 2 - Blue**) yang dikonfigurasi melalui `@theme inline` di package terpusat `@k2net/design-system` (`packages/design-system/src/theme.css`):

### 🎨 Palet Warna Utama (Dynamic Brand System)

| Kategori | Token Warna | Nilai HSL (Green v1) | Nilai HSL (Blue v2) | Penggunaan di Code |
|---|---|---|---|---|
| **Brand Accent** | Dynamic Primary | `hsl(153 60% 53%)` | `hsl(199 89% 54%)` | **`bg-primary`** atau **`text-primary`** (Dilarang keras memakai hardcoded emerald/blue) |
| **Backgrounds (Dark)** | Charcoal Background | `hsl(0 0% 4.7%)` | `hsl(0 0% 4.7%)` | `bg-background` (Latar belakang kanvas/card default) |
| **Sidebar (Dark)** | Panel Sidebar | `hsl(0 0% 4.7%)` | `hsl(0 0% 4.7%)` | `bg-sidebar` (Latar belakang navigasi samping) |
| **Borders (Dark)** | Subtle Borders | `hsl(0 0% 12%)` | `hsl(0 0% 12%)` | `border-border` (Garis pemisah antar kontainer) |
| **Text Primary (Dark)** | Slate/White | `hsl(0 0% 94%)` | `hsl(0 0% 94%)` | `text-foreground` (Teks putih cerah / hitam pekat di light mode) |
| **Text Muted (Dark)** | Neutral Grey | `hsl(0 0% 64%)` | `hsl(0 0% 64%)` | `text-muted-foreground` (Teks sekunder/penjelas) |

---

## 🌓 2. Spesifikasi Tema Visual (Dark vs Light)

Untuk menjaga konsistensi, semua komponen visual wajib mendukung pertukaran tema menggunakan kelas `.dark` pada root element (`<html>`):

### 🌑 A. Dark Mode
Menggunakan warna dasar arang pekat (Charcoal) default:
* **Background Page & Card**: `#1c1c1c` / `#0c0c0c`
* **Background Sidebar**: `#0c0c0c`
* **Borders / Input Stroke**: `#1f1f1f` (`border-border`)
* **Text Primary**: `#f0f0f0` (`text-foreground`) / **Text Muted**: `#a3a3a3` (`text-muted-foreground`)

### ☀️ B. Light Mode
Menggunakan warna dasar putih/abu-abu bersih untuk visibilitas luar ruangan/lapangan:
* **Page Background**: `#fafafa` (`bg-background`)
* **Card & Dialog Background**: `#ffffff` (`bg-card`)
* **Sidebar Background**: `#f5f5f5` (`bg-sidebar`)
* **Border & Input Stroke**: `#e5e5e5` (`border-border`)
* **Text Primary**: `#1c1c1c` / **Text Muted**: `#737373`

---

## 📦 3. Panduan Desain Komponen (Component Styling)

### A. Kartu & Panel (Cards)
* **Standardisasi Komponen Card Global (`@k2net/ui`)**:
  * **Wajib**: Gunakan komponen `<Card>` dari paket `@k2net/ui`. Seluruh logika visual glassmorphism (`bg-card/80 dark:bg-card/60 backdrop-blur-xl border border-border rounded-xl`) sudah dikemas terpusat di `@k2net/ui`.
  * **Efek Animasi Border Beam Berjalan (*Hover*)**: Untuk kartu interaktif atau kartu matriks dashboard, gunakan prop `animatedBeam` dan `beamColor`:
    * `<Card animatedBeam beamColor="#3ecf8e">` (Aksen Hijau Primary)
    * `<Card animatedBeam beamColor="#0ea5e9">` (Aksen Biru Sky - CPU/RAM/Metriks)
    * `<Card animatedBeam beamColor="#8b5cf6">` (Aksen Ungu Violet - Security/Auth)
    * `<Card animatedBeam beamColor="#14b8a6">` (Aksen Toska Teal - Gateway/Storage)
  * **Larangan Hardcode Style**: Dilarang membuat wrapper HTML/CSS kartu secara independen per halaman. Panggil komponen terpusat dari `@k2net/ui` agar berlaku konsisten di `studio-admin` maupun `studio-tenant`.
* **Radius Sudut (Rounded)**: Selalu gunakan `rounded-xl` (12px) untuk Card Utama, dan `rounded-md` (6px) untuk komponen kecil.
* **Pulsing Dot**: Untuk indikator status ONLINE, gunakan dot kecil dengan pulse menggunakan primary token:
  * *Class*: `h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_var(--primary)] animate-pulse`

### B. Tombol & Badge (Buttons & Badges)
* **Standardisasi Tombol Terpusat (`@k2net/ui`)**:
  * **Pemberlakuan Wajib**: Seluruh tombol di `studio-admin` dan `studio-tenant` wajib menggunakan komponen `<Button>` dari `@k2net/ui`. Dilarang menulis tag `<button>` mentah atau menyematkan kelas hardcoded.
  * **Primary CTA (`variant="default"`)**: Gunakan hanya 1 Primary CTA per halaman (`bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] rounded-lg h-9`).
  * **Secondary / Toolbar Control (`variant="outline"`)**: Gunakan varian ini untuk tombol kontrol ala Cloudflare seperti *Refresh*, *Filters*, *Import*, *Export*, *Docs* (`bg-card text-foreground border border-border hover:bg-muted active:scale-[0.98] rounded-lg h-9`).
  * **Destructive (`variant="destructive"`)**: Gunakan varian berlatar merah lembut (`bg-rose-500/10 text-rose-500 border border-rose-500/20`) untuk aksi penghapusan berisiko.
* **Badge Status Semantik**:
  * **ONLINE / Operational (Dynamic)**: `bg-primary/10 text-primary border-primary/20 text-[11px]` (atau gunakan status semantik hijau jika bermakna positif/OK dan bukan aksen brand: `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20`)
  * **OFFLINE / Alert (Red)**: `bg-rose-500/15 text-rose-400 border-rose-500/30 text-[11px]`
  * **WARNING / Pending (Amber)**: `bg-amber-500/15 text-amber-400 border-amber-500/30 text-[11px]`

### C. Tipografi (Typography)
* **Header Halaman (H1)**: Gunakan font tipis/light dengan tracking ketat dan warna dinamis.
  * *Class*: `text-3xl font-light text-foreground tracking-tight` (Hindari `text-zinc-100` atau `text-white`)
* **Sub-header / Card Title**: Gunakan semibold/medium berukuran kecil.
  * *Class*: `text-sm font-medium text-foreground/80` atau `text-muted-foreground`
* **Data Teknis (Mono)**: Gunakan class `font-mono` atau font `Fira Code` untuk menampilkan IP Address, koordinat, redaman, dan kode OLT/ODP.

### D. Anatomi Form, Tabel & Modal
* **Form Control & Input**: Tinggi seragam `h-9` (36px) dan `rounded-lg` (8px). Garis fokus `focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary`.
* **Data Table**: Header terkunci `sticky top-0 bg-muted/60 backdrop-blur-md border-b border-border` dengan teks `text-[10px] font-bold uppercase tracking-wider text-muted-foreground`. Data teknis (IP/MAC/Lat/Lng) wajib `font-mono text-xs text-foreground`.
* **Modal Dialog**: Latar `bg-card/95 backdrop-blur-2xl border border-border shadow-2xl rounded-xl p-6`. Footer tombol di kanan bawah (`Cancel` outline di kiri, `Save` default di kanan).
* **Skeleton Loading State**: Gunakan `<Skeleton />` dengan bentuk mencerminkan layout Card/Table/Form (`bg-muted/50 animate-pulse rounded-lg`) untuk mencegah blank screen.

---

## 🔄 4. Arsitektur Tema Dinamis (Tailwind v4 CSS-First Style)

Mulai versi Tailwind CSS v4, konfigurasi tema tidak lagi menggunakan file JavaScript (`tailwind.config.js`), melainkan dikelola langsung melalui file CSS (`packages/design-system/src/theme.css`) menggunakan teknik **`@theme inline`** agar pemetaan CSS variables ter-update secara dinamis di runtime:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}
```

*Catatan: Semua agen wajib mengacu pada spesifikasi desain terpusat di [docs/Server/UI/theme/design_tokens_spec.md](file:///opt/project5/docs/Server/UI/theme/design_tokens_spec.md) untuk implementasi komponen UI.*
