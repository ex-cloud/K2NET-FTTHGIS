# Standar Baku Pemilihan Engine Polyglot Paket Marketplace (Polyglot Engine SOP)

Dokumen ini adalah pedoman pemilihan dan arsitektur runtime bahasa pemrograman (*Polyglot Engine Architecture*) untuk setiap paket modul pada platform K2NET FTTH GIS Enterprise SaaS.

Dokumen ini melengkapi pedoman siklus hidup paket di [rules/marketplace-package-standard.md](file:///opt/project5/.agents/rules/marketplace-package-standard.md).

---

## 🏛️ 1. Filosofi Arsitektur Polyglot K2NET

K2NET tidak menggunakan arsitektur satu bahasa untuk semua hal (*one-size-fits-all*). Sebaliknya, setiap bahasa dipilih secara objektif sesuai kekuatan fundamental runtime-nya:

```
┌────────────────────────────────────────────────────────────────────────┐
│             PEDOMAN PEMILIHAN BAHASA ENGINE MODUL / PAKET             │
├────────────┬───────────────────────────────────┬───────────────────────┤
│ Bahasa     │ Karakteristik & Beban Kerja       │ Contoh Penggunaan     │
├────────────┼───────────────────────────────────┼───────────────────────┤
│ ☕ JAVA     │ Transaksional perbankan/billing,  │ Core REST API, PBAC,  │
│ (Spring 3) │ relasi JPA/Hibernate ACID, audit │ Flyway migrations,    │
│            │ Envers, orkestrasi lisensi.       │ Billing & Quotas.     │
├────────────┼───────────────────────────────────┼───────────────────────┤
│ 🐹 GOLANG  │ High concurrency, networking I/O, │ Notification, Payment,│
│ (Go 1.24)  │ SNMP poller perangkat OLT,        │ Storage S3 Gateway,   │
│            │ low memory footprint, streaming.  │ OLT Poller, Reverse.  │
├────────────┼───────────────────────────────────┼───────────────────────┤
│ 🐍 PYTHON  │ Deep tech AI/ML, parsing biner    │ OTDR Localizer .SOR,  │
│ (FastAPI)  │ vendor optik (pyotdr Telcordia),  │ Spatial K-Means/DBSCAN│
│            │ PostGIS spatial routing & GIS AI. │ Automated FTTH Planner│
├────────────┼───────────────────────────────────┼───────────────────────┤
│ 🦀 RUST    │ Kinerja ekstrem tanpa GC pause,   │ Real-time high-res    │
│            │ packet crafting/raw sockets,      │ GIS raster generator, │
│            │ komputasi topologi jutaan node.   │ microsecond cruncher. │
└────────────┴───────────────────────────────────┴───────────────────────┘
```

---

## ☕ 2. Engine Java (Spring Boot 3.x) — Port 9090

### Kapan Wajib Menggunakan Java:
1. **Integritas Relasional & Transaksi Finansial**: Transaksi pembayaran, invoice, perhitungan pro-rate lisensi, dan pencatatan saldo dompet.
2. **Kepatuhan Audit Hibernate Envers**: Modul yang mewajibkan audit trail hukum ISO 27001 / regulasi B2B dengan tabel `_aud` otomatis.
3. **Sentral Otorisasi PBAC / Spatial ABAC**: Pengecekan izin modular `@tenantSecurity.hasEffectivePermission(...)`.
4. **Pencegahan Kuota Global**: Eksekusi `ProjectQuotaService.assertCanAllocate...` sebelum mutasi database.

---

## 🐹 3. Engine Golang (Go 1.24) — Port 5001–5011, 5013

### Kapan Wajib Menggunakan Go:
1. **High Concurrency & Event Streaming**: Menangani ribuan koneksi polling simultan tanpa *thread overhead* besar (goroutine hemat memori ~2KB).
2. **Protokol Jaringan & Polling Hardware**: SNMP v2c/v3 ke perangkat OLT (ZTE, Huawei, Fiberhome), Syslog RFC-5424 streaming, MQTT/WebSocket.
3. **Gateway I/O Pihak Ketiga**:
   - `services/notification-gateway` (5001): WhatsApp WABA & Twilio SMS.
   - `services/payment-gateway` (5002): Webhook callback & Xendit VA settlement.
   - `services/storage-gateway` (5004): Upload streaming dan isolasi MinIO S3 prefix.
   - `services/gateway-whatsapp` (5005): Outage broadcast broadcast pool.
   - `services/gateway-olt` (5008) & `services/poller` (5010): SNMP background pooling.
   - `services/gateway-audit` (5009): Daemon pembaca audit stream dari Redis ke SIEM.

---

## 🐍 4. Engine Python (FastAPI / Celery) — Port 5012 (`services/ai-gateway`)

### Kapan Wajib Menggunakan Python:
1. **Parsing Format Biner Proprietary Vendor Optik**:
   - File jejak reflektansi optik Telcordia SR-4731 (`.SOR`) dari perangkat OTDR (EXFO, Yokogawa, Anritsu). Library matang seperti `pyotdr` hanya tersedia di ekosistem Python.
2. **Algoritma Spasial Lanjutan & AI/ML**:
   - Algoritma clustering homepass ke rasio splitter (Constrained K-Means / DBSCAN).
   - Optimasi perutean kabel di sepanjang jaringan jalan menggunakan `networkx` dan PostGIS `pgRouting`.
   - Regresi prediksi redaman kabel optik berbasis data telemetri historis.

---

## 🦀 5. Engine Rust — High-Throughput & Zero-GC

### Kapan Wajib Menggunakan Rust:
1. **Ketiadaan Toleransi Terhadap Jeda Garbage Collection (Zero-GC Pause)**:
   - Pengolahan sinyal telemetri sensor ODC LoRa/MQTT real-time dengan volume jutaan pesan per detik.
2. **Rendering Spasial & Komputasi Topologi Padat**:
   - Pembuatan raster mbtiles dinamis atau pemotongan poligon kabel serat optik dengan jutaan titik simpul (*vertices*).
3. **Manipulasi Paket Jaringan Tingkat Rendah**:
   - Packet crafting, raw socket probing jaringan, atau deteksi anomali paket serat optik mikrosekon.

---

## 📊 6. Matriks Alokasi 12 Paket Resmi Layer 3 & Status 5-Lapis DoD (Sprint 3)

| Kode Paket | Nama Paket | Bahasa Engine | Service / Port | Status DoD | Alasan Pemilihan Engine |
|---|---|---|---|---|---|
| `PKG_BOOSTER_OLT_5` | Booster +5 OLT Capacity | ☕ **Java** + 🐹 **Go** | Backend (9090) & Poller (5010) | **PUBLISHED** (Lulus DoD) | Java kuota lisensi decoupling V63; Go SNMP poller. |
| `PKG_BOOSTER_ODP_100` | Booster +100 ODP Capacity | ☕ **Java** | Backend (9090) | **PUBLISHED** (Lulus DoD) | Enforce kuota ACID di `ProjectQuotaService` & `ODPService`. |
| `PKG_BOOSTER_STORAGE_50` | Booster +50 GB MinIO S3 | ☕ **Java** + 🐹 **Go** | Backend (9090) & Storage (5004) | **PUBLISHED** (Lulus DoD) | Java validasi kuota pra-upload; Go streaming ke MinIO S3 bucket. |
| `PKG_WA_OUTAGE` | WA Outage Broadcast | 🐹 **Golang** | `gateway-whatsapp` (5005) | **PUBLISHED** (Lulus DoD) | Go mengelola concurrency pooling blast pesan ke pelanggan terdampak. |
| `PKG_OPEN_API` | REST API & Webhooks | ☕ **Java** + 🐹 **Kong** | Backend (9090) & Kong (8000) | **PUBLISHED** (Lulus DoD) | Kong rate-limiting edge; Java HMAC SHA-256 signing & PBAC scopes. |
| `PKG_TENANT_BRANDING` | Custom Domain & Whitelabel | 🐹 **Go** + 🌐 **Traefik** | Traefik (80/443) & Backend (9090) | **PUBLISHED** (Lulus DoD) | Dynamic theme & branding V58, Traefik TLS router. |
| `PKG_AI_OTDR` | AI OTDR Localizer (.SOR) | 🐍 **Python** | `ai-gateway` (5012) | **DRAFT** (Antrean Sprint 5) | Parser Telcordia binary `.SOR` (`pyotdr`) & PostGIS linear interpolation. |
| `PKG_AI_FTTH_DESIGNER` | Automated Route Planner | 🐍 **Python** + ☕ **Java** | `ai-gateway` (5012) & Backend (9090) | **DRAFT** (Antrean Sprint 5) | Python worker (Steiner Tree over Roads); Java kunci hasil BoQ ke proyek. |
| `PKG_SIEM_AUDIT` | SIEM & Syslog Exporter | 🐹 **Golang** | `gateway-audit` (5009) | **DRAFT** (Antrean Sprint 5) | Go daemon efisien membaca stream Redis & format RFC-5424 Syslog TLS. |
| `PKG_IOT_ODC_GUARD` | Smart ODC Microswitch | 🐹 **Go** / 🦀 **Rust** | `gateway-task` (5011) | **DRAFT** (Antrean Sprint 5) | Listener MQTT / LoRaWAN berkecepatan tinggi dengan buffer memory minim. |
| `PKG_PLN_ROW_PERMIT` | Utility Pole & RoW Permit | ☕ **Java** | Backend (9090) | **DRAFT** (Antrean Sprint 5) | CRUD relasional dokumen hukum izin tiang PLN/Pemda & jadwal jatuh tempo. |
| `PKG_WHOLESALE_LEASED` | Dark Fiber & Duct Leasing | ☕ **Java** | Backend (9090) | **DRAFT** (Antrean Sprint 5) | Penguncian core fiber relasional spasial, multi-contract billing agreement. |

---

## 🔒 7. Standar Komunikasi Antar-Service

1. **Header Multi-Tenant Wajib**:
   - Kong Gateway atau Backend Spring Boot **WAJIB** meneruskan header `X-Tenant-ID: <slug_or_uuid>` dan `X-Gateway-Token: <secret>` ke seluruh microservice Go/Python/Rust.
2. **Validasi Internal Token**:
   - Setiap Go Gateway memvalidasi token internal melalui middleware `shared.ValidateGatewayAuth`.
3. **Workspace Go**:
   - Seluruh modul Go dikompilasi bersama via workspace file `services/go.work`. Dilarang menggunakan *path segment dot* di local `go.mod`.
