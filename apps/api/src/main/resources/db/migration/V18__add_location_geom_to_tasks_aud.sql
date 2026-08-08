-- V18__add_location_geom_to_tasks_aud.sql
-- Add missing location_geom column to Hibernate Envers tasks_aud audit table to resolve schema validation issues on startup
ALTER TABLE tasks_aud ADD COLUMN IF NOT EXISTS location_geom geometry(Point, 4326);
