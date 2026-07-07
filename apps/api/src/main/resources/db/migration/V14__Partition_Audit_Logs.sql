-- Flyway Migration: V14__Partition_Audit_Logs.sql
-- Konversi tabel audit_logs menjadi tabel terpartisi secara bulanan

-- 1. Rename tabel audit_logs lama menjadi audit_logs_old jika ada
ALTER TABLE audit_logs RENAME TO audit_logs_old;

-- Drop index lama agar tidak bentrok
DROP INDEX IF EXISTS idx_audit_user_id;
DROP INDEX IF EXISTS idx_audit_event_type;
DROP INDEX IF EXISTS idx_audit_timestamp;
DROP INDEX IF EXISTS idx_audit_status;

-- 2. Buat tabel audit_logs baru dengan PARTITION BY RANGE
CREATE TABLE audit_logs (
    id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    user_id UUID,
    username VARCHAR(255),
    client_ip VARCHAR(45),
    http_method VARCHAR(10),
    request_uri TEXT,
    required_permission VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    details TEXT,
    severity VARCHAR(20) NOT NULL DEFAULT 'WARN',
    timestamp TIMESTAMP NOT NULL,
    org_id VARCHAR(255),
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- 3. Buat partisi awal (Pre-allocation)
-- Partisi default untuk menangkap data lama atau yang di luar range
CREATE TABLE audit_logs_default PARTITION OF audit_logs DEFAULT;

-- Partisi Juni 2026 (Historical)
CREATE TABLE audit_logs_y2026m06 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-06-01 00:00:00') TO ('2026-07-01 00:00:00');

-- Partisi Juli 2026 (Bulan berjalan)
CREATE TABLE audit_logs_y2026m07 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-07-01 00:00:00') TO ('2026-08-01 00:00:00');

-- Partisi Agustus 2026 (Bulan depan)
CREATE TABLE audit_logs_y2026m08 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-08-01 00:00:00') TO ('2026-09-01 00:00:00');

-- Partisi September 2026 (Bulan depan +1)
CREATE TABLE audit_logs_y2026m09 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-09-01 00:00:00') TO ('2026-10-01 00:00:00');

-- 4. Salin data dari tabel lama ke tabel terpartisi baru
INSERT INTO audit_logs (id, event_type, user_id, username, client_ip, http_method, request_uri, required_permission, status, details, severity, timestamp, org_id)
SELECT id, event_type, user_id, username, client_ip, http_method, request_uri, required_permission, status, details, severity, timestamp, org_id
FROM audit_logs_old;

-- 5. Buat kembali index pada tabel induk (PostgreSQL akan mendistribusikannya secara otomatis ke setiap partisi)
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_status ON audit_logs(status);

-- 6. Drop tabel lama setelah migrasi data sukses
DROP TABLE audit_logs_old;
