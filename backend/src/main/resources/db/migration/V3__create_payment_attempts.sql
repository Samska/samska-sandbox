CREATE TABLE payment_attempts (
    attempt_id UUID PRIMARY KEY,
    cart_revision BIGINT NOT NULL,
    scenario TEXT NOT NULL,
    status TEXT NOT NULL,
    total NUMERIC NOT NULL,
    CONSTRAINT payment_attempts_cart_revision_non_negative CHECK (cart_revision >= 0),
    CONSTRAINT payment_attempts_scenario_valid CHECK (scenario IN ('APPROVE', 'DECLINE', 'TEMPORARY_FAILURE')),
    CONSTRAINT payment_attempts_status_valid CHECK (status IN ('APPROVED', 'DECLINED', 'FAILED'))
);

-- One approved attempt per Cart revision; other outcomes may repeat for the same revision.
CREATE UNIQUE INDEX payment_attempts_one_approval_per_revision
    ON payment_attempts (cart_revision)
    WHERE status = 'APPROVED';

CREATE TABLE payment_attempt_items (
    attempt_id UUID NOT NULL REFERENCES payment_attempts (attempt_id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    product_id UUID NOT NULL,
    name TEXT NOT NULL,
    unit_price NUMERIC NOT NULL,
    quantity INTEGER NOT NULL,
    line_subtotal NUMERIC NOT NULL,
    PRIMARY KEY (attempt_id, line_number)
);
