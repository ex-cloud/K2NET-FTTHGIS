-- V17__create_tasks_table.sql
-- Task Management module: unified tasks table for Ticketing & Project Management
-- Tenant isolation: organization_id FK to organizations (via OrganizationAwareEntity)
-- GIS: location_geom geometry(Point, 4326) for SRID 4326 (WGS84, consistent with V10)

-- ============================================================
-- 1. ENUM types (PostgreSQL CHECK constraints used instead to
--    stay Hibernate-friendly — enums stored as VARCHAR)
-- ============================================================

-- ============================================================
-- 2. Main tasks table
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
    -- Identity
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Classification (Ticketing vs Project)
    type                VARCHAR(20)     NOT NULL
                        CHECK (type IN ('TICKET', 'PROJECT')),
    status              VARCHAR(30)     NOT NULL DEFAULT 'TODO'
                        CHECK (status IN ('BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'RESOLVED', 'CLOSED')),
    priority            VARCHAR(10)     NOT NULL DEFAULT 'NORMAL'
                        CHECK (priority IN ('URGENT', 'HIGH', 'NORMAL', 'LOW')),

    -- Content
    title               VARCHAR(500)    NOT NULL,
    description         TEXT,

    -- Keycloak user references (UUID stored as VARCHAR — Keycloak UUIDs)
    reporter_id         VARCHAR(255)    NOT NULL,
    assignee_id         VARCHAR(255),

    -- Multi-tenancy (CRITICAL): FK to organizations table
    organization_id     UUID            NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- GIS reference (optional — links task to spatial element on map)
    reference_type      VARCHAR(50),    -- e.g. 'ODP', 'ODC', 'FIBER_CABLE', 'CUSTOMER'
    reference_id        VARCHAR(255),   -- e.g. 'ODP-BDG-012'
    location_geom       geometry(Point, 4326),  -- pin location on map (SRID 4326 / WGS84)

    -- Task hierarchy (parent-child for project sub-tasks)
    parent_task_id      UUID            REFERENCES tasks(id) ON DELETE SET NULL,

    -- SLA & deadline
    due_date            TIMESTAMP WITH TIME ZONE,
    resolved_at         TIMESTAMP WITH TIME ZONE,

    -- Obsidian Vault ref (auto-generated for PROJECT type)
    obsidian_ref        VARCHAR(255),   -- format: PRJ-YYYY-MM-NNN or TKT-YYYY-MM-NNN

    -- Audit trail (managed by AuditableEntity / Spring Data JPA Auditing)
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by          VARCHAR(255)
);

-- ============================================================
-- 3. Task comments table
-- ============================================================
CREATE TABLE IF NOT EXISTS task_comments (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID            NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id   VARCHAR(255)    NOT NULL,
    content     TEXT            NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by  VARCHAR(255),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by  VARCHAR(255)
);

-- ============================================================
-- 4. Hibernate Envers audit tables (tasks_aud)
-- NOTE: Envers creates these automatically on startup, but
--       we pre-create to guarantee structure and avoid
--       schema conflicts in production.
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks_aud (
    id              UUID        NOT NULL,
    rev             INTEGER     NOT NULL,
    revtype         SMALLINT,
    type            VARCHAR(20),
    status          VARCHAR(30),
    priority        VARCHAR(10),
    title           VARCHAR(500),
    description     TEXT,
    reporter_id     VARCHAR(255),
    assignee_id     VARCHAR(255),
    organization_id UUID,
    reference_type  VARCHAR(50),
    reference_id    VARCHAR(255),
    parent_task_id  UUID,
    due_date        TIMESTAMP WITH TIME ZONE,
    resolved_at     TIMESTAMP WITH TIME ZONE,
    obsidian_ref    VARCHAR(255),
    created_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_at      TIMESTAMP WITH TIME ZONE,
    updated_by      VARCHAR(255),
    PRIMARY KEY (id, rev)
);

-- ============================================================
-- 5. Performance indexes
-- ============================================================

-- Tenant isolation — most critical index (every query filters by org)
CREATE INDEX IF NOT EXISTS idx_tasks_org_id
    ON tasks(organization_id);

-- Type + status combo (most common filter: "all open tickets for this org")
CREATE INDEX IF NOT EXISTS idx_tasks_type_status
    ON tasks(type, status);

-- Assignee lookup (NOC "my tasks" view)
CREATE INDEX IF NOT EXISTS idx_tasks_assignee
    ON tasks(assignee_id);

-- Priority filter (URGENT ticket dashboard)
CREATE INDEX IF NOT EXISTS idx_tasks_priority
    ON tasks(priority);

-- Parent-child hierarchy traversal
CREATE INDEX IF NOT EXISTS idx_tasks_parent
    ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

-- Spatial index for GIS map overlay queries (GIST — PostGIS standard)
CREATE INDEX IF NOT EXISTS idx_tasks_location_geom
    ON tasks USING GIST (location_geom) WHERE location_geom IS NOT NULL;

-- Task comments lookup
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id
    ON task_comments(task_id);

-- ============================================================
-- 6. Comments
-- ============================================================
COMMENT ON TABLE tasks IS 'Unified task table for Ticketing (TICKET) and Project Management (PROJECT). Tenant-isolated via organization_id.';
COMMENT ON COLUMN tasks.type IS 'TICKET: customer support / outage ticket. PROJECT: infrastructure project (cable pull, pole installation, etc.)';
COMMENT ON COLUMN tasks.obsidian_ref IS 'Auto-generated reference for Obsidian Vault sync. Format: PRJ-YYYY-MM-NNN (PROJECT) or TKT-YYYY-MM-NNN (TICKET priority HIGH/URGENT).';
COMMENT ON COLUMN tasks.location_geom IS 'Optional GIS pin for the task location. SRID 4326 (WGS84). Used in Global Spatial Map overlay.';
