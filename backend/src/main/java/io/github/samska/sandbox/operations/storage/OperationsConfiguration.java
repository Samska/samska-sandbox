package io.github.samska.sandbox.operations.storage;

import java.time.Instant;

import javax.sql.DataSource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;

import io.github.samska.sandbox.operations.application.OperationsStore;

@Configuration(proxyBeanMethods = false)
public class OperationsConfiguration {

    @Bean
    @Profile("!no-database")
    OperationsStore operationsStore(DataSource dataSource) {
        return new JdbcOperationsStore(JdbcClient.create(dataSource));
    }

    @Bean
    @Profile("no-database")
    OperationsStore inMemoryOperationsStore() {
        return new OperationsStore() {
            @Override
            public Counts counts(Instant now) {
                return new Counts(0, 0, 0, 0, 0);
            }

            @Override
            public long databasePingMillis() {
                return 0;
            }
        };
    }
}
