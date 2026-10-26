package io.github.samska.sandbox.support;

import org.testcontainers.postgresql.PostgreSQLContainer;

public final class PostgresTestDatabase {

    private static final PostgreSQLContainer CONTAINER = new PostgreSQLContainer("postgres:18-trixie")
            .withDatabaseName("samska")
            .withUsername("samska_dev")
            .withPassword("test-password");

    static {
        CONTAINER.start();
    }

    private PostgresTestDatabase() {
    }

    public static PostgreSQLContainer container() {
        return CONTAINER;
    }
}
