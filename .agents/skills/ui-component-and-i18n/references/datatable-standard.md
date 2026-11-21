# 📊 Standar Universal Enterprise DataTable Berbasis TanStack Table v8 (`@k2net/ui`)

> **Rujukan Arsitektur**: [ADR-0020: Standarisasi Universal Enterprise DataTable (TanStack Table) di `@k2net/ui`](../../../docs/sop_sdlc/adr/0020-standarisasi-universal-enterprise-data-table-tanstack-table-di-k2net-ui.md)  
> **Rencana Aksi Migrasi**: [Plan 2026-11-21: Migrasi Komprehensif Seluruh Tabel ke Universal DataTable](../../../docs/sop_sdlc/plans/active/2026-11-21-migrasi-komprehensif-seluruh-tabel-ke-universal-datatable-tanstack.md)  
> **Script Audit Monorepo**: `pnpm audit:tables` (`scripts/audit-tables.sh`)

---

## 🎯 1. Filosofi & Prinsip Headless Architecture

Semua tampilan berbentuk tabel data pada **K2NET FTTH GIS SaaS Platform** (`apps/studio-admin`, `apps/studio-tenant`, dan paket pendukung) **DILARANG KERAS** menggunakan tag HTML primitif `<table>` native atau melakukan iterasi baris `.map()` manual.

### Mengapa TanStack Table v8 Headless?
1. **Decoupling Logika dari Visual**: TanStack Table v8 mengelola *state machine* tabel (pengurutan, paginasi, filter baris/kolom, seleksi checkbox, visibilitas kolom) tanpa memaksakan markup HTML kaku.
2. **Performa O(1) & Anti-Re-render**: Menghindari lag rendering pada dataset ribuan baris data telemetri FTTH, log sistem, maupun daftar pelanggan.
3. **Standarisasi UI Terpusat di `@k2net/ui`**: Seluruh token warna monokrom semantik, efek shimmer loading skeleton, header sticky dengan latar belakang blur, dan ukuran kontrol row action `size="xs"` dikelola secara terpusat di satu komponen: `<DataTable<T>>`.
4. **Ekstensibilitas Masa Depan**: Ketika fitur baru TanStack Table v8 (seperti *Virtualization*, *Column Pinning*, *Row Grouping*, *Faceted Filters*) diadopsi, seluruh halaman di monorepo langsung mewarisi kemampuan tersebut tanpa refactoring masif.

---

## 📦 2. Anatomi Komponen & API Props `<DataTable<T>>`

Komponen diekspor langsung dari `@k2net/ui`:

```typescript
import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type PaginationState,
  type RowSelectionState,
} from "@k2net/ui";
```

### Properti Utama `<DataTable<T>>`

| Properti | Tipe | Default | Deskripsi |
|---|---|---|---|
| `columns` | `ColumnDef<T, any>[]` | **Wajib** | Definisi kolom TanStack Table type-safe |
| `data` | `T[]` | **Wajib** | Array data entitas yang akan dirender |
| `isLoading` | `boolean` | `false` | Menampilkan baris shimmer skeleton otomatis |
| `loadingRowCount` | `number` | `5` | Jumlah baris skeleton saat loading |
| `density` | `"compact" \| "comfortable"` | `"compact"` | Kerapatan padding baris (compact = enterprise density) |
| `emptyState` | `{ title: string; description?: string; action?: ReactNode }` | `undefined` | Konten deklaratif saat `data.length === 0` |
| `onRowClick` | `(row: T) => void` | `undefined` | Callback klik interaktif pada baris |
| `pageSizeOptions` | `number[]` | `[10, 20, 30, 50]` | Pilihan ukuran halaman paginasi |
| `enableSorting` | `boolean` | `true` | Mengaktifkan pengurutan kolom |
| `enablePagination` | `boolean` | `true` | Menampilkan kontrol paginasi di footer |
| `enableRowSelection` | `boolean` | `false` | Mengaktifkan seleksi multi-baris (checkbox) |

---

## 💻 3. Contoh Implementasi Baku (Copy-Pasteable Boilerplate)

Gunakan pola ini setiap kali Anda membuat komponen tabel baru:

