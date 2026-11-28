-- The administrator sets an Order's status. An Order with no event is Placed; each change adds one row,
-- so the customer's timeline shows when it really happened.
CREATE TABLE order_status_events (
    event_id BIGSERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders (order_id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT order_status_events_status_valid CHECK (status IN ('PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'PLACED'))
);

CREATE INDEX order_status_events_order ON order_status_events (order_id, event_id);
