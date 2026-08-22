-- ============================================================
-- Flyway Migration V26: AI Chat Feedback & RLHF Logging Table
-- K2NET FTTH GIS — Enterprise AI Assistant Gateway
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_chat_feedback (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID,
    session_id          VARCHAR(100),
    message_id          VARCHAR(100),
    query_text          TEXT,
    response_text       TEXT,
    feedback_type       VARCHAR(20) NOT NULL, -- 'like' | 'dislike'
    reason              TEXT,
    model_used          VARCHAR(80),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_type 
    ON ai_chat_feedback(feedback_type);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_created 
    ON ai_chat_feedback(created_at DESC);
