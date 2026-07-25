// ─── Observability Mock Data ───────────────────────────────────────────────────
// Centralized structured dummy data for all /observability/* sub-pages.
// Replace individual fields with real API data as backend endpoints become available.

// ─── Phase 7: Query Performance ───────────────────────────────────────────────

export const slowQueriesMock = [
  {
    id: "q1",
    query: "SELECT ST_Distance(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) FROM ftth_gis.odp WHERE tenant_id = $3 ORDER BY 1 LIMIT 10",
    duration: 1204,
    timestamp: "2026-07-25 03:14:22",
    table: "ftth_gis.odp",
  },
  {
    id: "q2",
    query: "SELECT * FROM ftth_gis.topology WHERE odp_id = $1 AND ST_Intersects(geom, ST_Buffer(ST_SetSRID(ST_MakePoint($2, $3), 4326), 0.005))",
    duration: 892,
    timestamp: "2026-07-25 02:58:11",
    table: "ftth_gis.topology",
  },
  {
    id: "q3",
    query: "UPDATE ftth_gis.homepass SET status = $1, updated_at = NOW() WHERE tenant_id = $2 AND odc_id IN (SELECT id FROM ftth_gis.odc WHERE area_code = $3)",
    duration: 743,
    timestamp: "2026-07-25 02:33:05",
    table: "ftth_gis.homepass",
  },
  {
    id: "q4",
    query: "SELECT b.*, t.name AS tenant_name FROM ftth_gis.billing_history b JOIN system.tenants t ON b.tenant_id = t.id WHERE b.due_date < NOW() AND b.paid = false",
    duration: 621,
    timestamp: "2026-07-25 01:55:47",
    table: "ftth_gis.billing_history",
  },
  {
    id: "q5",
    query: "SELECT COUNT(*) as total, AVG(signal_level) as avg_signal FROM ftth_gis.odp WHERE tenant_id = $1 AND health_status IN ('DOWN', 'DEGRADED') GROUP BY area_code",
    duration: 514,
    timestamp: "2026-07-25 01:22:30",
    table: "ftth_gis.odp",
  },
];

export const spatialIndexStatusMock = [
  { table: "ftth_gis.topology", indexType: "GIST (geom)", status: "VALID", size: "42 MB" },
  { table: "ftth_gis.odp", indexType: "GIST (geom)", status: "VALID", size: "18 MB" },
  { table: "ftth_gis.odc", indexType: "GIST (geom)", status: "VALID", size: "8 MB" },
  { table: "ftth_gis.billing_history", indexType: "B-TREE (tenant_id, due_date)", status: "VALID", size: "22 MB" },
  { table: "ftth_gis.audit_events", indexType: "B-TREE (created_at)", status: "VALID", size: "34 MB" },
  { table: "ftth_gis.homepass", indexType: "GIST (geom)", status: "VALID", size: "56 MB" },
];

// ─── Phase 7: API Gateway ─────────────────────────────────────────────────────

export const kongRoutesMock = [
  { route: "/api/v1/wa", upstream: "notification-gateway:5001", rateLimit: "100/min", jwtPlugin: true, status: "UP" },
  { route: "/api/v1/olt", upstream: "olt-gateway:5005", rateLimit: "50/min", jwtPlugin: true, status: "UP" },
  { route: "/api/v1/spatial", upstream: "map-gateway:5003", rateLimit: "200/min", jwtPlugin: true, status: "UP" },
  { route: "/api/v1/payment", upstream: "payment-gateway:5002", rateLimit: "30/min", jwtPlugin: true, status: "UP" },
  { route: "/api/v1/storage", upstream: "storage-gateway:5004", rateLimit: "100/min", jwtPlugin: true, status: "UP" },
  { route: "/api/v1/system", upstream: "ftth-backend:9090", rateLimit: "500/min", jwtPlugin: true, status: "UP" },
  { route: "/api/v1/audit", upstream: "audit-gateway:5006", rateLimit: "200/min", jwtPlugin: true, status: "UP" },
  { route: "/api/v1/scheduler", upstream: "scheduler-gateway:5007", rateLimit: "20/min", jwtPlugin: true, status: "UP" },
];

