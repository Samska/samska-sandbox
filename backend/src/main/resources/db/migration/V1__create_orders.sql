CREATE TABLE orders (
    order_id UUID PRIMARY KEY,
    payment_attempt_id UUID NOT NULL,
    cart_revision BIGINT NOT NULL,
    total NUMERIC NOT NULL,
    CONSTRAINT orders_payment_attempt_id_unique UNIQUE (payment_attempt_id)
);

CREATE TABLE order_items (
    order_id UUID NOT NULL REFERENCES orders (order_id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    product_id UUID NOT NULL,
    name TEXT NOT NULL,
    unit_price NUMERIC NOT NULL,
    quantity INTEGER NOT NULL,
    line_subtotal NUMERIC NOT NULL,
    PRIMARY KEY (order_id, line_number)
);