```tsx
import React, { useMemo } from "react";
import {
  DataTable,
  DataTableColumnHeader,
  Button,
  Badge,
  type ColumnDef,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Eye, MoreHorizontal, ShieldCheck } from "lucide-react";

export interface TenantCustomer {
  id: string;
  customerCode: string;
  fullName: string;
  packagePlan: string;
  status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
  opticalPowerDbm: number;
  registeredAt: string;
}

interface CustomerTableProps {
  customers: TenantCustomer[];
  isLoading?: boolean;
  onInspect: (customer: TenantCustomer) => void;
}

export function CustomerTable({
  customers,
  isLoading,
  onInspect,
}: CustomerTableProps) {
  const { t } = useTranslation();

  const columns = useMemo<ColumnDef<TenantCustomer>[]>(
    () => [
      {
        accessorKey: "customerCode",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("customer.code")} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-foreground">
            {row.original.customerCode}
          </span>
        ),
      },
      {
        accessorKey: "fullName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("customer.name")} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{row.original.fullName}</span>
            <span className="text-[11px] text-muted-foreground">{row.original.packagePlan}</span>
          </div>
        ),
      },
      {
        accessorKey: "opticalPowerDbm",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("customer.opticalRx")} />
        ),
        cell: ({ row }) => {
          const dbm = row.original.opticalPowerDbm;
          const isWarning = dbm < -24.0;
          return (
            <span
              className={`font-mono text-xs ${
                isWarning ? "text-amber-500 font-semibold" : "text-muted-foreground"
              }`}
            >
              {dbm.toFixed(1)} dBm
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("common.status")} />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant={
                status === "ACTIVE"
                  ? "outline"
                  : status === "SUSPENDED"
                  ? "secondary"
                  : "destructive"
              }
              className="text-[10px] uppercase font-mono tracking-wider"
            >
              {status}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {/* ATURAN BAKU: Tombol baris tabel WAJIB size="xs" */}
            <Button
              size="xs"
              variant="ghost"
              className="h-6 px-2 text-[11px] gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onInspect(row.original);
              }}
            >
              <Eye className="size-3" />
              <span>{t("common.inspect")}</span>
            </Button>
          </div>
        ),
      },
    ],
    [t, onInspect]
  );

  return (
    <DataTable
      columns={columns}
      data={customers}
      isLoading={isLoading}
      density="compact"
      onRowClick={(customer) => onInspect(customer)}
      emptyState={{
        title: t("customer.emptyTitle"),
        description: t("customer.emptyDescription"),
      }}
    />
  );
}
```

---

## 🎨 4. Aturan Desain & Anatomi Kontrol (Design Tokens)

1. **Ukuran Tombol Baris Tabel (Row Actions)**:
   - **WAJIB**: `size="xs"` (`h-6 px-2 text-[11px]`, ikon `size-3`) atau `size="icon-xs"` (`h-6 w-6`).
   - **DILARANG**: `size="sm"` (`h-7`) atau `size="default"` (`h-8`/`h-10`) di dalam sel baris data padat.
2. **Pewarnaan Monokrom Semantik**:
   - Header background: `bg-card/95 backdrop-blur-sm border-b border-border/80`
   - Baris genap/ganjil: `hover:bg-muted/40 transition-colors`
   - Teks utama: `text-foreground font-medium text-xs`
   - Teks sekunder/keterangan: `text-muted-foreground text-[11px]`
   - Dilarang keras: `bg-zinc-*`, `text-zinc-*`, `text-white`, hex manual (`#ffffff`).
3. **Paritas 100% `@k2net/i18n`**:
   - Header kolom, empty state, pagination label, dan tooltip aksi wajib menggunakan `t("...")` dari `@k2net/i18n`.
   - Dilarang hardcode string teks bahasa Indonesia atau bahasa Inggris mentah di dalam file TSX.

---

## 🛡️ 5. Checklist Kepatuhan AI Agent Sebelum Menyelesaikan Tugas

Sebelum menutup sesi pengerjaan halaman tabel, AI Agent **WAJIB** memverifikasi poin berikut:

- [ ] Menggunakan `import { DataTable } from "@k2net/ui"` (Bukan tag `<table>` native).
- [ ] Kolom didefinisikan dengan type-safe `ColumnDef<T>[]` dan dibungkus `useMemo`.
- [ ] Header kolom menggunakan `<DataTableColumnHeader column={column} title={...} />`.
- [ ] Tombol aksi di baris tabel menggunakan `size="xs"` dengan ikon `size-3`.
- [ ] Mengatur prop `density="compact"` untuk tampilan data enterprise padat.
- [ ] Menyediakan `emptyState` deklaratif yang terdaftar di i18n (`en/*.json` & `id/*.json`).
- [ ] Mendukung prop `isLoading` untuk shimmer loading skeleton otomatis.
- [ ] Menjalankan verifikasi otomatis:
  ```bash
  pnpm audit:tables
  pnpm audit:colors
  pnpm audit:design-system
  pnpm audit:i18n
  pnpm lint:strict
  ```
