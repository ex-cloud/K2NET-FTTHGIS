# Plan: Audit & Peningkatan Observability API Gateway Dashboard

Dokumen ini menjelaskan hasil audit menyeluruh dan rencana peningkatan untuk halaman **API Gateway** (`https://system-gis.k2net.id/observability/api-gateway`) pada platform K2NET FTTH GIS.

---

## 🔍 Analisis Kondisi Saat Ini

### 1. Arsitektur Data Real yang Sudah Ada

Halaman saat ini sudah terhubung ke data riil melalui dua API route Next.js:

| API Route | Sumber Data | Polling |
|---|---|---|
| `/api/observability/kong-routes` | `http://kong:8001/routes` + `http://kong:8001/services` | 30 detik |
| `/api/observability/kong-traffic` | `http://kong:8001/status` | 10 detik |

**Data real yang sudah ditampilkan:**
- Total requests handled (`server.total_requests`)
- Active connections (`server.connections_active`)
- Daftar 15 routes aktif dengan nama service upstream
- 11 services terregistrasi

**Kong actual state (06 Agustus 2026):**
```json
{
  "server": {
    "connections_active": 13,
    "total_requests": 24,
    "connections_handled": 24,
    "connections_accepted": 24,
    "connections_waiting": 0
  },
  "configuration_hash": "6ce3ad78696af2908794ec4b83a8aa7e"
}
```

**15 Routes aktif di Kong:**
| Route Name | Path | Methods | Upstream Service |
|---|---|---|---|
| `backend-api-route` | `/api/v1` | ALL | `backend:9090` |
| `backend-actuator-route` | `/actuator` | ALL | `backend:9090` |
| `backend-github-webhook-route` | `/api/github/webhook` | POST | `backend:9090` |
| `audit-route` | `/api/v1/audit` | ALL | `ftth-audit-gateway:5009` |
| `notify-route` | `/api/v1/notify` | ALL | `ftth-notification-gateway:5001` |
| `payment-invoice-route` | `/api/v1/invoice` | ALL | `ftth-payment-gateway:5002` |
| `payment-webhook-route` | `/webhooks/payment` | POST | `ftth-payment-gateway:5002` |
| `geocode-route` | `/api/v1/geocode` | ALL | `ftth-map-gateway:5003` |
| `storage-route` | `/api/v1/storage` | ALL | `ftth-storage-gateway:5004` |
| `scheduler-route` | `/api/v1/scheduler` | ALL | `ftth-scheduler-gateway:5006` |
| `export-route` | `/api/v1/export` | ALL | `ftth-export-gateway:5007` |
| `olt-route` | `/api/v1/olt` | ALL | `ftth-olt-gateway:5008` |
| `ont-route` | `/api/v1/ont` | ALL | `ftth-olt-gateway:5008` |
| `wa-api-route` | `/api/v1/wa` | ALL | `ftth-whatsapp-gateway:5005` |
| `wa-webhook-route` | `/api/v1/wa/webhook` | ALL | `ftth-whatsapp-gateway:5005` |

**15 Plugins aktif di Kong:**
- `jwt` — 11 route-scoped plugins
- `cors` — 1 global plugin
- `ip-restriction` — 1 route-scoped plugin
- `post-function` — 1 route-scoped plugin (dekorator X-Tenant-ID)
- `http-log` — 1 global plugin (audit logging ke gateway-audit)

---

### 2. Masalah yang Ditemukan (Gap Analysis)

#### 🔴 KRITIS — Traffic History Sintetis (Mock Distribution)
File `kong-traffic/route.ts` baris 50–58 membangun traffic history secara **matematis buatan** dari `total_requests` × persentase distribusi per jam yang dikodekan langsung:
```typescript
// ⚠️ MASALAH: Distribusi artifisial, bukan data real time-series
const pct = [0.04, 0.03, 0.03, 0.04, 0.06, 0.09, 0.11, 0.13, 0.12, 0.11][i];
const api = Math.round(totalRequests * pct * 0.65);
```
Grafik terlihat realistis namun tidak akurat — distribusi diasumsikan dari angka total, bukan dari data aktual per jam. Solusi: aggregasi dari `audit_events` di `gateway-audit:5009` (Kong http-log plugin sudah mengirim semua request ke sana).

