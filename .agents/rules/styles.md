# Global UI Style & Theme Consistency Rules — Monochrome Enterprise Standard

Halaman ini mendefinisikan aturan wajib untuk menjaga keseragaman visual di seluruh platform **K2NET-FTTHGIS**, baik untuk Portal Utama (System Admin) maupun Portal Tenant (`studio-tenant`). Aturan ini dirancang untuk menghasilkan estetika **Monochrome-First Enterprise (tenang, elegan, berwibawa, dan non-distracting)** serta menjamin keterbacaan sempurna di mode **Light/Dark**.

> 📖 Spesifikasi lengkap token desain: [design_tokens_spec.md](file:///opt/project5/docs/Server/UI/theme/design_tokens_spec.md)

---

## 🎨 1. Sistem Warna Global (Monochrome-First & Semantic Tokens)

Platform K2NET menganut filosofi **Monochrome Enterprise**: kanvas utama, panel kartu, border, tipografi, dan tombol aksi mengutamakan kontras monokrom netral. Aksen warna fungsional dibatasi secara ketat hanya untuk indikator status semantik (*Status Dot / Badges / Metrics Telemetry*).

| Kategori | Token Warna | Dark Mode HSL | Light Mode HSL | Class Tailwind | Keterangan |
|---|---|---|---|---|---|
| **Canvas Background** | Base Canvas | `hsl(0 0% 4.7%)` (`#0c0c0c`) | `hsl(0 0% 100%)` (`#ffffff`) | `bg-background` | Latar utama halaman |
| **Card Panel** | Elevated Surface | `hsl(0 0% 9%)` (`#171717`) | `hsl(0 0% 100%)` (`#ffffff`) | `bg-card` | Permukaan kartu, drawer, popover |
| **Borders** | Subtle Lines | `hsl(0 0% 12%)` (`#1f1f1f`) | `hsl(0 0% 89%)` (`#e5e5e5`) | `border-border` / `border-border/60` | Garis pembatas panel |
| **Text Primary** | High Contrast | `hsl(0 0% 94%)` | `hsl(0 0% 9%)` | `text-foreground` | Judul, teks isi utama, label |
| **Text Muted** | Neutral Grey | `hsl(0 0% 64%)` | `hsl(0 0% 28%)` | `text-muted-foreground` | Subtitle, metadata, placeholder |
| **Primary Solid CTA** | Solid Monochrome | `hsl(0 0% 98%)` (Dark) | `hsl(0 0% 9%)` (Light) | `bg-foreground text-background` | Tombol aksi utama (Save, Add, Create) |
| **Status ONLINE/SUCCESS** | Semantic Emerald | `hsl(142.1 76.2% 45.3%)` | `hsl(142.1 76.2% 45.3%)` | `text-emerald-500` / `bg-emerald-500/10` | Khusus status aktif, success, paid |

---

## 🌓 2. Spesifikasi Tema Visual (Dark vs Light)

### 🌑 A. Dark Mode (Default)
* **Background Page & Card**: `#0c0c0c` / `#171717`
* **Borders / Input Stroke**: `#1f1f1f` (`border-border`)
* **Text Primary**: `#f0f0f0` (`text-foreground`) / **Text Muted**: `#a3a3a3` (`text-muted-foreground`)

### ☀️ B. Light Mode (Workspace/Field)
* **Page Background**: `#fafafa` / `#ffffff` (`bg-background`)
* **Card & Dialog Background**: `#ffffff` (`bg-card`)
* **Sidebar Background**: `#f5f5f5` (`bg-sidebar`)
* **Border & Input Stroke**: `#e5e5e5` (`border-border`)
* **Text Primary**: `#1c1c1c` / **Text Muted**: `#737373`

---

## 🚫 3. Aturan Penggunaan Warna & Anti-Hardcode (WAJIB — Level 1 Critical)

> ⚠️ **ATURAN MUTLAK AKSEN WARNA**:
> 1. **Dilarang keras mewarnai tombol utama secara acak dengan warna hijau neon / warna-warni pelangi**. Tombol aksi utama (*CTA*) wajib berwajah monokrom tegas (`bg-foreground text-background hover:bg-foreground/90` atau `variant="default"`).
> 2. **Aksen Hijau (Emerald)** **DIPESERIKATKAN KHUSUS** untuk indikator semantik `SUCCESS`, `ONLINE`, `PAID`, atau `HEALTHY`. Dilarang menggunakannya sebagai latar tombol umum atau background kartu.
> 3. **Warna hardcoded `zinc-*`, `emerald-*`, dan `text-white`** pada teks biasa menyebabkan UI rusak di Light Mode dan **HARUS ditolak**.

### A. Tabel Pemetaan Lengkap (Migration Cheat Sheet)

| ❌ DILARANG — Hardcoded / Flashy | ✅ WAJIB — Token Semantik / Monokrom | Alasan |
|---|---|---|
| `text-white` | `text-foreground` | Tidak terlihat di Light Mode |
| `text-zinc-100` / `text-zinc-200` | `text-foreground` | Tidak auto-invert |
| `text-zinc-300` / `text-zinc-400` / `text-zinc-500` | `text-muted-foreground` | Tidak auto-invert |
| `text-zinc-600` / `text-zinc-700` | `text-muted-foreground` | Custom shade tidak ada di sistem |
| `bg-zinc-900` / `bg-zinc-950` | `bg-card` atau `bg-background` | Tetap gelap di Light Mode |
| `bg-zinc-800` / `bg-zinc-700` | `bg-muted` | Tetap gelap di Light Mode |
| `border-zinc-700` sampai `border-zinc-900` | `border-border` atau `border-border/60` | Tidak responsif terhadap tema |
| `bg-white/5` / `border-white/10` | `bg-card/30` / `border-border/30` | Menghilang di Light Mode |
| Tombol CTA `bg-emerald-600` / `bg-green-500` | `bg-foreground text-background` atau `variant="default"` | Mengganggu hierarki monokrom |

### B. Warna Semantik Fungsional Yang DIIZINKAN (Fixed Semantic)

| ✅ Token / Class | Penggunaan Valid |
|---|---|
| `text-emerald-500` / `bg-emerald-500/10` | Status `ONLINE`, `ACTIVE`, `PAID`, `HEALTHY`, success badge |
| `text-sky-400` / `bg-sky-500/10` | Metrik CPU, throughput jaringan, geometri spasial, `PLANNING` |
| `text-violet-400` / `bg-violet-500/10` | Metrik identity / security / PBAC permission chip |
| `text-rose-400` / `bg-rose-500/10` | Alert error, offline, destructive action, `FAILED`, `EXPIRED` |
| `text-amber-400` / `bg-amber-500/10` | Warning, degraded, `PENDING`, `MAINTENANCE`, `TRIAL_EXPIRED` |

### C. Perintah Audit Wajib Sebelum Commit

```bash
# Target: 0 pelanggaran di file .tsx/.ts (globals.css dikecualikan)
grep -rn "text-zinc-\|bg-zinc-\|border-zinc-\|text-white" \
  apps/studio-admin/src apps/studio-tenant/src \
  --include="*.tsx" --include="*.ts" | wc -l
```

---

## 📦 4. Panduan Desain Komponen (Component Styling)

### A. Kartu, KPI Metrics, & GlowingEffect (Cards)

* **Gunakan `<Card>` dari `@k2net/ui`** — Dilarang membuat wrapper card HTML/CSS independen per halaman.
* **GlowingEffect pada KPI Strip (WAJIB)**: Seluruh baris KPI Cards / Metric Summary Strip di bagian atas halaman (seperti di `/tasks`, `/observability/*`, `/gateways/*`, `/organizations`, `/users`, `/team`) **WAJIB** menggunakan `<Card glowingEffect>` atau `<MetricCard variant="groove">`:
  * Menghasilkan efek border gradient yang mengikuti pergerakan kursor mouse secara dinamis (*mouse-tracking subtle monochrome/primary glow*).
  * Struktur baku KPI: `<Card glowingEffect className="p-5 flex flex-col gap-3">`.
* **Standard `<Card>` Tanpa GlowingEffect**:
  * Digunakan untuk container tabel data, panel konfigurasi bertingkat (seperti Multi-Provider Hub), form editor panjang, atau dialog modal.
  * Gunakan interaksi border standar: `hover:border-primary/40 transition-colors` atau `border-border/60`.
* **Pencegahan Bug Overlap/Clipped Glow**:
  * Pada `<Card glowingEffect>`, dilarang menambahkan `overflow-hidden` jika card memiliki elemen anak yang menempel pada tepi border, agar efek glow tidak terpotong.
* **TracingBeam**: Untuk halaman berkonten panjang (settings, compliance, wizard form), gunakan:
  ```tsx
  import { TracingBeam } from "@k2net/ui";

  <TracingBeam className="px-4">
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* section panjang */}
    </div>
  </TracingBeam>
  ```
  Tambahkan `pl-4 md:pl-10` pada container dalam untuk menghindari garis beam menimpa konten.
* **Pulsing Dot ONLINE**: `h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_var(--color-emerald-500,#10b981)] animate-pulse`

### B. Standar Ukuran Tombol & Anatomi Kontrol (Anti-Oversized Scale)

Sistem UI K2NET mengikuti skala densitas presisi (*Supabase / Studio-Admin compact scale*) untuk mencegah tombol terlihat membengkak atau tidak seimbang dengan icon di sekitarnya:

* **Primary Action CTA (`variant="default"`)**:
  * **Toolbar / Card Footer**: Gunakan `size="sm"` (`h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md shadow-xs bg-foreground text-background hover:bg-foreground/90`). Maksimal 1 aksi primer per view.
  * **Modal Form Submissions**: Gunakan `size="default"` (`h-8 px-3 text-xs font-medium rounded-md shadow-xs`).
* **Toolbar Controls & Dropdowns (`variant="outline"`)**:
  * Gunakan `size="sm"` (`h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md border-border/80 bg-card hover:bg-accent text-foreground`).
* **Icon-Only Buttons**:
  * **Toolbar**: Gunakan `size="icon-sm"` atau `size="sm"` (`h-7 w-7 p-0 rounded-md border-border/80 bg-card hover:bg-accent text-muted-foreground hover:text-foreground`). Icon berukuran `size-3.5`.
  * **Data Table Rows**: Gunakan `size="icon-xs"` (`h-6 w-6 rounded-md text-muted-foreground hover:text-foreground`). Icon berukuran `size-3`.
* **Data Table Row Actions (Dense Enterprise Table)**:
  * Gunakan `size="xs"` (`h-6 px-2 text-[11px] font-medium gap-1 rounded-md`). Icon berukuran `size-3`. Dilarang menggunakan tombol `h-7.5` atau `h-8` di dalam baris tabel karena akan meregangkan tinggi baris secara berlebihan.
* **Segmented / View Mode Switcher**:
  * Container: `rounded-md border border-border/80 bg-card p-0.5 flex items-center`.
  * Item Button: `p-1 rounded-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer` (Aktif: `bg-secondary text-foreground shadow-xs`). Icon berukuran `size-3.5`.
* **Destructive Action (`variant="destructive"`)**:
  * `bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 h-7 px-2.5 rounded-md text-xs font-medium`.

Badge Status:
| Tipe | Class Card View | Class Table Row View |
|---|---|---|
| Neutral / Info | `bg-muted text-foreground border border-border/60 text-[10px] font-mono font-semibold uppercase px-2 py-0.5` | `px-1.5 py-0.2 text-[10px] font-mono font-semibold uppercase` |
| ONLINE / PRODUCTION / SUCCESS | `bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-mono font-semibold uppercase px-2 py-0.5` | `px-1.5 py-0.2 text-[10px] font-mono font-semibold uppercase` |
| PLANNING / SKY | `bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono font-semibold uppercase px-2 py-0.5` | `px-1.5 py-0.2 text-[10px] font-mono font-semibold uppercase` |
| OFFLINE / Error / Rose | `bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-semibold uppercase px-2 py-0.5` | `px-1.5 py-0.2 text-[10px] font-mono font-semibold uppercase` |
| WARNING / MAINTENANCE / Amber | `bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-semibold uppercase px-2 py-0.5` | `px-1.5 py-0.2 text-[10px] font-mono font-semibold uppercase` |
| PBAC Scope / Role | `bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] font-mono font-semibold uppercase px-2 py-0.5` | `px-1.5 py-0.2 text-[10px] font-mono font-semibold uppercase` |

### C. Tipografi

| Elemen | Class Wajib |
|---|---|
| H1 Page Title | `text-3xl font-light text-foreground tracking-tight` |
| Card Title / H3 | `text-sm font-semibold text-foreground` |
| Body Regular | `text-sm text-foreground` |
| Helper/Subtitle | `text-xs text-muted-foreground` |
| Caption/Eyebrow | `text-[10px] font-bold uppercase tracking-widest text-muted-foreground` |
| Nav Item (active) | `text-sm font-medium text-primary` |
| Nav Item (default) | `text-sm font-medium text-sidebar-foreground/75` |
| Nav Section Label | `text-xs font-bold uppercase tracking-wider text-muted-foreground` |
| Input Label | `text-xs font-semibold text-foreground mb-1.5` |
| Data Teknis (IP/MAC) | `font-mono text-xs text-foreground` |
| Data Timestamp | `font-mono text-xs text-muted-foreground` |

### D. Anatomi Form, Search Input, Tabel & Modal

* **Search Input Toolbar**: `h-7.5 pl-8 text-xs bg-muted/20 border-border/80 rounded-md` dengan icon `<Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />`.
* **Tabs Filter Toolbar**: `TabsList className="h-7.5 p-0.5 bg-muted/60 border border-border/60 shrink-0"` dengan `TabsTrigger className="text-xs px-2.5 h-6.5"`.
* **Form Control Editor**: `h-8.5 rounded-lg focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary text-xs`
* **Tabel Header**: `sticky top-0 bg-muted/40 backdrop-blur-md border-b border-border/60` + teks `text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-2 px-3.5`
* **Tabel Data Row**: `py-2.5 px-3.5 text-xs text-foreground hover:bg-muted/30 transition-colors border-b border-border/40`
* **Modal**: `bg-card/95 backdrop-blur-2xl border border-border shadow-2xl rounded-xl p-6`
* **Modal Footer**: `flex justify-end gap-2 pt-4 border-t border-border` — Cancel outline kiri, Save primary kanan.

### E. Standar Shell Layout & Ketinggian Bar (Anti-Layout Shift)

* **Header Sub-Sidebar**: Wajib tinggi compact terstandarisasi `h-12 py-2 px-4 border-b border-border/40` via `<SecondarySidebarHeader />` dari `@k2net/ui`. Dilarang menggunakan `py-5`, `py-6`, atau `py-8`.
* **Page Header**: Wajib `px-6 py-3.5 border-b border-border/40` via `<PageHeader />` dari `@k2net/ui` dengan navigasi breadcrumb dan tombol aksi cepat.
* **Linear Tabs Bar**: Wajib `px-6 border-b border-border/40 bg-background/50` via `<PageHeaderTabs />`.
* **Metric Cards**: Gunakan `<MetricCard variant="groove" />` untuk visualisasi KPI dengan aksen halus `.border-groove-t` dan `.border-groove-b`.
* **Batas Luar Shell vs Kartu Dalam**:
  * Batas luar shell (Header utama, batas kanan Sidebar) menggunakan flat border halus `border-border/40`.
  * Pembatas dalam sidebar menu menggunakan hairline `border-groove-t`.
  * Efek groove penuh digunakan di dalam kartu dashboard untuk memberikan pantulan bevel premium.

### F. Pencegahan Anti-Pattern Anatomi UI (Oversized Anti-Patterns)

1. ❌ **Dilarang Tombol Bulky/Tebal di Toolbar**: Menggunakan `h-8 px-3 font-semibold` atau `h-10` pada tombol CTA di sebelah kontrol kecil membuat visual timpang (*imbalanced*). Gunakan `size="sm"` (`h-7 px-2.5 text-xs font-medium gap-1.5`).
2. ❌ **Dilarang Tombol Raksasa di Footer Card**: Tombol `Open Project` atau aksi footer card tidak boleh menggunakan `px-3.5` / `h-7.5` berlebih. Wajib konsisten dengan `size="sm"` (`h-7 px-2.5 text-xs`).
3. ❌ **Dilarang Tombol Longgar di Data Table**: Jangan letakkan tombol `size="sm"` atau `size="default"` di dalam baris tabel data padat. Selalu gunakan `size="xs"` (`h-6 px-2 text-[11px]`) untuk tombol aksi dan `size="icon-xs"` (`h-6 w-6`) untuk menu 3-dots.
4. ❌ **Dilarang Status Badge Kosong / Strip `-`**: Data status yang tidak terdefinisi dari API backend wajib melalui normalisasi fallback (contoh: default `PRODUCTION` emerald) agar tidak merender outline kosong atau strip.

---

## ⏳ 5. Skeleton Loading State — Route Coverage Wajib

Seluruh route di `(dashboard)` layout **wajib** memiliki `loading.tsx` sebagai thin wrapper dari `@k2net/ui`:

```tsx
// Pattern standar — 3 baris saja
import { TablePageSkeleton } from "@k2net/ui";
export default function Loading() { return <TablePageSkeleton />; }
```

| Prefix Route | Skeleton Component |
|---|---|
| `/overview` | `DashboardPageSkeleton` |
| `/organizations`, `/users/**` | `TablePageSkeleton` |
| `/health`, `/gateways/**` | `CardGridSkeleton` |
| `/settings`, `/security/**` (form) | `FormPageSkeleton` |
| `/security/**` (tabel/matrix) | `TablePageSkeleton` |

> **Verifikasi**: `find apps/studio-admin/src/app -name "loading.tsx" | wc -l` → harus ≥ 25

**Jangan** membuat Skeleton ad-hoc langsung dalam `loading.tsx`. Jika bentuk halaman baru tidak cocok dengan skeleton yang ada, tambahkan varian baru ke `packages/ui/src/components/skeletons.tsx`.

---

## 🔄 6. Arsitektur Tema Dinamis (Tailwind v4 CSS-First)

Konfigurasi tema dikelola langsung di CSS via `@theme inline` di `packages/design-system/src/theme.css`:

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

File `apps/studio-admin/src/app/globals.css` berisi override `.light` selektor sebagai **safety net fallback** untuk kelas `zinc-*` yang belum dimigrasi. Ini bukan pengganti migrasi di level komponen — migrasi token semantik tetap wajib.

*Referensi lengkap: [design_tokens_spec.md](file:///opt/project5/docs/Server/UI/theme/design_tokens_spec.md)*

---

## 🎯 7. Standar Wajib Tooltip Global (Linear-Style Pill)

Seluruh tombol aksi (khususnya *icon-only buttons*) **wajib** dibungkus menggunakan `<ActionTooltip>` dari `@k2net/ui`.

* **Zero Arrow**: Dilarang menggunakan panah segitiga putih default (`showArrow=false`).
* **Dark Pill**: Background `bg-popover text-popover-foreground border border-border shadow-xl rounded-lg px-2.5 py-1 text-[11px] font-medium`.
* **Shortcut Dinamis (`shortcut`)**: Wajib menyertakan shortcut keyboard jika aksi memiliki hotkey (misal: `"S"` sync, `"R"` refresh, `"C"` create, `"⌘K"` search, `"Del"` delete).

---

## 🖱️ 8. Standar Wajib Right-Click Context Menu Global (Enterprise Action Drawer)

Seluruh tabel data dan entitas enterprise **wajib** mendukung klik kanan (*Right-Click Context Menu*) menggunakan `<UniversalContextMenu>` dari `@k2net/ui`.

* **Struktur Baku**: (1) AI Copilot / Quick Action (`Ctrl+J`), (2) Inspect / Edit (`Alt+I`), (3) Sub-menus bertingkat (Status/Prioritas), (4) Copy ID/Judul (`Ctrl+C`), (5) Destructive Action (`variant="destructive"` + `Del`).
* **Aksesibilitas & Feedback**: Menyediakan feedback instan (toast / dialog konfirmasi) setelah aksi dieksekusi.
