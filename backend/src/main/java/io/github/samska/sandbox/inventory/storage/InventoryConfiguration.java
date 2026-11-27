package io.github.samska.sandbox.inventory.storage;

import java.time.Clock;
import java.time.Duration;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;

import io.github.samska.sandbox.inventory.application.Inventory;

@Configuration(proxyBeanMethods = false)
public class InventoryConfiguration {

    @Bean
    @Profile("!no-database")
    Inventory inventory(
            DataSource dataSource,
            Clock clock,
            @Value("${samska.inventory.reservation-ttl:PT15M}") Duration reservationTtl) {
        return new JdbcInventory(JdbcClient.create(dataSource), clock, reservationTtl);
    }

    @Bean
    @Profile("no-database")
    Inventory inMemoryInventory() {
        return new InMemoryInventory();
    }
}
