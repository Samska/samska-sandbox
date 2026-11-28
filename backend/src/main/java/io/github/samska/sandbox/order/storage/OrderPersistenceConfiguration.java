package io.github.samska.sandbox.order.storage;

import javax.sql.DataSource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;

import io.github.samska.sandbox.account.CurrentAccount;
import io.github.samska.sandbox.inventory.application.Inventory;
import io.github.samska.sandbox.order.application.OrderStore;

@Configuration(proxyBeanMethods = false)
@Profile("!no-database")
public class OrderPersistenceConfiguration {

    @Bean
    OrderStore orderStore(DataSource dataSource, CurrentAccount currentAccount, Inventory inventory) {
        return new JdbcOrderStore(JdbcClient.create(dataSource), currentAccount, inventory);
    }
}
