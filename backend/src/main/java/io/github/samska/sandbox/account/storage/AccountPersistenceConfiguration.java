package io.github.samska.sandbox.account.storage;

import javax.sql.DataSource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;

import io.github.samska.sandbox.account.application.AccountStore;

@Configuration(proxyBeanMethods = false)
public class AccountPersistenceConfiguration {

    @Bean
    @Profile("!no-database")
    AccountStore accountStore(DataSource dataSource) {
        return new JdbcAccountStore(JdbcClient.create(dataSource));
    }

    @Bean
    @Profile("no-database")
    AccountStore inMemoryAccountStore() {
        return new InMemoryAccountStore();
    }
}
