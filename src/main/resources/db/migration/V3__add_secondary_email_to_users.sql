-- Add secondary_email column to users and users_aud tables
ALTER TABLE users ADD COLUMN secondary_email VARCHAR(255);
ALTER TABLE users_aud ADD COLUMN secondary_email VARCHAR(255);
