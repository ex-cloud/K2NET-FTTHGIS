# Standar Baku Pembuatan Paket Marketplace (Marketplace Package SOP)

Dokumen ini adalah pedoman arsitektur dan standar kepatuhan wajib (*mandatory engineering standard*) dalam merancang, membangun, dan mengintegrasikan paket marketplace baru pada platform K2NET FTTH GIS Enterprise SaaS.

---

## 🏛️ 1. Paradigma Arsitektur 6-Lapis (6-Pillar Unified SaaS Architecture)

Setiap paket komersial di K2NET bukan sekadar baris data di database, melainkan wajib menghubungkan **6 komponen arsitektur simultan**:

```
[1. Katalog Marketplace]   ──> Tabel platform_packages (SKU, Harga, min_plan_tier, Flyway SQL)
         │
[2. Hak Akses Entitlement] ──> Fitur Biner (feature.*) ATAU Penambahan Kuota (deltaStorage, deltaOdp)
         │
[3. Subscription Tier]     ──> Status: Built-in (ENTERPRISE), Add-on (PRO), atau Terkunci (STARTER/FREE)
         │
[4. Backend Enforcement]   ──> @PreAuthorize (PBAC) ATAU ProjectQuotaService (Assert Quota)
         │
[5. Engine Polyglot]       ──> Rekomendasi Runtime: Java / Go / Python / Rust (lihat marketplace-engines.md)
         │
[6. UI/UX Portal Tenant]   ──> Evaluasi 5 State Kartu Marketplace + Halaman Modul Fungsional
```

---

## 🛡️ 2. Standar Wajib Flyway Migration & Hibernate Envers Audit Schema

Setiap penambahan tabel entitas bisnis baru pada paket marketplace **WAJIB** menyertakan tabel audit Hibernate Envers (`<nama_tabel>_aud`) di dalam file migrasi Flyway yang sama (`V{N}__*.sql`).

> 🛑 **ATURAN MUTLAK**: Seluruh entitas JPA bisnis di K2NET menggunakan anotasi `@Audited` dari Hibernate Envers. Jika tabel bisnis dibuat tanpa tabel `_aud` yang bersesuaian, Spring Boot akan melempar `SchemaManagementException: Table '<nama_tabel>_aud' not found` dan menyebabkan server backend **CRASH / GAGAL STARTUP**.

### Pola Flyway Baku:

```sql
-- ==============================================================================
-- K2NET FTTH GIS — V{N}: Pembuatan Modul Paket {KODE_PAKET}
-- ==============================================================================

-- 1. TABEL BISNIS UTAMA
CREATE TABLE IF NOT EXISTS tenant_{modul_name} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_{modul_name}_org ON tenant_{modul_name}(organization_id);

-- 2. TABEL AUDIT ENVERS (WAJIB ADA DI FILE MIGRATION YANG SAMA!)
CREATE TABLE IF NOT EXISTS tenant_{modul_name}_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT, -- 0: ADD, 1: MOD, 2: DEL
    organization_id UUID,
    status VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(255),
    PRIMARY KEY (rev, id)
);

-- 3. PERMISSION PBAC (JIKA TIPE FITUR BINER)
INSERT INTO permissions (code, name, description, module, scope, created_at, updated_at)
VALUES 
  ('feature.{kategori}.{fitur}', 'Akses Fitur {Nama}', 'Deskripsi hak akses fitur', '{kategori}', 'TENANT', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  module = EXCLUDED.module,
  scope = EXCLUDED.scope,
  updated_at = NOW();

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name IN ('super_admin', 'admin')
  AND p.code = 'feature.{kategori}.{fitur}'
ON CONFLICT DO NOTHING;
```

---

## 📦 3. Pilar 1: Pendaftaran Katalog Dagang (`platform_packages`)

Setiap paket baru wajib didaftarkan pada tabel `platform_packages` melalui SQL idempotent (`ON CONFLICT (code) DO UPDATE`):

