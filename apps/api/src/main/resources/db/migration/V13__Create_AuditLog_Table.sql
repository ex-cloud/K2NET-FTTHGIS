-- Create audit_logs table for audit logging
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
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
    org_id VARCHAR(255)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_status ON audit_logs(status);
