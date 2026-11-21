-- ==============================================================================
-- Flyway Migration V88: User Emergency Offline MFA Backup Codes
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals:
--   1. Create user_mfa_backup_codes table for offline disaster recovery 2FA.
--   2. Create user_mfa_backup_codes_aud Hibernate Envers audit table.
--   3. Create performant partial index on (user_id, is_used) for fast lookup.
-- ==============================================================================

-- 1. Create user_mfa_backup_codes Table
CREATE TABLE IF NOT EXISTS user_mfa_backup_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash VARCHAR(128) NOT NULL,
    code_hint VARCHAR(16) NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    used_ip VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON user_mfa_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_codes_user_unused ON user_mfa_backup_codes(user_id, is_used);

-- 2. Create Envers Audit Table (user_mfa_backup_codes_aud)
-- STRICT ENVERS SCHEMA RULES:
--   - rev INTEGER NOT NULL REFERENCES revinfo(id)
--   - revtype SMALLINT (0=ADD, 1=MOD, 2=DEL)
--   - AuditableEntity columns: created_at, created_by, updated_at, updated_by
--   - PRIMARY KEY (id, rev)
CREATE TABLE IF NOT EXISTS user_mfa_backup_codes_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    user_id UUID,
    code_hash VARCHAR(128),
    code_hint VARCHAR(16),
    is_used BOOLEAN,
    used_at TIMESTAMPTZ,
    used_ip VARCHAR(45),
    created_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(255),
    PRIMARY KEY (id, rev)
);