| Kolom | Tipe Data | Aturan Pengisian |
|---|---|---|
| `code` | `VARCHAR(64)` | Format huruf kapital snake_case diawali `PKG_` (Contoh: `PKG_TENANT_BRANDING`, `PKG_AI_OTDR`). |
| `name` | `VARCHAR(128)` | Judul komersial resmi paket. |
| `category` | `VARCHAR(64)` | Enum kategori baku: `CAPACITY_BOOSTER`, `INTEGRATION`, `SPATIAL_AI`, `IOT_SENSORS`, `SECURITY_GOV`, `WHITE_LABEL`, `COMPLIANCE_ROW`. |
| `billing_type` | `VARCHAR(32)` | `RECURRING_MONTHLY` (langganan bulanan) atau `ONE_TIME` (lisensi permanen sekali bayar). |
| `price_monthly` | `DECIMAL(12,2)` | Harga nominal dalam IDR (Rupiah). |
| `min_plan_tier` | `VARCHAR(32)` | Tier minimal yang diizinkan membeli paket: `FREE`, `STARTER`, `PRO`, atau `ENTERPRISE`. |
| `prerequisite_codes` | `JSONB` | Array kode paket yang wajib aktif sebelum paket ini dapat dibeli (contoh: `[]` atau `["PKG_SIEM_BASE"]`). |
| `conflict_codes` | `JSONB` | Array kode paket yang saling meniadakan (*mutually exclusive*). |
| `feature_key` | `VARCHAR(128)` | Kode permission PBAC (`feature.*`) jika paket membuka modul fungsional. `NULL` jika paket murni *Capacity Booster*. |
| `quota_delta_json` | `JSONB` | Nilai tambahan kuota jika paket bertipe booster (contoh: `{"deltaOdps": 100}`, `{"deltaStorageGb": 50}`). |
| `is_published` | `BOOLEAN` | `TRUE` jika tampil di katalog publik tenant. |
| `icon_name` | `VARCHAR(64)` | Nama ikon Lucide React (contoh: `Globe`, `Zap`, `Terminal`, `HardDrive`). |
| `sort_order` | `INT` | Urutan penataan kartu di marketplace. |

---

## 🔑 4. Pilar 2 & 3: Entitlement & Formula Hak Akses Runtime

K2NET menerapkan formula evaluasi hak akses runtime terpadu:

$$\text{Hak Akses Efektif} = \text{Built-in Tiers}(\text{Plan}) \cup \text{License Overrides} \cup \bigcup_{p \in \text{Active Packages}} \text{Entitlement}(p)$$

### Matriks Klasifikasi Tier:
1. **`ENTERPRISE` (Rp 12.500.000 / bln)**:
   - Modul level enterprise (Custom Domain, SSO SAML, AI Copilot, SIEM) berstatus **`INCLUDED_IN_PLAN` (Default / Built-in)** tanpa biaya tambahan.
2. **`PRO` (Rp 3.900.000 / bln)**:
   - Tier operasional ISP komersial. Memenuhi syarat (*eligible*) membeli add-on marketplace dengan `min_plan_tier = 'PRO'`.
3. **`STARTER` (Rp 990.000 / bln) & `FREE TRIAL` (Rp 0)**:
   - Terkunci dari paket level PRO/ENTERPRISE. Mencoba mengakses fitur memicu dialog upgrade plan.
4. **`TenantLicense` Cryptographic Overrides**:
   - Super Admin dapat menerbitkan sertifikat lisensi offline B2B yang langsung menyalakan entitlement tertentu terlepas dari plan langganan online.

---

## 🔒 5. Pilar 4: Penegakan Proteksi Backend

Setiap endpoint API yang disediakan oleh modul paket wajib diproteksi:

