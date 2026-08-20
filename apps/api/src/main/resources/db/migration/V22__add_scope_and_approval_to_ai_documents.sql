-- ============================================================
-- Flyway Migration V22: Add Scope, Raw Content & Approval Status to AI Documents
-- K2NET FTTH GIS — Enterprise AI Assistant Gateway
-- ============================================================

-- 1. Tambah kolom scope (Visibilitas: PLATFORM_INTERNAL, TENANT_INTERNAL, GLOBAL)
ALTER TABLE ai_documents
    ADD COLUMN IF NOT EXISTS scope VARCHAR(50) NOT NULL DEFAULT 'GLOBAL';

-- 2. Tambah kolom raw_content (Teks asli Markdown untuk kemudahan revisi/edit)
ALTER TABLE ai_documents
    ADD COLUMN IF NOT EXISTS raw_content TEXT;

-- 3. Update status default: PENDING_REVIEW untuk dokumen baru
-- Status yang didukung: DRAFT | PENDING_REVIEW | PROCESSING | INDEXED | REJECTED | FAILED
ALTER TABLE ai_documents
    ALTER COLUMN status SET DEFAULT 'PENDING_REVIEW';

-- 4. Indeks untuk optimasi filter Scope dan Status
CREATE INDEX IF NOT EXISTS idx_ai_documents_scope
    ON ai_documents(tenant_id, scope);

CREATE INDEX IF NOT EXISTS idx_ai_documents_status_scope
    ON ai_documents(tenant_id, status, scope);

-- 5. Klasifikasikan dokumen existing berdasarkan kategori & judul
UPDATE ai_documents
SET scope = 'PLATFORM_INTERNAL'
WHERE scope = 'GLOBAL'
  AND (category IN ('INFRASTRUCTURE', 'PLANS')
       OR title ILIKE '%disaster recovery%'
       OR title ILIKE '%drp%'
       OR title ILIKE '%server%'
       OR title ILIKE '%keamanan%'
       OR title ILIKE '%rbac%'
       OR title ILIKE '%billing%'
       OR title ILIKE '%tier%');

UPDATE ai_documents
SET scope = 'TENANT_INTERNAL'
WHERE scope = 'GLOBAL'
  AND (category IN ('TROUBLESHOOTING', 'NETWORK_CONFIG', 'GIS_MANUAL')
       OR title ILIKE '%olt%'
       OR title ILIKE '%redaman%'
       OR title ILIKE '%gpon%'
       OR title ILIKE '%odp%'
       OR title ILIKE '%fiber%');
