-- ============================================================
-- Flyway Migration V23: AI Suggested Prompts & Analytics Tables
-- K2NET FTTH GIS — Enterprise AI Assistant Gateway
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Master Tabel Prompt Rekomendasi (Quick Action Cards)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_suggested_prompts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID, -- NULL = Global Platform, UUID = Tenant Specific
    title           VARCHAR(150) NOT NULL,
    description     VARCHAR(255),
    prompt          TEXT NOT NULL,
    icon            VARCHAR(50) NOT NULL DEFAULT 'Zap',
    category        VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    target_role     VARCHAR(50) NOT NULL DEFAULT 'ALL',
    is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    usage_count     INT NOT NULL DEFAULT 0,
    created_by      UUID,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_prompts_active 
    ON ai_suggested_prompts(is_active, is_pinned);

CREATE INDEX IF NOT EXISTS idx_ai_prompts_category 
    ON ai_suggested_prompts(category);

-- ─────────────────────────────────────────────────────────────
-- 2. Tabel Analitik Pertanyaan Pengguna (Trending Topics Aggregator)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_query_analytics (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID,
    user_id             UUID,
    query_text          TEXT NOT NULL,
    normalized_topic    VARCHAR(150),
    category_detected   VARCHAR(50) DEFAULT 'GENERAL',
    model_used          VARCHAR(80),
    response_time_ms    INT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_analytics_created 
    ON ai_query_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_analytics_topic 
    ON ai_query_analytics(normalized_topic);

-- ─────────────────────────────────────────────────────────────
-- 3. Seed Awal Data Prompt Kanonikal K2NET
-- ─────────────────────────────────────────────────────────────
INSERT INTO ai_suggested_prompts (title, description, prompt, icon, category, target_role, is_pinned, is_active, usage_count)
VALUES
    (
        'Diagnosa OLT & Redaman Optik',
        'Troubleshooting OLT ZTE C320/Huawei, status LOS & redaman nominal',
        'Bagaimana cara troubleshooting OLT ZTE C320 jika port PON statusnya LOS dan berapa standar redaman optik nominalnya?',
        'Zap',
        'OLT_TROUBLESHOOTING',
        'ALL',
        true,
        true,
        42
    ),
    (
        'Analisis Jaringan Spasial GIS & ODP',
        'Standar koordinat PostGIS EPSG:4326, kapasitas splitter 1:8 / 1:16',
        'Jelaskan arsitektur database spasial PostGIS SRID 4326 dan standar penempatan ODP pada jaringan distribusi FTTH.',
        'MapPin',
        'GIS_SPATIAL',
        'ALL',
        true,
        true,
        38
    ),
    (
        'Health Check 12 Microservices',
        'Verifikasi status poller, kong, postgres, keycloak, minio, audit',
        'Jelaskan port map dan arsitektur 12 microservices gateway internal K2NET.',
        'Activity',
        'DEVOPS_INFRA',
        'SUPER_ADMIN',
        true,
        true,
        29
    ),
    (
        'Panduan Backup & Disaster Recovery',
        'SOP 3-Layer backup lokal, MinIO S3, dan Nextcloud offsite cloud',
        'Jelaskan strategi 3-layer disaster recovery backup database dan file di K2NET.',
        'Database',
        'BACKUP_RECOVERY',
        'SUPER_ADMIN',
        false,
        true,
        21
    ),
    (
        'Buat Linear Project & DevOps Task',
        'Integrasi sistem tugas, alur tiket B2B, dan sinkronisasi Obsidian',
        'Jelaskan cara membuat tiket atau proyek DevOps baru yang otomatis tersinkronisasi ke Obsidian Vault.',
        'GitPullRequest',
        'DEVOPS_INFRA',
        'ALL',
        false,
        true,
        18
    ),
    (
        'Keamanan Multi-Tenant & RBAC',
        'One Realm per Org Keycloak, Superadmin God Mode, dan X-Tenant-ID',
        'Jelaskan arsitektur isolasi multi-tenant dan sistem Hybrid RBAC di K2NET FTTH GIS.',
        'ShieldCheck',
        'RBAC_SECURITY',
        'SUPER_ADMIN',
        false,
        true,
        15
    )
ON CONFLICT DO NOTHING;
