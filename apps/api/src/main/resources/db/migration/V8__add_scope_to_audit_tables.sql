-- Migration to add scope column to Hibernate Envers audit tables
ALTER TABLE roles_aud ADD COLUMN scope VARCHAR(20);
ALTER TABLE permissions_aud ADD COLUMN scope VARCHAR(20);
