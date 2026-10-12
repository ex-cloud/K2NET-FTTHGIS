# UI Styles — Komponen Form, Skeleton, Tema & Context Menu

> **Lanjutan dari** [rules/styles.md](file:///opt/project5/.agents/rules/styles.md).
> Dokumen ini mencakup: Form Inputs, Badges, Switchers, Anti-Patterns, Skeleton CSR, Dynamic Theme, Tooltip, dan Context Menu.

---

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

---

## ⏳ 5. Skeleton Loading State (Vite CSR Pattern)

> ⚠️ **PERINGATAN MIGRASI**: Pola `loading.tsx` adalah arsitektur **Next.js App Router** dan sudah **tidak berlaku** sejak migrasi ke **Vite CSR SPA** (September 2026). Dilarang membuat `loading.tsx` di `studio-admin` maupun `studio-tenant`.

### Pola Skeleton Wajib untuk Vite CSR:

Skeleton ditampilkan sebagai **state kondisional** di dalam komponen, bukan sebagai file route terpisah:

```tsx
import { TablePageSkeleton } from "@k2net/ui";

export function MyPage() {
  const { data, isLoading } = useQuery(...);
  if (isLoading) return <TablePageSkeleton />;
  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* konten */}
    </PageLayout>
  );
}
```

### Katalog Komponen Skeleton (`@k2net/ui`):

| Komponen | Digunakan di |
|---|---|
| `DashboardPageSkeleton` | Halaman overview/dashboard (`variant="dashboard"`) |
| `TablePageSkeleton` | Halaman dengan tabel data utama |
| `CardGridSkeleton` | Halaman dengan grid kartu (gateways, monitoring) |
| `FormPageSkeleton` | Halaman settings / form konfigurasi panjang |
| `PageHeaderSkeleton` | Fallback ringan saat hanya header yang menunggu data |

**Jika tidak ada skeleton yang cocok**, tambahkan varian baru di `packages/ui/src/components/skeletons.tsx` — jangan buat skeleton ad-hoc langsung di komponen halaman.

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

**High-Contrast Light Mode Token Standard (Agustus 2026):**
* `--muted-foreground` di `.light`: Gunakan `hsl(0 0% 30%)` — lebih gelap agar terbaca di latar putih.
* **Label eyebrow/kategori card**: `text-foreground/75 dark:text-muted-foreground` (bukan `text-muted-foreground` murni yang terlalu pucat di light mode).
* **Header sub-kategori panel**: `text-foreground/75 dark:text-muted-foreground/70`.
* File `globals.css` berisi override `.light` sebagai **safety net fallback** — bukan pengganti migrasi komponen.

*Referensi lengkap: [design_tokens_spec.md](file:///opt/project5/docs/Server/UI/theme/design_tokens_spec.md)*

---

## 🎯 7. Standar Wajib Tooltip Global (Linear-Style Pill)

Seluruh tombol aksi (khususnya *icon-only buttons*) **wajib** dibungkus menggunakan `<ActionTooltip>` dari `@k2net/ui`.

* **Zero Arrow**: Dilarang menggunakan panah segitiga putih default (`showArrow=false`).
* **Dark Pill**: `bg-popover text-popover-foreground border border-border shadow-xl rounded-lg px-2.5 py-1 text-[11px] font-medium`.
* **Shortcut Dinamis (`shortcut`)**: Wajib menyertakan shortcut keyboard jika aksi memiliki hotkey:
  * `"S"` → sync, `"R"` → refresh, `"C"` → create, `"⌘K"` → search, `"Del"` → delete, `"Alt+F"` → favorit
* **Offset**: Default `sideOffset={6}` (`side="bottom"`).

```tsx
<ActionTooltip label="Sinkronkan Server" shortcut="S">
  <Button size="icon-sm" onClick={handleSync}>
    <RefreshCw className="size-3.5" />
  </Button>
</ActionTooltip>
```

---

## 🖱️ 8. Standar Wajib Right-Click Context Menu Global (Enterprise Action Drawer)

Seluruh tabel data dan entitas enterprise **wajib** mendukung klik kanan menggunakan `<UniversalContextMenu>` dari `@k2net/ui`.

**Struktur Baku 4 Grup:**
1. **AI Copilot & Quick Action** — Tanya AI (`Sparkles`, `Ctrl+J`), Inspeksi (`BrainCircuit`, `Alt+I`)
2. **Sub-menus Bertingkat** — Status/Prioritas (jika relevan)
3. **Clipboard** — Salin Judul (`Ctrl+C`), Salin ID (`Alt+C`)
4. **Destructive** — Hapus (`variant="destructive"`, `Del`) + wajib konfirmasi dialog/toast sebelum eksekusi

**Aksesibilitas & Feedback**: Wajib feedback instan (toast / dialog konfirmasi) setelah aksi dieksekusi.
