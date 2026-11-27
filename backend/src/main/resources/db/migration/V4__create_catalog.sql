CREATE TABLE products (
    position BIGINT GENERATED ALWAYS AS IDENTITY,
    product_id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    media_key TEXT,
    CONSTRAINT products_position_unique UNIQUE (position),
    CONSTRAINT products_price_non_negative CHECK (price >= 0)
);

CREATE TABLE product_media (
    product_id UUID PRIMARY KEY REFERENCES products (product_id) ON DELETE CASCADE,
    media_id UUID NOT NULL,
    jpeg BYTEA NOT NULL,
    byte_length INTEGER NOT NULL,
    CONSTRAINT product_media_not_empty CHECK (byte_length > 0)
);
