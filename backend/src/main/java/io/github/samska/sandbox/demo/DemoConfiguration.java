package io.github.samska.sandbox.demo;

import javax.sql.DataSource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.support.TransactionTemplate;

@Configuration(proxyBeanMethods = false)
@EnableScheduling
public class DemoConfiguration {

    @Bean
    @Profile("!no-database")
    DemoStore demoStore(DataSource dataSource) {
        return new JdbcDemoStore(JdbcClient.create(dataSource),
                new TransactionTemplate(new DataSourceTransactionManager(dataSource)));
    }

    @Bean
    @Profile("no-database")
    DemoStore inMemoryDemoStore() {
        return () -> { };
    }
}
