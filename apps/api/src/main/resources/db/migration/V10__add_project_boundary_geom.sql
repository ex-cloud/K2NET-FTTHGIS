-- V10__add_project_boundary_geom.sql
-- Add boundary_geom column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS boundary_geom geometry(Polygon, 4326);

-- Create a spatial index on the geometry column for optimization
CREATE INDEX IF NOT EXISTS idx_projects_boundary_geom ON projects USING gist(boundary_geom);
