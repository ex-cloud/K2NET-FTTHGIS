CREATE TABLE database_backups (
    id SERIAL PRIMARY KEY,
    backup_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) NOT NULL,
    success BOOLEAN NOT NULL,
    backup_file VARCHAR(255)
);

CREATE INDEX idx_database_backups_time ON database_backups(backup_time DESC);
