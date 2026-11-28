package io.github.samska.sandbox.support;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

public abstract class OrderDatabaseTestSupport extends PostgresTestSupport {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void clearPersistedState() {
        jdbcTemplate.execute("TRUNCATE TABLE order_items, orders");
        jdbcTemplate.execute("TRUNCATE TABLE cart_items, cart CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE product_media, products CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE stock_levels");
        jdbcTemplate.execute("INSERT INTO stock_levels (product_id, on_hand) VALUES "
                + "('11111111-1111-1111-1111-111111111111', 1000), "
                + "('22222222-2222-2222-2222-222222222222', 1000)");
    }
}
