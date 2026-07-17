# 🎨 @k2net/design-system

Pustaka terpusat untuk **Design Tokens** (warna, tipografi, tema dinamis, aset visual, dan konfigurasi styling) platform **K2NET-FTTHGIS**. 

Tujuan utama dari package ini adalah menjamin **konsistensi visual** (Theme Uniformity) di seluruh aplikasi monorepo (seperti Portal Admin, Portal Tenant, atau aplikasi mobile teknisi di masa depan).

---

## 🏗️ Komponen Utama untuk Konsistensi

Untuk membuat seluruh ekosistem visual K2NET konsisten, package `@k2net/design-system` wajib menampung hal-hal berikut:

### 1. CSS Design Tokens (`src/theme.css`)
Di era **Tailwind CSS v4**, konfigurasi tema tidak lagi menggunakan file JavaScript (`tailwind.config.js`), melainkan dideklarasikan langsung di dalam file CSS menggunakan `@theme` directives.
* **Warna Tema Utama**: Menampung variabel warna Monochrome Shadcn, warna aksen brand K2NET, status warna kesehatan OLT/ODP (Up, Degraded, Down).
* **Variabel CSS Global**: Mendefinisikan `:root` (dark mode default, light mode fallback, dan radius border).
* **Cara Penggunaan**: Aplikasi frontend cukup mengimpor berkas CSS ini di awal `globals.css` mereka:
  ```css
  @import "tailwindcss";
  @import "@k2net/design-system/theme.css";
  ```

### 2. JS/TS Design Tokens (`src/index.ts`)
Konstanta variabel JavaScript/TypeScript yang digunakan untuk logika dinamis:
* **Warna Konstan (Hex/HSL)**: Digunakan untuk visualisasi non-CSS seperti pewarnaan marker dinamis pada peta Google Maps / MapLibre GL, diagram Recharts, atau grafik Canvas.
* **Breakpoints**: Batas lebar layar (e.g. `mobile: 768px`, `desktop: 1024px`) agar hook pendeteksi viewport mobile konsisten.

### 3. Aset Brand Terpusat (`src/assets/`)
* **Logo K2NET**: SVG logo utama, logo monochrome, dan icon mark.
* **Favicon & Loader Animation**: Animasi loader loading screen kustom dan icon tab browser.

---

## 📅 Roadmap Implementasi & Integrasi

1. **Inisialisasi Package**: Membuat `package.json` dan `tsconfig.json` untuk `@k2net/design-system`.
2. **Ekstraksi CSS Variables**: Memindahkan variabel `@theme` dari `apps/studio/src/app/globals.css` ke `@k2net/design-system/src/theme.css`.
3. **Ekstraksi Aset Peta**: Menyediakan berkas CSS / JS styling khusus untuk MapLibre/Leaflet maps (seperti custom marker icons) agar peta di Portal Admin dan Portal Tenant seragam.