#### 🔴 KRITIS — Plugin List per Route Hardcoded Fallback
Meskipun plugin data tersedia di Kong Admin, `page.tsx` fallback ke `["jwt", "rate-limiting"]` hardcoded, padahal plugin `rate-limiting` tidak terpasang di instance ini:
```typescript
// ⚠️ MASALAH: Fallback hardcoded yang salah
{(r.plugins?.length > 0 ? r.plugins : ["jwt", "rate-limiting"]).map(...)}
```
API `kong-routes/route.ts` tidak fetch `/plugins?route_id={id}` sehingga `r.plugins` selalu `[]`.

#### 🟡 SEDANG — Status Route Selalu "UP" (Hardcoded)
Fungsi `transformRoute()` selalu mengembalikan `status: "UP"` tanpa verifikasi upstream nyata:
```typescript
// ⚠️ MASALAH: Hardcoded — tidak ada actual upstream health check
status: "UP",
```

#### 🟡 SEDANG — KPI Card "Kong DB Status" Tidak Informatif
Kong berjalan **DB-less declarative mode** — field `database.reachable` tidak ada di `/status`. Kartu ini menampilkan "Off (DB-less)" yang tidak memberikan nilai operasional. Lebih berguna: menampilkan **Kong Configuration Hash** untuk mendeteksi apakah konfigurasi berubah.

#### 🟡 SEDANG — Tidak Ada Memory / Worker Metrics
`/status` Kong menyediakan `memory.workers_lua_vms` (12 workers, masing-masing ~52–53 MiB GC) dan `lua_shared_dicts` (total ~320 MiB kapasitas). Data ini tidak ditampilkan sama sekali.

#### 🟢 MINOR — Warna Chart Hardcoded
Grafik area menggunakan `"#0ea5e9"` (sky-500 hardcoded) untuk dataKey `gateways` — tidak mengikuti CSS variable theme.

#### 🟢 MINOR — Tidak Ada Empty State yang Informatif
Saat Kong tidak reachable, tabel route kosong tanpa panduan troubleshooting.

---

## 🛠️ Rencana Solusi & Arsitektur

### Prioritas 1 — Real Traffic History dari Audit Events

**Strategi**: Agregasi `audit_events` dari `gateway-audit:5009` per jam — Kong http-log plugin sudah mengirim semua request ke sana secara real-time.

**Implementasi**:
- Tambah endpoint Spring Boot: `GET /api/v1/system/kong/traffic-history?hours=12`
  - Query: `SELECT DATE_TRUNC('hour', created_at), COUNT(*) FROM audit_events WHERE source='kong' GROUP BY 1 ORDER BY 1`
- Update `kong-traffic/route.ts` — gunakan endpoint backend sebagai sumber utama, fallback ke estimasi sintetis jika API tidak tersedia
- Update `KongTrafficPoint` untuk membawa `totalByHour` yang akurat

### Prioritas 2 — Plugin Visibility per Route (Real Data)

**Implementasi**:
- Modifikasi `kong-routes/route.ts` — setelah fetch routes & services, lakukan `Promise.allSettled` untuk fetch `${KONG_ADMIN_URL}/plugins?route.id={routeId}` per route
- Cache hasil 30 detik untuk menghindari flooding ke Kong Admin API (15 routes × fetch)
- Update `transformRoute()` untuk mengisi `plugins` dengan nama plugin aktual
- Update UI: hapus fallback hardcoded `["jwt", "rate-limiting"]`

### Prioritas 3 — Ganti KPI "Kong DB Status" → "Config Hash"

**Implementasi**:
- Update `kong-traffic/route.ts` untuk meneruskan `configHash` dari `status.configuration_hash`
- Update `KongMetrics` type — tambah field `configHash?: string`
- Update UI card keempat: tampilkan 8 char pertama hash (`6ce3ad78…`) + subtitle "DB-less declarative"

