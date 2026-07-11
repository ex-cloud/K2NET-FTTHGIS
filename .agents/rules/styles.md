# Global UI Style & Theme Consistency Rules

Halaman ini mendefinisikan aturan wajib untuk menjaga keseragaman visual (style warna, card, button, typografi, dsb.) antara **Portal Utama (System)** dan **Portal Tenant (Organization/Dashboard)**.

---

## 🎨 1. Sistem Warna Global (Tailwind v4 & CSS Variables)

Aplikasi ini menggunakan tema **Dark Mode by default (Supabase Style)** yang diatur oleh CSS Variables di [`globals.css`](file:///opt/project5/apps/studio/src/app/globals.css):

### 🎨 Palet Warna Supabase (Hex / HSL)

| Kategori | Token Warna | Nilai HSL | Nilai Hex | Penggunaan di Code |
|---|---|---|---|---|
| **Brand Accent** | Emerald Green | `hsl(153 60% 53%)` | `#3ecf8e` | `text-[#3ecf8e]` (Untuk tombol utama, sukses, status online) |
| **Backgrounds** | Deep Background | `hsl(0 0% 11%)` | `#1c1c1c` | `bg-background` (Latar belakang dasar/kanvas) |
| **Sidebar** | Panel Sidebar | `hsl(0 0% 9%)` | `#171717` | `bg-sidebar` (Latar belakang navigasi samping) |
| **Borders** | Subtle Borders | `hsl(0 0% 18%)` | `#2e2e2e` | `border-border` (Garis batas antar panel/kontainer) |
| **Teks Muted** | Neutral Grey | `hsl(240 5% 65%)` | `#8a8a93` | `text-muted-foreground` (Teks sekunder/penjelas) |

> [!TIP]
> Prioritaskan menggunakan class utilitas Tailwind bawaan (`bg-background`, `border-border`, `bg-sidebar`) daripada hex manual. Jika butuh warna aksen brand hijau Supabase secara eksplisit di luar class Tailwind, gunakan `#3ecf8e`.

---

## 📦 2. Panduan Desain Komponen (Component Styling)

Untuk menjaga keseragaman total, semua komponen baru harus mengikuti struktur visual berikut:

### A. Kartu & Panel (Cards)
* **Warna & Border**: Gunakan background gelap transparan dengan border putih transparan tipis.
  * *Class*: `bg-white/3 border-white/8 backdrop-blur-xl` atau `bg-card border-border`.
* **Radius Sudut (Rounded)**: Selalu gunakan `rounded-xl` (12px) atau `rounded-2xl` (16px) untuk card besar.
* **Pulsing Dot**: Untuk indikator status ONLINE, gunakan dot kecil dengan pulse:
  * *Class*: `h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse`

### B. Tombol & Badge (Buttons & Badges)
* **Tombol Aksi**: Gunakan variant `outline` dengan warna teks muted untuk aksi sekunder, dan variant `default` untuk aksi utama.
  * *Class*: `Button variant="outline" className="border-white/10 hover:border-white/20 text-white/70 hover:text-white"`
* **Badge Status**:
  * **ONLINE / Operational**: `bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px]`
  * **OFFLINE / Alert**: `bg-rose-500/15 text-rose-400 border-rose-500/30 text-[11px]`
  * **WARNING / Pending**: `bg-amber-500/15 text-amber-400 border-amber-500/30 text-[11px]`

### C. Tipografi (Typography)
* **Header Halaman (H1)**: Gunakan font tipis/light dengan tracking ketat.
  * *Class*: `text-3xl font-light text-zinc-100 tracking-tight`
* **Sub-header / Card Title**: Gunakan semibold/medium berukuran kecil.
  * *Class*: `text-sm font-medium text-white/80`
* **Deskripsi / Info**: Gunakan ukuran ekstra kecil berwarna abu-abu.
  * *Class*: `text-xs text-zinc-500` atau `text-white/40`

---

## 🏛️ 3. Perbedaan Portal Utama vs Portal Tenant

Meskipun menggunakan tema global yang sama, terdapat aksen visual yang membedakan lingkup kerja user:

### A. Portal Utama (System / Admin Platform Control)
* **Tujuan**: Mengelola organisasi, kesehatan server global, dan database.
* **Aksen Warna**: Dominan **Hijau Emerald (`emerald`)** untuk melambangkan stabilitas operasional.
* **Background Utama**: `bg-[#080808] px-8 pt-16` (untuk layout kontrol admin).

### B. Portal Tenant (Operational Dashboard)
* **Tujuan**: Monitoring perangkat FTTH pelanggan, peta spasial, dan billing tenant.
* **Aksen Warna**: Dominan **Biru Langit (`sky`)** atau **Violet (`violet`)** untuk membedakan ruang operasional kerja tenant.
* **Background Utama**: Sesuai dengan tema standard `bg-background` (#1c1c1c).

---

## 🔄 4. Arsitektur Tema Dinamis (Dynamic & Multi-Theme shadcn/ui Style)

Untuk mendukung penggantian tema secara langsung (real-time) melalui UI baik di portal utama maupun portal tenant, platform ini menggunakan arsitektur **injeksi class tema dinamis pada root element (`<html>` atau `<body>`)** dengan memanfaatkan variabel HSL CSS.

### A. Alur Kerja Tema Dinamis
1. **Pilihan Tema**: User memilih tema dari UI (contoh: *Supabase Classic*, *Monochrome Slate*, *Cyberpunk Violet*, *Forest Emerald*).
2. **Penyimpanan**: Pilihan tema disimpan di `localStorage` (untuk persistensi client-side cepat) dan di database profil user/tenant (untuk persistensi multi-device).
3. **Penerapan**: Next.js Theme Provider menyuntikkan kelas tema ke tag `<html>` (misal `<html class="theme-monochrome">`).

### B. Struktur CSS Variable untuk Tema Tambahan di `globals.css`
Saat mendesain tema baru, ikuti pola pendefinisian variabel di [`globals.css`](file:///opt/project5/apps/studio/src/app/globals.css) berikut:

```css
/* 1. Tema Default (Supabase Classic) */
:root {
  --background: hsl(0 0% 11%); /* #1c1c1c */
  --foreground: hsl(0 0% 98%);
  --border: hsl(0 0% 18%);
  --primary: hsl(153 60% 53%); /* Emerald Green */
}

/* 2. Tema Monochrome (Shadcn Slate Style) */
.theme-monochrome {
  --background: hsl(240 10% 3.9%); /* Deep black slate */
  --foreground: hsl(0 0% 98%);
  --border: hsl(240 5.9% 10%);
  --primary: hsl(0 0% 98%); /* Pure white/black contrast */
}

/* 3. Tema Cyberpunk (Violet Neon Style) */
.theme-cyberpunk {
  --background: hsl(270 20% 6%); /* Dark purple */
  --foreground: hsl(180 100% 90%);
  --border: hsl(280 40% 15%);
  --primary: hsl(290 100% 60%); /* Neon Magenta/Violet */
}
```

### C. Implementasi Theme Switcher di UI
Semua state dropdown/pilihan tema harus membaca theme dari hooks custom global `useTheme()` (atau helper provider serupa) dan merubah class root `document.documentElement.className` secara bersih untuk menghindari flash warna tidak seragam.

