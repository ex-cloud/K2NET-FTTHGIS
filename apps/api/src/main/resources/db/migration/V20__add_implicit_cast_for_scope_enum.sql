-- ============================================================
-- V20: Add implicit cast for task_scope_enum
-- Allows Hibernate/Spring Data to query using String bindings without casting errors.
-- Safe for pre-existing casts.
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_cast 
        WHERE castsource = 'character varying'::regtype 
          AND casttarget = 'task_scope_enum'::regtype
    ) THEN
        CREATE CAST (varchar AS task_scope_enum) WITH INOUT AS IMPLICIT;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;
