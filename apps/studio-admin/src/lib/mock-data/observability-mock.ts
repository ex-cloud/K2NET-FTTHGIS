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

// ─── Phase 10: Scheduler & Backup Explorer ────────────────────────────────────

export type JobStatus = "SUCCESS" | "FAILED" | "RUNNING" | "SKIPPED" | "UNKNOWN";
export type JobCategory = "backup" | "sync" | "maintenance" | "poller";

export interface SchedulerJob {
  id: string;
  name: string;
  scriptKey: string;
  scriptFile: string;
  cronExpression: string;
  cronLabel: string;
  lastStatus: JobStatus;
  lastDuration: string;
  lastRunAt: string;
  nextRunAt: string;
  category: JobCategory;
}

export const schedulerJobsMock: SchedulerJob[] = [
  { id:"j1", name:"PostgreSQL Database Backup",    scriptKey:"backup",         scriptFile:"backup.sh",                cronExpression:"0 0 * * *",  cronLabel:"Every day at 00:00 WIB",    lastStatus:"SUCCESS", lastDuration:"45s",    lastRunAt:"2026-07-29 00:00:05", nextRunAt:"Tomorrow 00:00", category:"backup" },
  { id:"j2", name:"MinIO Object Storage Backup",   scriptKey:"backup-minio",   scriptFile:"backup-minio.sh",          cronExpression:"0 1 * * *",  cronLabel:"Every day at 01:00 WIB",    lastStatus:"SUCCESS", lastDuration:"1m 22s", lastRunAt:"2026-07-29 01:00:14", nextRunAt:"Tomorrow 01:00", category:"backup" },
  { id:"j3", name:"Codebase Archive Backup",       scriptKey:"backup-code",    scriptFile:"backup-code.sh",           cronExpression:"0 2 * * *",  cronLabel:"Every day at 02:00 WIB",    lastStatus:"SUCCESS", lastDuration:"28s",    lastRunAt:"2026-07-29 02:00:08", nextRunAt:"Tomorrow 02:00", category:"backup" },
  { id:"j4", name:"Docker Volumes Backup",         scriptKey:"backup-docker",  scriptFile:"backup-docker-volumes.sh", cronExpression:"0 3 * * 0",  cronLabel:"Every Sunday at 03:00 WIB", lastStatus:"SUCCESS", lastDuration:"3m 41s", lastRunAt:"2026-07-27 03:00:22", nextRunAt:"Sun 03:00",      category:"backup" },
  { id:"j5", name:"Secrets & Credentials Backup",  scriptKey:"backup-secrets", scriptFile:"backup-secrets.sh",        cronExpression:"0 0 * * 0",  cronLabel:"Every Sunday at 00:00 WIB", lastStatus:"SUCCESS", lastDuration:"8s",     lastRunAt:"2026-07-27 00:00:03", nextRunAt:"Sun 00:00",      category:"backup" },
  { id:"j6", name:"Offsite Sync to Nextcloud",     scriptKey:"sync-nextcloud", scriptFile:"sync-nextcloud.sh",        cronExpression:"0 4 * * *",  cronLabel:"Every day at 04:00 WIB",    lastStatus:"SUCCESS", lastDuration:"2m 5s",  lastRunAt:"2026-07-29 04:00:09", nextRunAt:"Tomorrow 04:00", category:"sync" },
  { id:"j7", name:"Audit Log Archive & Rotate",    scriptKey:"archive-audit",  scriptFile:"archive-audit-logs.sh",    cronExpression:"0 5 * * 0",  cronLabel:"Every Sunday at 05:00 WIB", lastStatus:"SUCCESS", lastDuration:"1m 10s", lastRunAt:"2026-07-27 05:00:15", nextRunAt:"Sun 05:00",      category:"maintenance" },
  { id:"j8", name:"Disk & Docker Image Cleanup",   scriptKey:"cleanup",        scriptFile:"cleanup.sh",               cronExpression:"0 6 * * 0",  cronLabel:"Every Sunday at 06:00 WIB", lastStatus:"SUCCESS", lastDuration:"4m 18s", lastRunAt:"2026-07-27 06:00:31", nextRunAt:"Sun 06:00",      category:"maintenance" },
];

export type StorageTarget = "minio-db" | "minio-code" | "minio-docker" | "nextcloud-dr";

export interface BackupArtifact {
  id: string;
  artifactName: string;
  sourceScript: string;
  storageTarget: StorageTarget;
  storageLabel: string;
  fileSize: string;
  completedAt: string;
  checksumSha256: string;
}

export const backupArtifactsMock: BackupArtifact[] = [
  { id:"a1", artifactName:"ftth_gis_2026-07-29.sql.gz",                          sourceScript:"backup.sh",                storageTarget:"minio-db",     storageLabel:"MinIO S3: db-backups",         fileSize:"42.3 MB", completedAt:"2026-07-29 00:00:50", checksumSha256:"a3f9c2d1e8b74f56a9c0" },
  { id:"a2", artifactName:"keycloak_db_2026-07-29.sql.gz",                       sourceScript:"backup.sh",                storageTarget:"minio-db",     storageLabel:"MinIO S3: db-backups",         fileSize:"8.1 MB",  completedAt:"2026-07-29 00:00:50", checksumSha256:"b2e7d4c9f1a3e6b8d0c2" },
  { id:"a3", artifactName:"minio-data-2026-07-29.tar.gz",                        sourceScript:"backup-minio.sh",          storageTarget:"minio-db",     storageLabel:"MinIO S3: db-backups",         fileSize:"1.2 GB",  completedAt:"2026-07-29 01:01:36", checksumSha256:"c4f1a8e2d5b7c9f3a1e4" },
  { id:"a4", artifactName:"codebase-2026-07-29.tar.gz",                          sourceScript:"backup-code.sh",           storageTarget:"minio-code",   storageLabel:"MinIO S3: code-backups",       fileSize:"312 MB",  completedAt:"2026-07-29 02:00:36", checksumSha256:"d9b2e5f7a4c1e8b3d6f0" },
  { id:"a5", artifactName:"docker-volumes-2026-07-27.tar.gz",                    sourceScript:"backup-docker-volumes.sh", storageTarget:"minio-docker", storageLabel:"MinIO S3: docker-backups",     fileSize:"892 MB",  completedAt:"2026-07-27 03:04:03", checksumSha256:"e1c3f6a9d2b4e7c0f5a8" },
  { id:"a6", artifactName:"audit-logs-2026-W30.tar.gz",                          sourceScript:"archive-audit-logs.sh",    storageTarget:"minio-db",     storageLabel:"MinIO S3: db-backups",         fileSize:"28.7 MB", completedAt:"2026-07-27 05:01:25", checksumSha256:"f5a8d2c7e4b1f9a3d6c0" },
  { id:"a7", artifactName:"FTTH-GIS-Backups/db/ftth_gis_2026-07-29.sql.gz",     sourceScript:"sync-nextcloud.sh",        storageTarget:"nextcloud-dr", storageLabel:"Nextcloud WebDAV: Layer-3-DR", fileSize:"42.3 MB", completedAt:"2026-07-29 04:02:14", checksumSha256:"g7b9e4f2a6d0c3b8e1f5" },
  { id:"a8", artifactName:"FTTH-GIS-Backups/code/codebase-2026-07-29.tar.gz",   sourceScript:"sync-nextcloud.sh",        storageTarget:"nextcloud-dr", storageLabel:"Nextcloud WebDAV: Layer-3-DR", fileSize:"312 MB",  completedAt:"2026-07-29 04:05:33", checksumSha256:"h2c4f8a1d6b3e9c5f7a0" },
];
