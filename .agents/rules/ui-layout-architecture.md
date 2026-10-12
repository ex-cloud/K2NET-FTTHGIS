# UI Layout Architecture — Standar Baku 2 Lapisan `@k2net/ui`

> **📌 Single Source of Truth** untuk arsitektur tata letak di `studio-admin` dan `studio-tenant`.
> Wajib dipatuhi saat membuat **halaman baru, modul baru, atau layout baru** agar konsistensi UI/UX terjaga.

---

## 🏗️ Gambaran Arsitektur 2 Lapisan

```
┌────────────────────────────────────────────────────────────────────────┐
│ LAPISAN 1: OUTER APP SHELL FRAME (Wadah Global — Tetap per App)         │
│  [AppHeaderShell (h-12)] Logo · Org · Tier · Search ⌘K · AI · Avatar  │
│  ┌───────────────┬───────────────────────────────────────────────────┐ │
│  │ PrimaryRail   │ SecondarySidebarShell (240px)                     │ │
│  │ (48px icons)  │ [SecondarySidebarHeader (h-12 py-2 px-4)]         │ │
│  │               ├───────────────────────────────────────────────────┤ │
│  │               │ LAPISAN 2: INNER PAGE CANVAS (<Outlet />)         │ │
│  │               │  <PageLayout variant="workspace" | "dashboard">   │ │
│  │               │    <PageHero title="..." eyebrow="..." ... │     │ │
│  │               │    {/* Konten Halaman: Cards, Tables, Forms */}   │ │
│  │               │  </PageLayout>                                    │ │
│  └───────────────┴───────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 LAPISAN 1 — Outer App Shell Frame

Komponen Shell adalah **bingkai tetap aplikasi**. Hanya ada di **Layout Root** (`TenantOrgLayout.tsx`, `TenantProjectLayout.tsx`, `AdminLayout.tsx`). **Dilarang keras** menduplikasi Shell di file halaman (`page.tsx` / `*Page.tsx`).

| Komponen Shell | Dimensi | Tanggung Jawab |
|---|---|---|
| `AppHeaderShell` | `h-12` fixed | Top-bar global: Logo, Org Name, Tier, Search ⌘K, AI Copilot, User Avatar |
| `PrimarySidebarShell` | `w-[48px]` | Rail sidebar kiri icon-only navigasi modul utama |
| `SecondarySidebarShell` | `w-[240px]` | Sidebar sekunder sub-navigasi per modul (collapsible) |
| `SecondarySidebarHeader` | `h-12 py-2 px-4` | Header modul aktif + collapse toggle (dilarang `py-5/6/8`) |

---

## 🖼️ LAPISAN 2 — Inner Page Canvas (`<Outlet />`)

Seluruh halaman dengan konten standar **wajib** menggunakan `<PageLayout>` + `<PageHero>`.

### A. `<PageLayout>`
**Import:** `import { PageLayout } from "@k2net/ui";`

| Prop | Tipe | Default | Keterangan |
|---|---|---|---|
| `variant` | `"workspace" \| "dashboard"` | `"dashboard"` | Menentukan padding dan scrolling container |
| `spaceY` | `string` | `"space-y-6"` | Jarak vertikal antar seksi (misal `"space-y-6"`) |
| `maxWidth` | `string` | `"page-layout-container"` | Contoh: `"max-w-5xl"` untuk form sempit |
| `sidePanel` | `ReactNode` | — | Slot panel samping (detail drawer, filter) |
| `showLogoWatermark`| `boolean` | `false` | Watermark logo samar di latar canvas |

* **`variant="workspace"`**: Container `overflow-hidden`, inner scroll `px-6 md:px-12 xl:px-16 py-4 md:py-8`, default `space-y-6`.
* **`variant="dashboard"`**: Container `overflow-y-auto`, padding `px-6 md:px-12 xl:px-16 pt-8`, default `space-y-8`.

---

### B. `<PageHero>`
**Import:** `import { PageHero } from "@k2net/ui";`
Child **pertama** wajib di `<PageLayout>`.

| Prop | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `title` | `ReactNode` | ✅ Ya | Judul H1 halaman (satu-satunya `<h1>`) |
| `icon` | `LucideIcon` | ❌ Opsional | Ikon semantik `text-primary size-5 md:size-6` |
| `eyebrow` | `ReactNode` | ❌ Opsional | Kategori modul uppercase (misal: `"ORGANIZATION · BILLING"`) |
| `subtitle` | `ReactNode` | ❌ Opsional | Deskripsi singkat (`text-xs text-foreground/75`) |
| `meta` | `ReactNode` | ❌ Opsional | Baris metrik inline (`"4 Aktif · 0 Menunggu"`) |
| `actions` | `ReactNode` | ❌ Opsional | Tombol aksi kanan (wajib `size="sm"`) |
| `bordered` | `boolean` | ❌ Opsional | Border-bottom pemisah (default `true`) |

```tsx
<PageLayout variant="workspace" spaceY="space-y-6">
  <PageHero
    eyebrow={t("team.module_label")}
    title={t("team.title")}
    icon={Users}
    subtitle={t("team.subtitle")}
    meta={<><span>{count} {t("team.members")}</span></>}
    actions={
      <>
        <Button size="sm" variant="outline" onClick={refetch}><RefreshCw className="size-3.5" /></Button>
        <Button size="sm" onClick={openInvite}><Plus className="size-3.5" />{t("team.invite")}</Button>
      </>
    }
  />
  {/* Konten Halaman */}
