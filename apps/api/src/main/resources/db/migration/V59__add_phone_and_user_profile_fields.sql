-- V59: Add phone, job_title, last_login_at, last_login_ip, mfa_enabled, timezone, locale to users and users_aud
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Jakarta';
ALTER TABLE users ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'id';

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);

-- Envers Audit Table (users_aud)
ALTER TABLE users_aud ADD COLUMN IF NOT EXISTS phone VARCHAR(64);
ALTER TABLE users_aud ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);
ALTER TABLE users_aud ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users_aud ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
ALTER TABLE users_aud ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users_aud ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);
ALTER TABLE users_aud ADD COLUMN IF NOT EXISTS locale VARCHAR(10);

COMMENT ON COLUMN users.phone IS 'Primary phone or WhatsApp contact number in E.164 format';
COMMENT ON COLUMN users.job_title IS 'Operational role or title within tenant (e.g. NOC Lead, Fiber Splicer)';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of last authenticated session';
COMMENT ON COLUMN users.last_login_ip IS 'IPv4 or IPv6 address used during last authentication';
COMMENT ON COLUMN users.mfa_enabled IS 'Indicates whether Keycloak 2FA / MFA OTP or WebAuthn is active';
COMMENT ON COLUMN users.timezone IS 'User timezone preference (defaults to Asia/Jakarta WIB)';
COMMENT ON COLUMN users.locale IS 'User preferred interface and alert language (id / en)';
