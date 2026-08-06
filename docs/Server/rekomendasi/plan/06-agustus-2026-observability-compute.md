# Plan: Audit & Peningkatan Observability Compute & Host Dashboard

Dokumen ini menjelaskan hasil audit menyeluruh dan rencana peningkatan untuk halaman `/observability/compute` pada platform K2NET FTTH GIS Admin.

---

## 1. Kondisi Saat Ini

### Screenshot Saat Ini
Halaman memiliki:
- **4 KPI Cards**: CPU Usage, RAM Usage, Disk Usage, Database & Cache
- **12 Microservice Status Grid**: status ONLINE/OFFLINE dari Prometheus `up` metric
- **Runtime & Persistence Integrity** (3 cards): JVM Memory Pool, DB Migration, Backup Status
- **HTTP Request Rate chart**: data 30 menit terakhir dari Prometheus (real ✅)
- **MinIO Offsite Disaster Recovery section**: bucket info (hardcoded ❌)
- **Nextcloud Layer 3 Trigger**: tombol palsu hanya toast ❌

---

## 2. Masalah yang Ditemukan (Gap Analysis)

### 🔴 KRITIS

#### BUG #1: Field mapping salah pada devops-stats (JVM Memory "— MB")
- **Root cause**: Halaman membaca `d?.compute?.heapUsedMb` dan `d?.compute?.nonHeapUsedMb`
- **Backend mengirim**: `ComputeInfo { usedMemoryMb, totalMemoryMb, maxMemoryMb }` — tidak ada field `heapUsedMb`/`nonHeapUsedMb`
- **Akibat**: JVM Memory Pool selalu tampil "— MB" meski backend berjalan normal
- **Fix**: Perbaiki mapping ke `d?.compute?.usedMemoryMb` dan data real dari Prometheus JVM metrics

#### BUG #2: Field mapping salah pada devops-stats (DB Migration "— UNKNOWN")
- **Root cause**: Halaman membaca `d?.migration?.version` dan `d?.migration?.status`
- **Backend mengirim**: `DevOpsStatsResponse { lastMigration: MigrationInfo }` — bukan `migration`
- **Akibat**: DB Migration selalu "— UNKNOWN" meski Flyway berhasil
- **Fix**: Perbaiki mapping ke `d?.lastMigration?.version` dan `d?.lastMigration?.success`

#### BUG #3: MinIO Disaster Recovery Section 100% Hardcoded
- **Root cause**: `MinioBackupVisualizerSection` menggunakan array statis hardcoded:
  - `db-backups`: "14.2 GB", 36 files → nilai lama yang tidak diperbarui
  - `code-backups`: "2.8 GB", 12 files → nilai lama
  - `docker-backups`: "8.4 GB", 6 files → nilai lama
- **Akibat**: Data tidak mencerminkan kondisi MinIO riil; tidak ada validasi "SYNCED OK" yang benar
- **Fix**: Fetch real data dari Spring Boot endpoint yang query MinIO (atau dari `storage-gateway`)

---

### 🟡 SEDANG

#### GAP #4: KPI Card "Database & Cache" — Duplikat + Nilai Fallback Hardcoded
- **Duplikat**: Informasi Redis hit ratio dan DB connections sudah ada di `/observability/database`
- **Hardcoded fallback**: `redisCacheHit ?? 94` dan `postgresConns ?? 12` — jika API gagal tampil angka palsu
- **Fix**: Ganti card ke-4 dengan **System Load Average** (`node_load1/5/15`) — data unik, belum ditampilkan di halaman mana pun, dan tersedia dari Prometheus node_load1=1.94

#### GAP #5: Tidak Ada Per-Service Process Memory Chart
- **Data tersedia**: Prometheus memiliki `process_resident_memory_bytes` untuk semua 10+ gateway Go
- **Kondisi saat ini**: Hanya jumlah "12 online · 0 offline" — tidak ada detail resource per-service
- **Nilai tambah**: Mendeteksi memory leak pada gateway individual

#### GAP #6: System Load Average Tidak Ditampilkan
- **Data tersedia**: `node_load1=1.94`, `node_load5=2.54` — tersedia dari Prometheus node_exporter
- **Kondisi saat ini**: Tidak ada satupun card/chart yang menampilkan system load
- **Nilai tambah**: Indikator kunci server overload vs idle

#### GAP #7: Tidak Ada Time-Series Chart untuk CPU/Memory
- **Kondisi saat ini**: Hanya 1 chart (HTTP Request Rate 30 menit)
- **Data tersedia**: Prometheus node_memory dan node_cpu sudah dipakai di halaman `/database` (duplikat fetch)
- **Fix**: Tambah chart CPU/Memory time-series 30 menit di halaman compute — tidak duplikat karena `/database` menampilkan 24 jam, sementara compute menampilkan 30 menit rolling

---

### 🟢 MINOR

#### GAP #8: Nextcloud "Trigger Sync Now" Palsu
- **Kondisi saat ini**: Tombol hanya menampilkan `toast.success(...)` tanpa mengirim request ke mana pun
- **Fix**: Buat API route yang memanggil backend untuk trigger rclone sync, atau tampilkan informasi jadwal saja tanpa tombol palsu

---

## 3. Data yang Sudah Diverifikasi dari Prometheus

