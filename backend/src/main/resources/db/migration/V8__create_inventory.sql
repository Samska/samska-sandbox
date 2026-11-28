CREATE TABLE stock_levels (
    product_id UUID PRIMARY KEY,
    on_hand INTEGER NOT NULL,
    CONSTRAINT stock_levels_on_hand_non_negative CHECK (on_hand >= 0)
);

-- Products that exist before inventory does start with a stock of 25.
INSERT INTO stock_levels (product_id, on_hand) SELECT product_id, 25 FROM products;

-- A reservation holds units for an approved Payment attempt until its Order consumes them or it expires.
CREATE TABLE stock_reservations (
    attempt_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (attempt_id, product_id),
    CONSTRAINT stock_reservations_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX stock_reservations_product ON stock_reservations (product_id, expires_at);
