package io.github.samska.sandbox.inventory.storage;

import javax.sql.DataSource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;

import io.github.samska.sandbox.inventory.application.Inventory;

@Configuration(proxyBeanMethods = false)
public class InventoryConfiguration {

    @Bean
    @Profile("!no-database")
    Inventory inventory(DataSource dataSource) {
        return new JdbcInventory(JdbcClient.create(dataSource));
    }

    @Bean
    @Profile("no-database")
    Inventory inMemoryInventory() {
        return new InMemoryInventory();
    }
}
