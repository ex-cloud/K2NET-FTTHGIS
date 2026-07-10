-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY,
    external_id VARCHAR(255) NOT NULL UNIQUE,
    org_slug VARCHAR(255) NOT NULL,
    plan_name VARCHAR(50) NOT NULL,
    amount NUMERIC(19, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    payer_email VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Create indexes for quick retrieval
CREATE INDEX IF NOT EXISTS idx_payment_org_slug ON payment_transactions(org_slug);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_created_at ON payment_transactions(created_at);
