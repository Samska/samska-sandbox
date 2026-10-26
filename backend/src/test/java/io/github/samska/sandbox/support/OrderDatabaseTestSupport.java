package io.github.samska.sandbox.support;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

public abstract class OrderDatabaseTestSupport extends PostgresTestSupport {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void clearOrders() {
        jdbcTemplate.execute("TRUNCATE TABLE order_items, orders");
    }
}
