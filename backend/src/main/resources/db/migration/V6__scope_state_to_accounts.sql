-- Cart, Payment attempts and Orders belong to an owner. Rows created before accounts existed are
-- attached to the nil UUID, which no account can have, so they remain readable only when
-- authentication is not enforced (local tests).

CREATE TEMPORARY TABLE cart_old AS SELECT revision FROM cart WHERE cart_id = 1;
CREATE TEMPORARY TABLE cart_items_old AS
    SELECT line_number, product_id, name, unit_price, quantity FROM cart_items;

DROP TABLE cart_items;
DROP TABLE cart;

CREATE TABLE cart (
    owner_id UUID PRIMARY KEY,
    revision BIGINT NOT NULL,
    CONSTRAINT cart_revision_non_negative CHECK (revision >= 0)
);

CREATE TABLE cart_items (
    owner_id UUID NOT NULL REFERENCES cart (owner_id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    product_id UUID NOT NULL,
    name TEXT NOT NULL,
    unit_price NUMERIC NOT NULL,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (owner_id, line_number),
    CONSTRAINT cart_items_product_unique UNIQUE (owner_id, product_id),
    CONSTRAINT cart_items_quantity_positive CHECK (quantity >= 1)
);

INSERT INTO cart (owner_id, revision)
    SELECT '00000000-0000-0000-0000-000000000000', revision FROM cart_old;
INSERT INTO cart_items (owner_id, line_number, product_id, name, unit_price, quantity)
    SELECT '00000000-0000-0000-0000-000000000000', line_number, product_id, name, unit_price, quantity
    FROM cart_items_old;

DROP TABLE cart_items_old;
DROP TABLE cart_old;

ALTER TABLE payment_attempts
    ADD COLUMN account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE payment_attempts ALTER COLUMN account_id DROP DEFAULT;

-- Cart revisions are per owner, so the one-approval rule is per owner and revision.
DROP INDEX payment_attempts_one_approval_per_revision;
CREATE UNIQUE INDEX payment_attempts_one_approval_per_revision
    ON payment_attempts (account_id, cart_revision)
    WHERE status = 'APPROVED';

ALTER TABLE orders
    ADD COLUMN account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE orders ALTER COLUMN account_id DROP DEFAULT;
CREATE INDEX orders_account_id ON orders (account_id);
