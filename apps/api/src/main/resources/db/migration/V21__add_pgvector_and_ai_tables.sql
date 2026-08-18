-- ============================================================
-- Flyway Migration V21: pgvector Extension + AI Assistant Tables
-- K2NET FTTH GIS — Enterprise AI Assistant Gateway
-- ============================================================

-- 1. Aktifkan Ekstensi pgvector (PostgreSQL 17)
CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────────────────────
-- 2. Master Dokumen Knowledge Base
--    (SOP, Manual OLT/ONT, Modul Training, Panduan GIS)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    title           VARCHAR(255) NOT NULL,
    category        VARCHAR(100) NOT NULL DEFAULT 'GENERAL',
    -- Kategori: SOP | NETWORK_CONFIG | TROUBLESHOOTING | GIS_MANUAL | BILLING
    file_name       VARCHAR(255),
    file_path       VARCHAR(500),
    file_size_bytes BIGINT,
    mime_type       VARCHAR(100),
    status          VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    -- Status: PENDING | PROCESSING | INDEXED | FAILED
    error_message   TEXT,
    chunk_count     INT NOT NULL DEFAULT 0,
    created_by      UUID,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_documents_tenant
    ON ai_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_documents_status
    ON ai_documents(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_documents_category
    ON ai_documents(tenant_id, category);

-- ─────────────────────────────────────────────────────────────
-- 3. Chunk Dokumen & Vektor Embeddings
--    Dimensi 1536 = OpenAI text-embedding-3-small /
--                   Gemini text-embedding-004
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_document_chunks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id   UUID NOT NULL REFERENCES ai_documents(id) ON DELETE CASCADE,
    tenant_id     UUID NOT NULL,
    chunk_index   INT NOT NULL,
    content       TEXT NOT NULL,
    token_count   INT NOT NULL DEFAULT 0,
    metadata      JSONB DEFAULT '{}'::jsonb,
    embedding     vector(1536),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_chunks_tenant
    ON ai_document_chunks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_chunks_document
    ON ai_document_chunks(document_id);

-- HNSW Index: Pencarian kemiripan Cosine Distance berkecepatan tinggi
-- m=16 edges per node, ef_construction=64 search width at build-time
CREATE INDEX IF NOT EXISTS idx_ai_chunks_embedding_hnsw
    ON ai_document_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ─────────────────────────────────────────────────────────────
-- 4. Session Percakapan AI Assistant (per User & Tenant)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    user_id        UUID NOT NULL,
    title          VARCHAR(255) NOT NULL DEFAULT 'Percakapan Baru',
    context_scope  VARCHAR(50) DEFAULT 'GENERAL',
    -- Scope: GENERAL | GIS_MAP | OLT_DIAGNOSTICS | TASK_COPILOT | BILLING
    model_used     VARCHAR(100) DEFAULT 'gpt-4o-mini',
    -- Track model yang digunakan: gpt-4o | gpt-4o-mini | gemini-1.5-flash | gemini-1.5-pro
    is_archived    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_sessions_user
    ON ai_chat_sessions(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_active
    ON ai_chat_sessions(tenant_id, user_id, is_archived)
    WHERE is_archived = FALSE;

-- ─────────────────────────────────────────────────────────────
-- 5. Detail Pesan Chat (User & Assistant Messages)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    tenant_id   UUID NOT NULL,
    role        VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content     TEXT NOT NULL,
    sources     JSONB DEFAULT '[]'::jsonb,
    -- Referensi dokumen/ODP/OLT yang dikutip oleh RAG engine
    tokens_used INT DEFAULT 0,
    latency_ms  INT DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_session
    ON ai_chat_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_tenant
    ON ai_chat_messages(tenant_id, created_at DESC);
