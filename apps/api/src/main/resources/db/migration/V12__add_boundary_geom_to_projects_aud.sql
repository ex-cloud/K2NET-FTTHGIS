-- V12__add_boundary_geom_to_projects_aud.sql
-- Fix: Hibernate Envers schema-validation fails because V10 added boundary_geom
-- to the 'projects' table but did NOT update the Envers audit table 'projects_aud'.
-- Hibernate validates that audit tables mirror their source tables exactly,
-- so we must add the same column here.

ALTER TABLE projects_aud ADD COLUMN IF NOT EXISTS boundary_geom geometry(Polygon, 4326);