### A. Untuk Paket Berbasis Fitur Biner (`feature_key`):
Gunakan Spring Security PreAuthorize dengan granular PBAC tenant:
```java
@RestController
@RequestMapping("/api/v1/tenant/branding")
@RequiredArgsConstructor
public class TenantBrandingController {

    @GetMapping
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('feature.branding.whitelabel')")
    public ResponseEntity<TenantBrandingDto> getBranding() { ... }
}
```

### B. Untuk Paket Berbasis Kuota (Booster):
Wajib divalidasi melalui `ProjectQuotaService` sebelum mutasi database:
```java
// Kuota ODP memperhitungkan PKG_BOOSTER_ODP_100
projectQuotaService.assertCanAllocateOdps(organization, count);

// Kuota storage S3 memperhitungkan PKG_BOOSTER_STORAGE_50
projectQuotaService.assertCanUploadBytes(organization, file.getSize());
```

---

## 🎨 6. Pilar 6: Presentasi 5 Status Kartu Marketplace

Komponen antarmuka kartu paket pada halaman `/billing/marketplace` wajib mengevaluasi **5 Status Visual Baku**:

1. **`INCLUDED_IN_PLAN`**:
   - Termasuk dalam paket dasar langganan tenant (misal: Tier ENTERPRISE memiliki whitelabel).
   - Tampilan: Badge hijau *"Termasuk dalam Paket Anda"*, tombol *"Buka Modul"*. Tombol beli disembunyikan.
2. **`ACTIVE_ADDON`**:
   - Paket dibeli terpisah atau didapat dari grant promosi.
   - Tampilan: Badge biru *"Aktif"*, indikator masa aktif (*renewal date*), dan tombol *"Kelola Modul"*.
3. **`READY_TO_BUY`**:
   - Tier tenant memenuhi `min_plan_tier` dan seluruh `prerequisite_codes` terpenuhi.
   - Tampilan: Label harga resmi, tombol *"Beli Paket"* yang membuka alur checkout Xendit.
4. **`REQUIRES_PREREQUISITE`**:
   - Ada paket prasyarat yang belum aktif.
   - Tampilan: Badge peringatan *"Perlu Paket Prasyarat"* dan tawaran paket bundle.
5. **`PLAN_UPGRADE_REQUIRED`**:
   - Tier tenant saat ini lebih rendah dari `min_plan_tier`.
   - Tampilan: Badge gembok *"Terkunci"*, tombol *"Upgrade ke [PRO / ENTERPRISE]"*.

### Standar Anatomi Kontrol UI:
- Tombol aksi kartu wajib menggunakan ukuran baku `size="sm"` (`h-7 px-2.5 text-xs font-medium` dengan ikon `size-3.5`).
- Seluruh teks label, status badge, dan modal dialog **DILARANG KERAS di-hardcode** (*Zero Hardcoded Strings*); wajib menggunakan `useTranslation()` dari `@k2net/i18n` (terdaftar di `en` dan `id`).

---

## 📋 7. Checklist Validasi Sebelum Merge / Push

- [ ] **Flyway**: Versi sekuensial unik `V{N}`, menyertakan tabel bisnis dan tabel audit Envers `_aud`.
- [ ] **Envers Consistency**: Entitas `@Audited` memiliki tabel `_aud` yang lolos uji startup (`mvn test-compile -q`).
- [ ] **PBAC / Quota**: Endpoint dilindungi `@PreAuthorize` permission eksplisit atau `ProjectQuotaService`.
- [ ] **Engine**: Bahasa engine dipilih sesuai panduan [rules/marketplace-engines.md](file:///opt/project5/.agents/rules/marketplace-engines.md).
- [ ] **Lint & Types**: `pnpm lint` 0 errors & 0 warnings, `tsc --noEmit` lolos 100%.
- [ ] **i18n**: Seluruh key terjemahan terdaftar serentak di bahasa Inggris (`en`) dan Indonesia (`id`).
- [ ] **Design System**: Lolos `pnpm audit:colors` (0 pelanggaran) dan `pnpm audit:design-system all` (0 fatal errors).