export const kongTrafficMock = [
  { hour: "08:00", api: 42, db: 12, backend: 8, gateways: 28 },
  { hour: "09:00", api: 78, db: 24, backend: 15, gateways: 45 },
  { hour: "10:00", api: 112, db: 38, backend: 22, gateways: 67 },
  { hour: "11:00", api: 95, db: 31, backend: 18, gateways: 54 },
  { hour: "12:00", api: 134, db: 45, backend: 28, gateways: 82 },
  { hour: "13:00", api: 88, db: 28, backend: 16, gateways: 48 },
  { hour: "14:00", api: 102, db: 34, backend: 20, gateways: 60 },
  { hour: "15:00", api: 124, db: 41, backend: 25, gateways: 73 },
  { hour: "16:00", api: 147, db: 52, backend: 31, gateways: 91 },
  { hour: "17:00", api: 89, db: 27, backend: 15, gateways: 46 },
];

// ─── Phase 8: Identity / Keycloak ─────────────────────────────────────────────

export const authEventsMock = [
  { id: "e1", event: "Login Success", user: "admin@k2net.id", ip: "10.0.0.1", timestamp: "2026-07-25 03:01:12", type: "success" },
  { id: "e2", event: "Token Refresh", user: "user@tenant-alpha.com", ip: "10.0.0.5", timestamp: "2026-07-25 02:58:44", type: "info" },
  { id: "e3", event: "Login Success", user: "staff@tenant-beta.id", ip: "10.0.0.8", timestamp: "2026-07-25 02:52:30", type: "success" },
  { id: "e4", event: "Brute Force Block", user: "unknown", ip: "185.220.101.4", timestamp: "2026-07-25 02:45:19", type: "error" },
  { id: "e5", event: "Logout", user: "staff@tenant-alpha.com", ip: "10.0.0.6", timestamp: "2026-07-25 02:30:05", type: "info" },
  { id: "e6", event: "MFA Challenge", user: "admin@k2net.id", ip: "10.0.0.1", timestamp: "2026-07-25 02:15:33", type: "info" },
  { id: "e7", event: "Login Failed", user: "user@tenant-gamma.net", ip: "203.0.113.42", timestamp: "2026-07-25 01:58:20", type: "warning" },
  { id: "e8", event: "Token Refresh", user: "admin@tenant-beta.id", ip: "10.0.0.3", timestamp: "2026-07-25 01:45:08", type: "info" },
];

// ─── Phase 9: OLT & Poller ────────────────────────────────────────────────────

export const oltDevicesMock = [
  { hostname: "OLT-CORE-JKT-01", ip: "192.168.1.10", vendor: "ZTE", model: "C320", snmpStatus: "OK", opticalAttn: "-21.5 dBm", odpCount: 48, location: "Jakarta Pusat" },
  { hostname: "OLT-CORE-JKT-02", ip: "192.168.1.11", vendor: "ZTE", model: "C320", snmpStatus: "OK", opticalAttn: "-22.1 dBm", odpCount: 52, location: "Jakarta Barat" },
  { hostname: "OLT-BRANCH-BDG-01", ip: "192.168.2.10", vendor: "Huawei", model: "MA5608T", snmpStatus: "SLOW", opticalAttn: "-23.8 dBm", odpCount: 36, location: "Bandung Timur" },
  { hostname: "OLT-BRANCH-SBY-01", ip: "192.168.3.10", vendor: "ZTE", model: "C300M", snmpStatus: "OK", opticalAttn: "-20.9 dBm", odpCount: 60, location: "Surabaya Selatan" },
  { hostname: "OLT-BRANCH-MDN-01", ip: "192.168.4.10", vendor: "Huawei", model: "MA5683T", snmpStatus: "OK", opticalAttn: "-22.7 dBm", odpCount: 40, location: "Medan Kota" },
];

