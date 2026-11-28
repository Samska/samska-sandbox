ALTER TABLE payment_attempts ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE INDEX payment_attempts_created ON payment_attempts (created_at DESC);
