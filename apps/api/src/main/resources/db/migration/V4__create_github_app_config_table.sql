-- Flyway migration: create GitHub app config storage table
CREATE TABLE IF NOT EXISTS github_app_config (
    config_key VARCHAR(150) PRIMARY KEY,
    config_value TEXT,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    created_by VARCHAR(100),
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_github_app_config_category ON github_app_config (category);
