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
---

## 📚 Komponen Lanjutan & Interaksi (Form, Badges, Skeleton, Tooltip, Context Menu)

Untuk spesifikasi input form, status badges, view switcher, skeleton loading, dynamic theme, tooltip, dan context menu, silakan merujuk ke **[rules/styles-components.md](file:///opt/project5/.agents/rules/styles-components.md)**.
