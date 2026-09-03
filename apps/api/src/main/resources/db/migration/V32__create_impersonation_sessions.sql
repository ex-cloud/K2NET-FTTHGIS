-- Flyway Migration: V32__create_impersonation_sessions.sql
-- Description: Create impersonation_sessions table for B2B multi-tenant support troubleshooting and auditability

CREATE TABLE impersonation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NOT NULL REFERENCES users(id),
    target_organization_id UUID NOT NULL REFERENCES organizations(id),
    reason TEXT NOT NULL,
    ticket_reference VARCHAR(100),
    step_up_verified_at TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for searching sessions initiated by a specific actor
CREATE INDEX idx_impersonation_sessions_actor ON impersonation_sessions(actor_user_id);

-- Index for tracking sessions targeting a specific organization
CREATE INDEX idx_impersonation_sessions_target ON impersonation_sessions(target_organization_id);

-- Partial index for active session expiry sweeps
CREATE INDEX idx_impersonation_sessions_expiry ON impersonation_sessions(expires_at) WHERE status = 'ACTIVE';

-- Hard constraint: Only one ACTIVE impersonation session per Super Admin actor at any given time
CREATE UNIQUE INDEX idx_one_active_session_per_actor
    ON impersonation_sessions(actor_user_id)
    WHERE status = 'ACTIVE';
