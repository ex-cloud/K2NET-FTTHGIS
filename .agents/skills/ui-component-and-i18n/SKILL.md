---
name: ui-component-and-i18n
description: >-
  Use this skill whenever creating or modifying React pages, layouts, forms, modals,
  tables, TipTap editors, or shared UI components in @k2net/ui, apps/studio-admin,
  or apps/studio-tenant. Enforces the 2-Layer Layout Architecture, Monochrome Enterprise
  semantic tokens, control anatomy (size="sm" and size="xs"), and 100% EN/ID i18n parity.
---

# SOP: Pembuatan Komponen UI React, Tata Letak 2-Lapisan (`@k2net/ui`), & Paritas i18n

Gunakan skill ini setiap kali membuat atau mengubah tampilan frontend di `packages/ui`, `apps/studio-admin`, atau `apps/studio-tenant`.

## Referensi Lengkap
- [Arsitektur Tata Letak 2-Lapisan (`PageLayout` & `PageHero`)](./references/ui-layout-architecture.md)
- [Spesifikasi Komponen Form, Badge, Tabel, & Skeleton CSR](./references/styles-components.md)
- [Standar Fitur Lanjutan: Linear Tasks, Responsive, Tooltip, & Anatomi Kontrol](./references/frontend-advanced.md)
- [Manajemen Knowledge Base AI & TipTap Editor](./references/ai-knowledge.md)
- [Riwayat Implementasi Platform & UI](./references/dev-history-platform.md)

---

## Checklist Eksekusi Wajib UI & Frontend

### 1. Gunakan Shared Primitives & Layout Shell dari `@k2net/ui`
- **Dilarang menduplikasi komponen primitif** di dalam aplikasi; impor dari `@k2net/ui`.
- **Sub-Sidebar Header**: Wajib `<SecondarySidebarHeader />` (`h-12 py-2 px-4 border-b border-border/40`).
- **Kanvas Halaman**: Wajib menggunakan `<PageLayout variant="workspace" | "dashboard">` + `<PageHero>` (atau `<PageHeader>` + `<PageContentShell>`).
- **KPI Strip**: Gunakan `<Card glowingEffect>` atau `<MetricCard variant="groove" />`.
- **Loading State (Vite CSR)**: Gunakan komponen skeleton dari `@k2net/ui` (`TablePageSkeleton`, `DashboardPageSkeleton`, `CardGridSkeleton`) secara kondisional di dalam komponen (dilarang membuat `loading.tsx` ala Next.js).

### 2. Anatomi Ukuran Kontrol & Estetika Monokrom
- **Toolbar & Card Footer Buttons**: Wajib `size="sm"` (`h-7 px-2.5 text-xs font-medium`, ikon `size-3.5`).
- **Data Table Row Actions**: Wajib `size="xs"` (`h-6 px-2 text-[11px]`, ikon `size-3`) atau `size="icon-xs"` (`h-6 w-6`).
- **Warna Semantik Monokrom**: Gunakan `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`. **Dilarang keras** hardcode `bg-zinc-*`, `text-zinc-*`, `text-white`, atau mewarnai tombol CTA utama dengan warna hijau/ungu mencolok.

### 3. Zero Hardcoded Strings & Paritas 100% `@k2net/i18n`
- Seluruh teks UI, label, placeholder, toast, empty state, dan dialog konfirmasi wajib menggunakan `useTranslation()` dari `@k2net/i18n`.
- Setiap key baru wajib ditambahkan secara simultan di `packages/i18n/src/locales/en/*.json` dan `packages/i18n/src/locales/id/*.json`.

### 4. Perintah Verifikasi Wajib Sebelum Selesai
```bash
pnpm audit:colors
pnpm audit:design-system
pnpm audit:i18n
pnpm typecheck
pnpm lint:strict
```

