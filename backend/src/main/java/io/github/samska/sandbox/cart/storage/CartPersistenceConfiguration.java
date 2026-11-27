package io.github.samska.sandbox.cart.storage;

import javax.sql.DataSource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;

import io.github.samska.sandbox.cart.application.CartStore;

@Configuration(proxyBeanMethods = false)
@Profile("!no-database")
public class CartPersistenceConfiguration {

    @Bean
    CartStore cartStore(DataSource dataSource) {
        return new JdbcCartStore(JdbcClient.create(dataSource));
    }
}
