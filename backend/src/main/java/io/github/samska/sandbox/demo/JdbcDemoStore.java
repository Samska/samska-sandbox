package io.github.samska.sandbox.demo;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.support.TransactionTemplate;

class JdbcDemoStore implements DemoStore {

    static final int DEFAULT_STOCK = 25;

    private final JdbcClient jdbc;
    private final TransactionTemplate transaction;

    JdbcDemoStore(JdbcClient jdbc, TransactionTemplate transaction) {
        this.jdbc = jdbc;
        this.transaction = transaction;
    }

    @Override
    public void reset() {
        transaction.executeWithoutResult(status -> {
            jdbc.sql("TRUNCATE TABLE order_items, orders, payment_attempt_items, payment_attempts, "
                    + "cart_items, cart, stock_reservations").update();
            jdbc.sql("DELETE FROM accounts WHERE role <> 'ADMIN'").update();
            jdbc.sql("UPDATE stock_levels SET on_hand = :stock").param("stock", DEFAULT_STOCK).update();
        });
    }
}