</PageLayout>
```

---

## 🎯 Panduan Pemilihan Varian `<PageLayout>`

### ✅ Gunakan `variant="workspace"` + `spaceY="space-y-6"`:
Jika halaman memiliki **Secondary Sidebar aktif**, tabel data padat, atau form konfigurasi panjang.
* **studio-admin**: `/settings/*`, `/users/*`, `/security/*`, `/gateways/*`, `/observability/*`, `/licenses/*`, `/packages/*`
* **studio-tenant**: `/billing/*`, `/settings`, `/team`, `/project/:id/core/*`, `/project/:id/inventory/*`, `/project/:id/users/*`, `/project/:id/issues/*`, `/project/:id/settings/*`

### ✅ Gunakan `variant="dashboard"` + `spaceY="space-y-8"`:
Jika halaman adalah halaman **mandiri standalone** tanpa Secondary Sidebar atau overview landing.
* **studio-admin**: `/overview`, `/tasks/new`, `/assets-3d`
* **studio-tenant**: `/projects` (homepage), `/usage`, `/integrations`

### 🚫 Pengecualian Valid (Dilarang Menggunakan `<PageLayout>`):
* **GIS Map Canvas** (`/project/:id/gis/*`, `/gis/*`): Menggunakan `<div className="flex flex-col h-full overflow-hidden">` + `<PageHeader>` karena MapBox/Leaflet butuh 100% viewport.
* **Full-Viewport Bounded Table**: Root `flex flex-col w-full h-full overflow-hidden` (Task / Query performance).
* **Full-Screen 3D WebGL**: Root `<div className="relative w-full h-full">` tanpa padding.

---

## 📐 Anatomi Tombol di `actions` PageHero

Semua tombol di toolbar `actions` PageHero **wajib** menggunakan `size="sm"`:
* **Primary CTA**: `size="sm"` (`h-7 px-2.5 text-xs font-medium gap-1.5 bg-foreground text-background`, icon `size-3.5`).
* **Secondary / Outline**: `size="sm"` (`h-7 px-2.5 text-xs font-medium gap-1.5 border-border/80 bg-card`, icon `size-3.5`).
* **Icon-Only**: `size="icon-sm"` (`h-7 w-7 p-0 border-border/80 bg-card text-muted-foreground`, icon `size-3.5`).
* ❌ **Dilarang keras**: Tombol bulky `h-8 px-3 font-semibold` atau `h-10` di sebelah kontrol compact.

---

## 📋 Checklist Wajib Penambahan Modul Baru

1. **Varian Layout**: Secondary Sidebar aktif → `variant="workspace" spaceY="space-y-6"`; Standalone → `variant="dashboard" spaceY="space-y-8"`.
2. **PageHero**: Child pertama di dalam `<PageLayout>`, dengan `title` via `t()`, `eyebrow` uppercase, `icon` semantik.
3. **Ukuran Kontrol**: Tombol aksi PageHero `size="sm"` dengan icon `size-3.5`. Tombol baris tabel `size="xs"` dengan icon `size-3`.
4. **Paritas i18n**: Seluruh teks wajib `t()` dari `@k2net/i18n` (terdaftar di `en/*.json` & `id/*.json`).
5. **KPI Strip**: Menggunakan `<Card glowingEffect>` atau `<MetricCard variant="groove">`.
6. **Token Warna**: 0 hardcode (`text-foreground`, `bg-card`, `border-border`; dilarang `text-zinc-*`, `text-white`).
7. **PBAC Guard**: Admin dilindungi `PermissionGuard` (`system.<modul>.*`); Tenant dilindungi wrapper organisasi/proyek.

---

## 🔗 Referensi Terkait
* PageLayout: [`packages/ui/src/components/page-layout.tsx`](file:///opt/project5/packages/ui/src/components/page-layout.tsx)
* PageHero: [`packages/ui/src/components/layout/page-hero.tsx`](file:///opt/project5/packages/ui/src/components/layout/page-hero.tsx)
* Ukuran Kontrol: [rules/frontend-advanced.md](file:///opt/project5/.agents/rules/frontend-advanced.md)
* Standard Modul: [rules/module-creation-standard.md](file:///opt/project5/.agents/rules/module-creation-standard.md)
