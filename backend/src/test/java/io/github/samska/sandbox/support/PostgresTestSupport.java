package io.github.samska.sandbox.support;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

public abstract class PostgresTestSupport {

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        var container = PostgresTestDatabase.container();
        registry.add("spring.datasource.url", container::getJdbcUrl);
        registry.add("spring.datasource.username", container::getUsername);
        registry.add("spring.datasource.password", container::getPassword);
    }
}
