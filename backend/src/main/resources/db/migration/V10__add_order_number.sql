-- A short, human-friendly Order number for customers. The UUID stays the primary key and the URL id.
CREATE SEQUENCE order_number_seq;

ALTER TABLE orders ADD COLUMN order_number BIGINT;

WITH numbered AS (
    SELECT order_id, ROW_NUMBER() OVER (ORDER BY created_at, order_id) AS n FROM orders
)
UPDATE orders o SET order_number = numbered.n FROM numbered WHERE o.order_id = numbered.order_id;

SELECT setval('order_number_seq', COALESCE((SELECT MAX(order_number) FROM orders), 0) + 1, false);

ALTER TABLE orders
    ALTER COLUMN order_number SET DEFAULT nextval('order_number_seq'),
    ALTER COLUMN order_number SET NOT NULL,
    ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);

ALTER SEQUENCE order_number_seq OWNED BY orders.order_number;
