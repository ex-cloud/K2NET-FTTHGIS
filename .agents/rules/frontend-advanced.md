# Frontend Advanced — Standar Modul, Interaksi & i18n

> **Lanjutan dari** [rules/frontend.md](file:///opt/project5/.agents/rules/frontend.md).
> Dokumen ini mencakup Seksi 9–16: Task Management, Responsif, Tooltip, Context Menu, KPI, 3D, i18n, dan Anatomi Kontrol UI.

---

## 🎯 9. Standardisasi Modul Task Management & Linear App Mental Model

Seluruh pengembangan modul manajemen tugas pada `apps/studio-admin` maupun `apps/studio-tenant` **wajib** mengikuti hierarki dan pola interaksi **Linear App (`linear.app`)**:

### A. Hierarki Entitas (Projects vs Issues)
* **Workspace**: Ruang kerja organisasi K2NET (`PLATFORM_INTERNAL` untuk Studio Admin, `TENANT_INTERNAL` untuk Studio Tenant).
* **Projects (Inisiatif / Plan Besar)**: Entitas payung untuk rencana kerja skala besar. Memiliki target date, progress percentage, dan health status.
* **Issues / Tasks / Tickets (Unit Kerja Terkecil)**:
  * `type: "PROJECT"` (Pekerjaan bagian dari project plan)
  * `type: "TICKET"` (Tiket gangguan / permintaan bantuan B2B tenant)
  * `parent_task_id` (Relasi anak tugas / Sub-issue)
  * `labels` (Tag kategori: `Bug`, `GIS Spasial`, `Fiber Routing`, `FO Cut`, dll.)

### B. Floating Pill Modal "New Issue" (`NewTaskDialog`)
Dialog pembuatan tugas **dilarang** menggunakan form bertingkat panjang. Wajib floating window minimalis dengan **Pill Button Bar** di bagian bawah:
1. **Title & Description Canvas**: Input judul borderless besar + textarea deskripsi auto-resize.
2. **Pill Buttons Row**: Status · Priority · Assignee · Project · Labels
3. **Footer Actions**: Lampiran `📎`, toggle `Create more`, tombol submit `Create Issue`.

### C. Full-Page & Side-Sheet Task Canvas
* **Header Bar**: Breadcrumb `Projects › [Project Name] › [Task Ref]` + tombol aksi full-page/close.
* **Left Canvas**: Title inline-editable, description markdown auto-save (debounce 1.5s), sub-issues, activity & comments.
* **Right Properties Sidebar (w-72)**: Status, Priority, Assignee, Due Date (inline dropdown editable), Labels chip manager, Project link badge.

### D. Pola Bounded Scroll Table (Query-Performance Pattern)
* **Root Container**: `flex flex-col w-full h-full bg-background overflow-hidden` — jangan bungkus `<PageLayout>`.
* **Inner Card Wrapper**: `border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col`.
* **Scroll Area**: `div.flex-1.min-h-0.overflow-auto.custom-scrollbar-thin` — scroll hanya di dalam tabel.
* **Infinite Scroll**: Wajib `IntersectionObserver` pada sentinel, page size default `20`.

---

## 📱 10. Standar Desain Responsif Multi-Perangkat

Setiap halaman **wajib** responsif di seluruh resolusi layar:

| Breakpoint | Resolusi | Target | Aturan Layout |
| :--- | :--- | :--- | :--- |
| **Mobile (`< 768px`)** | 360px–430px | iPhone, Android | Sidebar off-canvas/drawer. Padding `px-3.5 py-4`. Grid `grid-cols-1`. Tabel `overflow-x-auto`. Tombol min `h-9`. |
| **Tablet (`768–1023px`)** | 768px–1024px | iPad, Galaxy Tab | Sidebar icon-only (50px). Padding `px-4 md:px-6`. Grid `md:grid-cols-2`. |
| **Desktop (`1024–1439px`)** | 1280px–1440px | MacBook, 1080p | Main Sidebar (50px/200px) + Secondary (240px). Form `lg:grid-cols-12`. |
| **Ultra-Wide (`≥1440px`)** | 1920px–4K | Monitor 24"-34" | Container `max-w-[95rem]` terpusat. Tabel `minmax(320px, 1fr)`. Dilarang black void di kanan. |

**Aturan Komponen Interaktif:**
1. **Interactive Canvas**: Tangani mouse & touch gestures. Toolbar zoom/pan mengambang di sudut kanan atas.
2. **Sticky Headers**: Solid opaque `bg-card` / `bg-background` + `z-20`.
3. **Tab Bar**: `overflow-x-auto whitespace-nowrap` agar tidak terpotong di mobile.

---

## 🎯 11. Standar Wajib Tooltip Global (Linear-Style)

Seluruh tombol aksi (khususnya *icon-only buttons*) **WAJIB** dibungkus `<ActionTooltip>` dari `@k2net/ui`.

**Aturan:**
1. **Zero Arrow**: Dilarang panah segitiga putih default. Dark pill: `bg-popover text-popover-foreground border border-border shadow-xl rounded-lg px-2.5 py-1 text-[11px] font-medium`.
2. **Shortcut Dinamis**: Wajib isi `shortcut` jika ada hotkey (`"S"` sync, `"R"` refresh, `"C"` create, `"⌘K"` search, `"Del"` delete).
3. **Offset**: Default `sideOffset={6}` (`side="bottom"`).

```tsx
import { ActionTooltip } from "@k2net/ui";
<ActionTooltip label="Sinkronkan" shortcut="S">
  <button className="h-7 w-7 ..."><FolderSync className="size-3.5" /></button>
</ActionTooltip>
```

---

## 🖱️ 12. Standar Wajib Right-Click Context Menu (Enterprise Action Drawer)

Setiap tabel data enterprise & daftar entitas **WAJIB** mendukung klik kanan menggunakan `<UniversalContextMenu>` dari `@k2net/ui`.

**Struktur Baku (4 Grup):**
1. **AI Copilot** — Tanya AI (`Sparkles`, `Ctrl+J`), Inspeksi Vektor (`BrainCircuit`, `Alt+I`)
2. **Sub-Menu Bertingkat** — Status, Prioritas, Assignee (jika relevan)
3. **Clipboard** — Salin Judul (`Ctrl+C`), Salin UUID (`Alt+C`)
4. **Destructive** — Hapus (`variant="destructive"`, `Del`) + konfirmasi dialog wajib

```tsx
import { UniversalContextMenu } from "@k2net/ui";
<UniversalContextMenu groups={contextMenuGroups}>
  <tr className="hover:bg-muted/40 cursor-pointer">...</tr>
</UniversalContextMenu>
```

---

## 💡 13. Standar Wajib KPI Cards & Efek Glow (GlowingEffect)

Seluruh baris KPI / Metric Summary Strip **WAJIB** menggunakan efek border glow dinamis:

* **Komponen**: `<Card glowingEffect>` dari `@k2net/ui` — mouse-tracking primary border glow.
* **Dilarang**: `hover:border-primary/60` statis pada KPI summary cards utama.
* **Grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full`
* **Anatomi Internal**:
  * Label: `text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase`
  * Nilai Utama: `text-2xl font-bold text-foreground font-mono`
  * Progress Bar: `h-1.5 bg-muted rounded-full overflow-hidden`

---

## 🌌 14. Arsitektur Visualisasi 3D (Three.js) & Animasi DOM (Framer Motion)

**Prinsip Pemisahan Tanggung Jawab:**
1. **WebGL Canvas (Three.js)**: Semua kalkulasi rotasi, partikel, fisika pegas, mouse parallax dikerjakan di render loop Three.js. **DILARANG** mengikat Framer Motion untuk mesh 3D.
2. **DOM HTML (Framer Motion)**: Hanya untuk elemen pembungkus di luar canvas (slide-in drawer, fade-in card, teks overlay).
3. **Cleanup Wajib saat Unmount**: `cancelAnimationFrame`, `resizeObserver.disconnect()`, `geometry.dispose()`, `material.dispose()`.

---

## 🌐 15. Standar Baku i18n & Anti-Hardcoded Strings (`@k2net/i18n`)

> 🛑 **ATURAN MUTLAK LEVEL 1**: Dilarang keras menuliskan teks UI, judul, deskripsi, placeholder, tooltip, pesan validasi, toast, dialog konfirmasi secara langsung (hardcoded) di berkas JSX/TSX.

**Kaidah Implementasi:**
1. **Hook `useTranslation()`**: Wajib diimport dari `@k2net/i18n` di setiap komponen UI:
   ```tsx
   const { t, formatNumber, formatCurrency, formatDate } = useTranslation();
   return <Button>{t("gis.create_project")}</Button>;
   ```
2. **Dual-Locale Parity**: Setiap key baru wajib didaftarkan **simultan** di:
   * `packages/i18n/src/locales/en/<modul>.json`
   * `packages/i18n/src/locales/id/<modul>.json`
3. **Interpolasi Dinamis**: Gunakan `{param}` atau `{{param}}`:
   ```tsx
   t("projects.quota_exceeded", { used: 3, max: 5, tier: "PRO" })
   ```
4. **Normalisasi Enum**: Selalu gunakan fallback (`project.status || "PRODUCTION"`) agar UI tidak menampilkan badge kosong.

---

## 📐 16. Standar Anatomi Ukuran Kontrol UI & Skala Densitas Baku

| Area UI | Ukuran | Kelas Tailwind Wajib | Icon |
|---|---|---|---|
| **Toolbar Primary CTA** | `size="sm"` | `h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs bg-foreground text-background` | `size-3.5` |
| **Toolbar Controls / Dropdown** | `size="sm"` | `h-7 px-2.5 text-xs font-medium gap-1.5 border-border/80 bg-card hover:bg-accent` | `size-3.5` |
| **Toolbar Icon-Only (Refresh)** | `size="icon-sm"` | `h-7 w-7 p-0 border-border/80 bg-card hover:bg-accent text-muted-foreground` | `size-3.5` |
| **Toolbar Search Input** | Input | `h-7.5 pl-8 text-xs bg-muted/20 border-border/80 rounded-md` | `size-3.5` |
| **Toolbar Filter Tabs** | TabsList | `h-7.5 p-0.5 bg-muted/60 border border-border/60 rounded-md` (Trigger: `h-6.5 px-2.5 text-xs`) | — |
| **View Switcher** | Segmented | Container: `rounded-md border border-border/80 bg-card p-0.5` (Button: `p-1 rounded-sm`) | `size-3.5` |
| **Card Footer Actions** | `size="sm"` | `h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md` | `size-3.5` |
| **Data Table Row Actions** | `size="xs"` | `h-6 px-2 text-[11px] font-medium gap-1 rounded-md` | `size-3` |
| **Data Table Row 3-Dots** | `size="icon-xs"` | `h-6 w-6 text-muted-foreground hover:text-foreground` | `size-3` |
| **Status Badge (Card)** | Badge MD | `px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider` | — |
| **Status Badge (Table)** | Badge Dense | `px-1.5 py-0.2 text-[10px] font-mono font-semibold uppercase tracking-wider` | — |
