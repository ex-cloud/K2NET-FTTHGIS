---
name: marketplace-package-builder
description: >-
  Use this skill when designing, building, or modifying a commercial add-on package or
  capacity booster in the K2NET Marketplace (/billing/marketplace). Covers the 6-Pillar
  SaaS architecture: platform_packages catalog SQL, Hibernate Envers _aud tables,
  runtime entitlement formulas, polyglot engine selection (Java, Go, Python, Rust),
  and the 5 UI card evaluation states.
---

# SOP: Pembuatan Paket Add-On & Capacity Booster Marketplace (6-Pilar)

Gunakan skill ini saat merancang atau mengimplementasikan paket fitur komersial (`PKG_*`) maupun capacity booster di katalog Marketplace K2NET.

## Referensi Lengkap
- [Standar 6-Pilar Paket Marketplace](./references/marketplace-package-standard.md)
- [Matriks Pemilihan Bahasa Engine Polyglot (Java, Go, Python, Rust)](./references/marketplace-engines.md)

---

## Alur Eksekusi 6-Pilar

1. **Pilar 1 — Katalog `platform_packages` & Skema Audit Envers (`_aud`)**:
   - Buat migrasi Flyway `V<N+1>__*.sql` yang mendaftarkan SKU paket (`PKG_*`) ke tabel `platform_packages` secara idempotent (`ON CONFLICT (code) DO UPDATE`).
   - Setiap tabel entitas baru beranotasi `@Audited` **wajib** memiliki tabel pendamping `<nama_tabel>_aud` di migrasi yang sama agar Hibernate Envers tidak gagal saat startup.
2. **Pilar 2 & 3 — Entitlement & Tier Matrix (`FREE`, `STARTER`, `PRO`, `ENTERPRISE`)**:
   - Tentukan apakah paket berupa **Fitur Biner** (`feature_key = 'feature.<kategori>.<fitur>'`, scope `'TENANT'`) atau **Capacity Booster** (`quota_delta_json = '{"deltaOdps": 100}'`).
3. **Pilar 4 — Penegakan Proteksi Backend**:
   - Fitur biner wajib dilindungi `@PreAuthorize("@tenantSecurity.hasEffectivePermission('feature.<kategori>.<fitur>')")`.
   - Booster kuota wajib divalidasi via `ProjectQuotaService.assertCanAllocate...` sebelum mutasi database.
4. **Pilar 5 — Pemilihan Bahasa Engine Polyglot**:
   - **Java (Spring Boot :9090)**: Transaksi ACID, billing, lisensi, CRUD relasional Envers.
   - **Golang (Port 5001–5014)**: High-concurrency I/O, SNMP polling, S3 streaming, Auth BFF, WA broadcast.
   - **Python (`gateway-ai` :5012)**: Parsing biner optik `.SOR` (`pyotdr`), AI/ML, pgRouting Steiner Tree.
   - **Rust**: Pemrosesan telemetri tanpa GC pause & rendering raster spasial ekstrem.
5. **Pilar 6 — Evaluasi 5 Status Kartu UI di Portal Tenant**:
   - Pastikan kartu di `/billing/marketplace` menangani 5 state: `INCLUDED_IN_PLAN`, `ACTIVE_ADDON`, `READY_TO_BUY`, `REQUIRES_PREREQUISITE`, dan `PLAN_UPGRADE_REQUIRED` dengan ukuran tombol `size="sm"` dan terjemahan penuh di `@k2net/i18n` (`en` & `id`).

