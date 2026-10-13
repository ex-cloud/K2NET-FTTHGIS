-- ==============================================================================
-- K2NET FTTH GIS — V56: Add Customer Phone and Outage Tracking
-- Support for Customer Contact Numbers and Automated WhatsApp Outage Broadcast
-- ==============================================================================

-- 1. Add phone column to customers table (with index)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 2. Add phone column to Envers audit table (customers_aud)
ALTER TABLE customers_aud ADD COLUMN IF NOT EXISTS phone VARCHAR(32);

COMMENT ON COLUMN customers.phone IS 'Customer WhatsApp/Mobile phone number for automated outage and billing alerts in E.164 format';
