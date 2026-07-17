# Global UI Style & Theme Consistency Rules

Halaman ini mendefinisikan aturan wajib untuk menjaga keseragaman visual (style warna, card, button, tipografi, dsb.) di seluruh platform **K2NET-FTTHGIS**, baik untuk Portal Utama (System Admin) maupun Portal Tenant (Organization/Dashboard).

---

## 🎨 1. Sistem Warna Global (Tailwind v4 & CSS Variables)

Aplikasi ini menggunakan tema **Emerald Green & Charcoal Dark Mode** secara default (Supabase Style) yang dikonfigurasi melalui `@theme inline` di package terpusat `@k2net/design-system` (`packages/design-system/src/theme.css`):

### 🎨 Palet Warna Utama (Green Theme v1.0)

| Kategori | Token Warna | Nilai HSL | Nilai Hex | Penggunaan di Code |
|---|---|---|---|---|
| **Brand Accent** | Emerald Green | `hsl(142.1 76.2% 45.3%)` | `#10b981` | `text-[#10b981]` atau `bg-primary` (Tombol utama, aksen link, fokus) |
| **Backgrounds (Dark)** | Charcoal Background | `hsl(0 0% 11%)` | `#1c1c1c` | `bg-background` (Latar belakang kanvas/card default) |
| **Sidebar (Dark)** | Panel Sidebar | `hsl(0 0% 9%)` | `#171717` | `bg-sidebar` (Latar belakang navigasi samping) |
| **Borders (Dark)** | Subtle Borders | `hsl(0 0% 18%)` | `#2e2e2e` | `border-border` (Garis pemisah antar kontainer) |
| **Text Primary (Dark)** | Slate/White | `hsl(0 0% 98%)` | `#fafafa` | `text-foreground` (Teks putih cerah) |
| **Text Muted (Dark)** | Neutral Grey | `hsl(240 5% 65%)` | `#a1a1aa` | `text-muted-foreground` (Teks sekunder/penjelas) |

---

## 🌓 2. Spesifikasi Tema Visual (Dark vs Light)

Untuk menjaga konsistensi, semua komponen visual wajib mendukung pertukaran tema menggunakan kelas `.dark` pada root element (`<html>`):

### 🌑 A. Dark Mode
Menggunakan warna dasar arang pekat (Charcoal) default:
* **Background Page & Card**: `#1c1c1c` (`hsl(0 0% 11%)`)
* **Background Sidebar**: `#171717` (`hsl(0 0% 9%)`)
* **Borders / Input Stroke**: `#2e2e2e` (`hsl(0 0% 18%)`)
* **Text Primary**: `#fafafa` / **Text Muted**: `#a1a1aa`

### ☀️ B. Light Mode
Menggunakan warna dasar putih/abu-abu bersih untuk visibilitas luar ruangan/lapangan:
* **Page Background**: `#fafafa` (`hsl(0 0% 98%)`)
* **Card & Dialog Background**: `#ffffff` (`hsl(0 0% 100%)`)
* **Sidebar Background**: `#f5f5f5` (`hsl(0 0% 96%)`)
* **Border & Input Stroke**: `#e5e5e5` (`hsl(0 0% 89%)`)
* **Text Primary**: `#1c1c1c` / **Text Muted**: `#737373`

---

## 📦 3. Panduan Desain Komponen (Component Styling)

### A. Kartu & Panel (Cards)
* **Warna & Border**: Gunakan background gelap transparan dengan border putih transparan tipis atau variable card.
  * *Class*: `bg-white/3 border-white/8 backdrop-blur-xl` atau `bg-card border-border`.
* **Radius Sudut (Rounded)**: Selalu gunakan `rounded-xl` (12px) untuk Card Utama, dan `rounded-md` (6px) untuk komponen kecil.
* **Pulsing Dot**: Untuk indikator status ONLINE, gunakan dot kecil dengan pulse:
  * *Class*: `h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse`

### B. Tombol & Badge (Buttons & Badges)
* **Tombol Aksi**: Gunakan `@k2net/ui` `<Button />` dengan class variants.
* **Badge Status Semantik**:
  * **ONLINE / Operational (Green)**: `bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px]`
  * **OFFLINE / Alert (Red)**: `bg-rose-500/15 text-rose-400 border-rose-500/30 text-[11px]`
  * **WARNING / Pending (Amber)**: `bg-amber-500/15 text-amber-400 border-amber-500/30 text-[11px]`

### C. Tipografi (Typography)
* **Header Halaman (H1)**: Gunakan font tipis/light dengan tracking ketat.
  * *Class*: `text-3xl font-light text-zinc-100 tracking-tight`
* **Sub-header / Card Title**: Gunakan semibold/medium berukuran kecil.
  * *Class*: `text-sm font-medium text-white/80`
* **Data Teknis (Mono)**: Gunakan class `font-mono` atau font `Fira Code` untuk menampilkan IP Address, koordinat, redaman, dan kode OLT/ODP.

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
