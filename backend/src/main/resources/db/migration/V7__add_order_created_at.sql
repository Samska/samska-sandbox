ALTER TABLE orders ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE INDEX orders_account_created ON orders (account_id, created_at DESC);
