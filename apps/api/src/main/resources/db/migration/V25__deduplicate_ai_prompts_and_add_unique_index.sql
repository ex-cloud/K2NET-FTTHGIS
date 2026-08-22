-- ============================================================
-- Flyway Migration V25: Deduplicate AI Suggested Prompts & Add Unique Index
-- K2NET FTTH GIS — Enterprise AI Assistant Gateway
-- ============================================================

-- 1. Hapus duplikasi record prompt dengan mempertahankan entri yang paling sering digunakan (usage_count tertinggi)
DELETE FROM ai_suggested_prompts
WHERE id NOT IN (
    SELECT DISTINCT ON (LOWER(TRIM(title))) id
    FROM ai_suggested_prompts
    ORDER BY LOWER(TRIM(title)), usage_count DESC, created_at DESC
);

-- 2. Buat unique index agar duplikasi judul prompt tidak dapat terjadi lagi
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_suggested_prompts_title 
    ON ai_suggested_prompts(LOWER(TRIM(title)));
