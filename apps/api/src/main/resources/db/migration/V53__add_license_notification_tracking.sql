-- ==============================================================================
-- K2NET FTTH GIS — V53: License Notification Tracking & Multi-Channel Reminder Logs
-- ==============================================================================

-- 1. Tambah kolom tracking notifikasi & kontak penagihan pada tenant_licenses
ALTER TABLE tenant_licenses
    ADD COLUMN IF NOT EXISTS last_notified_stage VARCHAR(32) DEFAULT 'NONE' NOT NULL,
    ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS billing_contact_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS billing_contact_phone VARCHAR(64),
    ADD COLUMN IF NOT EXISTS billing_contact_name VARCHAR(128),
    ADD COLUMN IF NOT EXISTS notify_email_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    ADD COLUMN IF NOT EXISTS notify_whatsapp_enabled BOOLEAN DEFAULT TRUE NOT NULL;

-- 2. Tambah kolom yang sama pada tabel audit envers tenant_licenses_aud
ALTER TABLE tenant_licenses_aud
    ADD COLUMN IF NOT EXISTS last_notified_stage VARCHAR(32),
    ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS billing_contact_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS billing_contact_phone VARCHAR(64),
    ADD COLUMN IF NOT EXISTS billing_contact_name VARCHAR(128),
    ADD COLUMN IF NOT EXISTS notify_email_enabled BOOLEAN,
    ADD COLUMN IF NOT EXISTS notify_whatsapp_enabled BOOLEAN;

-- 3. Indeks performa untuk sweep latar belakang
CREATE INDEX IF NOT EXISTS idx_tenant_licenses_notify_sweep 
    ON tenant_licenses(organization_id, status, last_notified_stage);

-- 4. Tabel Riwayat Pengiriman Notifikasi Lisensi (Multi-Channel Audit Log)
CREATE TABLE IF NOT EXISTS license_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    license_id UUID NOT NULL REFERENCES tenant_licenses(id) ON DELETE CASCADE,
    channel VARCHAR(32) NOT NULL, -- EMAIL, WHATSAPP
    stage VARCHAR(32) NOT NULL,   -- EXPIRING_7D, EXPIRING_3D, GRACE_PERIOD, READ_ONLY_LOCKED, SUSPENDED, MANUAL_REMINDER
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    status VARCHAR(32) NOT NULL,  -- SENT, FAILED, SIMULATED
    message_content TEXT,
    error_details TEXT,
    triggered_by VARCHAR(64) DEFAULT 'JANITOR_JOB' NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_license_notify_logs_org_lic 
    ON license_notification_logs(organization_id, license_id, sent_at DESC);
