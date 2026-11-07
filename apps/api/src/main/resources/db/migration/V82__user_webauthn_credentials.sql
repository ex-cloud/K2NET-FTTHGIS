-- ==============================================================================
-- Flyway Migration V82: User WebAuthn & Passkey Credentials Store
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals:
--   1. Create user_webauthn_credentials table for FIDO2/Passkey biometric authentication.
--   2. Create user_webauthn_credentials_aud Envers audit table.
--   3. Index user_id and credential_id for high-speed assertion lookup.
-- ==============================================================================

-- 1. Create user_webauthn_credentials Table
CREATE TABLE IF NOT EXISTS user_webauthn_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id VARCHAR(512) NOT NULL UNIQUE,
    public_key_cose TEXT NOT NULL,
    public_key_pem TEXT,
    algorithm INTEGER NOT NULL DEFAULT -7, -- -7 = ES256, -257 = RS256
    sign_counter BIGINT NOT NULL DEFAULT 0,
    aaguid VARCHAR(64),
    device_name VARCHAR(150) NOT NULL DEFAULT 'Passkey',
    transports JSONB DEFAULT '[]'::jsonb,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_webauthn_user_id ON user_webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_cred_id ON user_webauthn_credentials(credential_id);

-- 2. Create Envers Audit Table (user_webauthn_credentials_aud)
-- STRICT ENVERS SCHEMA RULES:
--   - rev INTEGER NOT NULL REFERENCES revinfo(id)
--   - revtype SMALLINT (0=ADD, 1=MOD, 2=DEL)
--   - AuditableEntity columns: created_at, created_by, updated_at, updated_by
--   - PRIMARY KEY (id, rev)
CREATE TABLE IF NOT EXISTS user_webauthn_credentials_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    user_id UUID,
    credential_id VARCHAR(512),
    public_key_cose TEXT,
    public_key_pem TEXT,
    algorithm INTEGER,
    sign_counter BIGINT,
    aaguid VARCHAR(64),
    device_name VARCHAR(150),
    transports JSONB,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(255),
    PRIMARY KEY (id, rev)
);

