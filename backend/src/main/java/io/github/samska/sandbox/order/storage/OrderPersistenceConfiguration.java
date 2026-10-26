package io.github.samska.sandbox.order.storage;

import javax.sql.DataSource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;

import io.github.samska.sandbox.order.application.OrderStore;
import io.github.samska.sandbox.payment.application.PaymentAttempts;

@Configuration(proxyBeanMethods = false)
@Profile("!no-database")
public class OrderPersistenceConfiguration {

    @Bean
    OrderStore orderStore(DataSource dataSource, PaymentAttempts attempts) {
        return new JdbcOrderStore(JdbcClient.create(dataSource), attempts);
    }
}
