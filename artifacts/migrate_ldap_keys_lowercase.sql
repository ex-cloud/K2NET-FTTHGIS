-- Migrate LDAP keys to lowercase for frontend compatibility
UPDATE organization_configs 
SET config_key = LOWER(config_key) 
WHERE config_key LIKE 'LDAP_%';

-- Verify the change
SELECT config_key, config_value FROM organization_configs WHERE config_key LIKE 'ldap_%';