```
node_load1    = 1.94  (real ✅)
node_load5    = 2.54  (real ✅)
process_resident_memory_bytes per service:
  node-exporter        16.2 MB
  notification-gateway 17.8 MB
  payment-gateway      16.7 MB
  map-gateway          18.1 MB
  storage-gateway      21.0 MB
  audit-gateway        21.5 MB
  export-gateway       18.7 MB
  scheduler-gateway    17.4 MB
  olt-gateway          17.9 MB
  whatsapp-gateway     16.7 MB

jvm_memory_used_bytes (spring-boot):
  heap    = 71.6 MB
  nonheap = 84.8 MB (estimated from nonheap sum)
  max     = ~171 MB

DevOpsStatsController response structure (REAL):
  d.lastMigration.version     ← bukan d.migration.version
  d.lastMigration.success     ← bukan d.migration.status
  d.lastMigration.installedOn
  d.lastBackup.status         (field: lastStatus)
  d.lastBackup.lastBackupTime
  d.lastBackup.nextBackupTime
  d.compute.usedMemoryMb      ← bukan d.compute.heapUsedMb
  d.compute.totalMemoryMb
  d.compute.maxMemoryMb
```

---

## 4. Rencana Peningkatan

### Priority 1 — Bug Fixes (Wajib Dikerjakan)

#### Fix BUG #1 & #2: Field mapping devops-stats
Perbaiki field mapping di `compute/page.tsx`:
```tsx
// SEBELUM (salah):
migrationVersion: d?.migration?.version
migrationStatus: d?.migration?.status
jvmHeapMb: d?.compute?.heapUsedMb

// SESUDAH (benar):
migrationVersion: d?.lastMigration?.version
migrationStatus: d?.lastMigration?.success ? "SUCCESS" : "UNKNOWN"
jvmHeapMb: d?.compute?.usedMemoryMb   // JVM total used (heap+nonheap approx)
jvmMaxMb: d?.compute?.maxMemoryMb
```

Atau lebih baik: ambil JVM heap langsung dari Prometheus `jvm_memory_used_bytes{area="heap",job="spring-boot"}` melalui API route baru.

#### Fix BUG #3: MinIO Real Data
Buat endpoint `GET /api/v1/system/minio-stats` di Spring Boot (menggunakan MinIO S3 Java SDK via storage-gateway) atau baca dari `storage-gateway:5004/buckets/stats`.

**Alternatif lebih cepat**: Buat Next.js API route `/api/observability/compute-metrics` yang:
1. Fetch Prometheus metrics (load, per-service RSS)
2. Fetch devops-stats (JVM, migration, backup)
3. Fetch storage-gateway bucket stats

---

### Priority 2 — New KPI Cards & Charts

#### Replace Card ke-4: System Load Average
```tsx
// Ganti "Database & Cache" card dengan:
{ label: "System Load", value: `${load1.toFixed(2)}`, sub: `load1 · load5: ${load5.toFixed(2)} · load15: ${load15.toFixed(2)}` }
```

#### New Section: Per-Service Memory Bars
Grid horizontal bars menampilkan RSS memory setiap gateway Go — langsung dari Prometheus `process_resident_memory_bytes`.

#### Extend HTTP Chart → Multi-metric Chart (30 menit)
Tambah 2 chart baru di bawah HTTP Request Rate:
1. **CPU Time-Series** (30 menit rolling) — untuk monitoring beban realtime
2. **System Memory Time-Series** (30 menit rolling) — untuk correlation spike

---

### Priority 3 — MinIO Real Stats

Buat Next.js API route `/api/observability/compute-metrics/route.ts`:
- Parallel fetch ke:
  1. Prometheus: CPU/mem 30 menit, load avg, per-service RSS, HTTP rate
  2. Backend: `/api/v1/system/devops-stats` (JVM, migration, backup)
  3. Storage gateway/backend: bucket stats

---

## 5. Target Setelah Implementasi

| Aspek | Saat Ini | Target |
|---|---|---|
| JVM Memory | — MB (bug) | Real: ~72 MB heap / 171 MB max |
| DB Migration | — UNKNOWN (bug) | Real: V16 SUCCESS |
| Backup Status | pg_dump UNKNOWN (bug) | Real: status dari database_backups |
| KPI Card 4 | Redis hit (duplikat) | System Load Average (unik) |
| MinIO section | Hardcoded data | Real bucket stats |
| Service grid | Status only | Status + RSS memory |
| Charts | 1 chart (HTTP rate) | 3 charts (+ CPU 30m + Memory 30m) |
| Nextcloud trigger | Fake toast | Informasi jadwal (hapus tombol palsu) |

---

## 6. File yang Akan Diubah

| File | Aksi | Keterangan |
|---|---|---|
| `apps/studio-admin/src/app/(dashboard)/observability/compute/page.tsx` | MODIFY | Fix bug + KPI + Per-service memory section |
| `apps/studio-admin/src/app/api/observability/compute-metrics/route.ts` | NEW | API route Prometheus + devops-stats + bucket stats |
| `apps/studio-admin/src/hooks/useComputeObservability.ts` | NEW | Hook polling 30s |
| `apps/api/src/main/java/com/company/ftthgis/api/system/MinioStatsController.java` | NEW | Endpoint real MinIO bucket stats |