### Prioritas 4 — Tambah Worker Memory Card

**Implementasi**:
- Update `kong-traffic/route.ts` — ekstrak `memory.workers_lua_vms` dan hitung total GC allocated
- Tambah KPI card kelima: "Worker Memory" dengan nilai total GC (misal: `636 MiB` dari 12 workers)
- Jadikan grid 5 kolom atau layout 2-3 split

### Prioritas 5 — Upstream Health Check per Route

**Implementasi**:
- Di `kong-routes/route.ts`, setelah fetch routes & services, ping health endpoint tiap upstream (`/health`, `/actuator/health`, atau `/api/v1/health`)
- Update `KongRouteDisplay.status` dari `"UP" | "UNKNOWN"` ke `"UP" | "DOWN" | "UNKNOWN"`
- Update UI status indicator: hijau pulse untuk UP, merah untuk DOWN, kuning untuk UNKNOWN

### Prioritas 6 — Perbaikan Minor Token Warna + Empty State

- Ganti `"#0ea5e9"` → `"var(--chart-2)"` (atau `var(--primary)` dengan opacity untuk konsistensi)
- Tambah `EmptyState` component saat `routes.length === 0 && !isLoading`

---

## 📊 Arsitektur Data yang Diusulkan

```
Frontend (page.tsx)
  ↓ useKongRoutes [30s poll]   → /api/observability/kong-routes
  ↓ useKongTraffic [10s poll]  → /api/observability/kong-traffic

/api/observability/kong-routes
  → Kong Admin: GET /routes?size=100
  → Kong Admin: GET /services?size=100
  → Kong Admin: GET /plugins?route.id={id} (per route, parallel)
  → Health check: GET /health tiap upstream (parallel, 3s timeout)

/api/observability/kong-traffic
  → Kong Admin: GET /status (connections, config_hash, memory)
  → Spring Boot: GET /api/v1/system/kong/traffic-history?hours=12
      ↳ DB: SELECT DATE_TRUNC('hour', created_at), COUNT(*) 
            FROM audit_events WHERE source='kong' 
            GROUP BY 1 ORDER BY 1 DESC LIMIT 12
```

---

## 📋 Rencana Pengujian & Verifikasi

### Pengujian Otomatis
```bash
pnpm --filter @k2net/ui build
pnpm --filter @k2net/studio-admin lint
pnpm --filter @k2net/studio-admin build
mvn clean package -DskipTests=true  # jika ada perubahan backend Spring Boot
```

### Pengujian Manual
1. Buka `/observability/api-gateway` — badge "LIVE" aktif
2. Verifikasi 15 routes muncul dengan plugin yang akurat (bukan fallback `["jwt", "rate-limiting"]`)
3. KPI card keempat menampilkan Config Hash `6ce3ad78…` (bukan "Off (DB-less)")
4. Grafik traffic history menampilkan data riil dari audit_events (bukan flat uniform distribution)
5. Warna chart konsisten di dark mode & light mode
6. Empty state informatif muncul saat Kong tidak reachable

---

## 📚 Referensi
- [page.tsx](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/api-gateway/page.tsx)
- [useKongObservability.ts](file:///opt/project5/apps/studio-admin/src/hooks/useKongObservability.ts)
- [kong-routes/route.ts](file:///opt/project5/apps/studio-admin/src/app/api/observability/kong-routes/route.ts)
- [kong-traffic/route.ts](file:///opt/project5/apps/studio-admin/src/app/api/observability/kong-traffic/route.ts)
- [31-juli-2026-observability-overview.md](file:///opt/project5/docs/Server/rekomendasi/plan/31-juli-2026-observability-overview.md)
- [04-agustus-2026-query-performance-upgrades.md](file:///opt/project5/docs/Server/rekomendasi/plan/04-agustus-2026-query-performance-upgrades.md)
- Kong Admin API: http://127.0.0.1:8001 (bound ke localhost:8001)
