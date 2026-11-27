CREATE TABLE cart (
    cart_id SMALLINT PRIMARY KEY,
    revision BIGINT NOT NULL,
    CONSTRAINT cart_single_row CHECK (cart_id = 1),
    CONSTRAINT cart_revision_non_negative CHECK (revision >= 0)
);

CREATE TABLE cart_items (
    cart_id SMALLINT NOT NULL REFERENCES cart (cart_id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    product_id UUID NOT NULL,
    name TEXT NOT NULL,
    unit_price NUMERIC NOT NULL,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (cart_id, line_number),
    CONSTRAINT cart_items_product_unique UNIQUE (cart_id, product_id),
    CONSTRAINT cart_items_quantity_positive CHECK (quantity >= 1)
);

INSERT INTO cart (cart_id, revision) VALUES (1, 0);