export const oltPollRpsMock = Array.from({ length: 20 }, (_, i) => ({
  time: `${String(Math.floor(i * 1.5)).padStart(2, "0")}:${String((i * 90) % 60).padStart(2, "0")}`,
  polls: Math.floor(Math.random() * 30) + 10,
  failures: Math.floor(Math.random() * 3),
}));

// ─── Phase 9: Spatial Map ─────────────────────────────────────────────────────

export const mapTileRpsMock = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  tiles: Math.floor(Math.random() * 200) + 50,
  geocoding: Math.floor(Math.random() * 50) + 10,
  cacheHit: Math.floor(Math.random() * 100) + 60,
}));

// ─── Phase 9: Messaging ────────────────────────────────────────────────────────

export const messageQueueMock = [
  { id: "m1", message: "Tagihan Jatuh Tempo - Juli 2026", type: "Blast WA", queue: "Redis #1", status: "pending", sentAt: null, recipient: "128 customers" },
  { id: "m2", message: "Gangguan Kabel Fiber Area Timur Jakarta", type: "Notifikasi", queue: "Redis #2", status: "sent", sentAt: "03:15:22", recipient: "42 tenants" },
  { id: "m3", message: "Invoice INV-2026-0712 Telah Dibuat", type: "SMS Backup", queue: "SMS GW", status: "sent", sentAt: "03:10:08", recipient: "tenant-alpha" },
  { id: "m4", message: "Aktivasi Layanan Baru - Paket Fiber Pro", type: "Blast WA", queue: "Redis #1", status: "sent", sentAt: "02:55:44", recipient: "15 customers" },
  { id: "m5", message: "Reminder: Masa Aktif Berakhir 3 Hari Lagi", type: "Blast WA", queue: "Redis #3", status: "processing", sentAt: null, recipient: "67 customers" },
  { id: "m6", message: "ODP-BDG-042 Status: DOWN - Laporan Otomatis", type: "Alert", queue: "Redis #2", status: "sent", sentAt: "02:33:15", recipient: "ops-team" },
];

// ─── Phase 9: Operations ──────────────────────────────────────────────────────

export const operationsServicesMock = [
  {
    service: "Scheduler Gateway",
    port: 5007,
    status: "UP",
    lastActivity: "2 jobs running",
    queueSize: 0,
    throughput: "4 jobs/hr",
    uptime: "12d 4h",
  },
  {
    service: "Export Gateway",
    port: 5008,
    status: "UP",
    lastActivity: "5 min ago",
    queueSize: 2,
    throughput: "8 tasks/hr",
    uptime: "12d 4h",
  },
  {
    service: "Payment Gateway",
    port: 5002,
    status: "UP",
    lastActivity: "23 sec ago",
    queueSize: 0,
    throughput: "3 webhooks/hr",
    uptime: "12d 4h",
  },
  {
    service: "Audit Gateway",
    port: 5006,
    status: "UP",
    lastActivity: "1 sec ago",
    queueSize: 0,
    throughput: "142 logs/hr",
    uptime: "12d 4h",
  },
];

export const scheduledJobsMock = [
  { name: "Daily Billing Generator", cron: "0 1 * * *", lastRun: "03:00:12", nextRun: "Tomorrow 03:00", status: "SUCCESS" },
  { name: "SNMP OLT Poller", cron: "*/5 * * * *", lastRun: "03:25:00", nextRun: "03:30:00", status: "SUCCESS" },
  { name: "Backup PostgreSQL", cron: "0 0 * * *", lastRun: "00:00:05", nextRun: "Tomorrow 00:00", status: "SUCCESS" },
  { name: "Sync Nextcloud", cron: "0 4 * * *", lastRun: "04:00:09", nextRun: "Tomorrow 04:00", status: "SUCCESS" },
  { name: "GIS Topology Rebuild", cron: "0 2 * * 0", lastRun: "Sun 02:00", nextRun: "Next Sun 02:00", status: "SUCCESS" },
];
