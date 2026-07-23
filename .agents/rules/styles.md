# Global UI Style & Theme Consistency Rules

Halaman ini mendefinisikan aturan wajib untuk menjaga keseragaman visual di seluruh platform **K2NET-FTTHGIS**, baik untuk Portal Utama (System Admin) maupun Portal Tenant. Aturan ini harus dipatuhi secara ketat untuk menjamin kecocokan di mode **Light/Dark** dan pilihan **Brand Style (Green/Blue)**.

> 📖 Spesifikasi lengkap token desain: [design_tokens_spec.md](file:///opt/project5/docs/Server/UI/theme/design_tokens_spec.md)

---

## 🎨 1. Sistem Warna Global (Tailwind v4 & CSS Variables)

Aplikasi mendukung tema dinamis (**Version 1 - Green** dan **Version 2 - Blue**) dikonfigurasi melalui `@theme inline` di `packages/design-system/src/theme.css`:

| Kategori | Token Warna | Green v1 HSL | Blue v2 HSL | Class Tailwind |
|---|---|---|---|---|
| **Brand Accent** | Dynamic Primary | `hsl(153 60% 53%)` | `hsl(199 89% 54%)` | `bg-primary` / `text-primary` |
| **Background** | Charcoal Canvas | `hsl(0 0% 4.7%)` | `hsl(0 0% 4.7%)` | `bg-background` |
| **Card Panel** | Elevated Surface | `hsl(0 0% 9%)` | `hsl(0 0% 9%)` | `bg-card` |
| **Sidebar** | Panel Sidebar | `hsl(0 0% 4.7%)` | `hsl(0 0% 4.7%)` | `bg-sidebar` |
| **Borders** | Subtle Lines | `hsl(0 0% 12%)` | `hsl(0 0% 12%)` | `border-border` |
| **Text Primary** | Slate/White | `hsl(0 0% 94%)` | `hsl(0 0% 94%)` | `text-foreground` |
| **Text Muted** | Neutral Grey | `hsl(0 0% 64%)` | `hsl(0 0% 64%)` | `text-muted-foreground` |

---

## 🌓 2. Spesifikasi Tema Visual (Dark vs Light)

### 🌑 A. Dark Mode (Default)
* **Background Page & Card**: `#0c0c0c` / `#171717`
* **Borders / Input Stroke**: `#1f1f1f` (`border-border`)
* **Text Primary**: `#f0f0f0` (`text-foreground`) / **Text Muted**: `#a3a3a3` (`text-muted-foreground`)

### ☀️ B. Light Mode (Workspace/Field)
* **Page Background**: `#fafafa` (`bg-background`)
* **Card & Dialog Background**: `#ffffff` (`bg-card`)
* **Sidebar Background**: `#f5f5f5` (`bg-sidebar`)
* **Border & Input Stroke**: `#e5e5e5` (`border-border`)
* **Text Primary**: `#1c1c1c` / **Text Muted**: `#737373`

---

## 🚫 3. Aturan Anti-Hardcode Warna (WAJIB — Level 1 Critical)

> ⚠️ **PELANGGARAN PALING KRITIS**: Warna hardcoded `zinc-*`, `emerald-*`, dan `text-white` menyebabkan UI **RUSAK di Light Mode** — teks menjadi tidak terbaca (putih di atas putih, atau card gelap di atas background putih). Setiap commit yang mengandung pelanggaran ini **HARUS ditolak**.

### A. Tabel Pemetaan Lengkap (Migration Cheat Sheet)

| ❌ DILARANG — Hardcoded | ✅ WAJIB — Token Semantik | Alasan |
|---|---|---|
| `text-white` | `text-foreground` | Tidak terlihat di Light Mode |
| `text-zinc-100` / `text-zinc-200` | `text-foreground` | Tidak auto-invert |
| `text-zinc-300` / `text-zinc-400` / `text-zinc-500` | `text-muted-foreground` | Tidak auto-invert |
| `text-zinc-600` / `text-zinc-700` | `text-muted-foreground` | Custom shade tidak ada di sistem |
| `bg-zinc-900` / `bg-zinc-950` | `bg-card` atau `bg-background` | Tetap gelap di Light Mode |
| `bg-zinc-800` / `bg-zinc-700` | `bg-muted` | Tetap gelap di Light Mode |
| `border-zinc-700` sampai `border-zinc-900` | `border-border` atau `border-border/60` | Tidak responsif terhadap tema |
| `bg-white/5` / `border-white/10` | `bg-card/30` / `border-border/30` | Menghilang di Light Mode |
| `text-emerald-500` / `text-emerald-600` | `text-primary` | Terikat brand lama, tidak bisa Blue v2 |
| `bg-emerald-500` / `bg-emerald-600` | `bg-primary` | Terikat brand lama |
| `hover:bg-emerald-700` | `hover:bg-primary/90` | Hardcoded ke brand lama |
| `border-emerald-500` | `border-primary` | Hardcoded ke brand lama |
| `data-[state=checked]:bg-emerald-600` | `data-[state=checked]:bg-primary` | Checkbox/switch state |

### B. Warna Non-Semantik Yang DIIZINKAN (Fixed Semantic)

| ✅ Diizinkan | Penggunaan Valid |
|---|---|
| `text-sky-400` / `bg-sky-500` | Metrik CPU, komputasi, grafik |
| `text-violet-400` / `bg-violet-500` | Metrik identity / security |
| `text-rose-400` / `bg-rose-500` | Alert error, offline, destructive |
| `text-amber-400` / `bg-amber-500` | Warning, degraded, pending |
| `bg-emerald-500/10 text-emerald-500` | Badge "success" semantik (bukan brand) |

### C. Perintah Audit Wajib Sebelum Commit

```bash
# Target: 0 pelanggaran di file .tsx/.ts (globals.css dikecualikan)
grep -rn "text-zinc-\|bg-zinc-\|border-zinc-\|text-white\|bg-emerald-\|text-emerald-" \
  apps/studio-admin/src \
  --include="*.tsx" --include="*.ts" | wc -l
```

---

## 📦 4. Panduan Desain Komponen (Component Styling)

### A. Kartu & Panel (Cards)

* **Gunakan `<Card>` dari `@k2net/ui`** — Dilarang membuat wrapper card HTML/CSS independen per halaman.
* **GlowingEffect**: `<Card glowingEffect>` — Mengaktifkan glow mouse-tracking, otomatis menonaktifkan `hover:shadow-*`.
  * **DILARANG**: `<Card animatedBeam>` / `<Card beamColor="...">` — props ini sudah **dihapus**.
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
* **Pulsing Dot ONLINE**: `h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_var(--primary)] animate-pulse`

### B. Tombol & Badge

* **Primary CTA** `variant="default"`: `bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] h-9 rounded-lg` — Maks 1 per halaman.
* **Toolbar** `variant="outline"`: `bg-card border-border hover:bg-muted h-9 rounded-lg`.
* **Destructive** `variant="destructive"`: `bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20`.

Badge Status:
| Tipe | Class |
|---|---|
| Brand/ONLINE | `bg-primary/10 text-primary border-primary/20 text-[11px]` |
| SUCCESS tetap | `bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[11px]` |
| OFFLINE/Error | `bg-rose-500/15 text-rose-400 border-rose-500/30 text-[11px]` |
| WARNING | `bg-amber-500/15 text-amber-400 border-amber-500/30 text-[11px]` |

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

### D. Anatomi Form, Tabel & Modal

* **Form Control**: `h-9 rounded-lg focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary`
* **Tabel Header**: `sticky top-0 bg-muted/60 backdrop-blur-md border-b border-border` + teks `text-[10px] font-bold uppercase tracking-wider text-muted-foreground`
* **Tabel Data Row**: `text-sm text-foreground hover:bg-muted/40 transition-colors`
* **Modal**: `bg-card/95 backdrop-blur-2xl border border-border shadow-2xl rounded-xl p-6`
* **Modal Footer**: `flex justify-end gap-2 pt-4 border-t border-border` — Cancel outline kiri, Save primary kanan.

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
