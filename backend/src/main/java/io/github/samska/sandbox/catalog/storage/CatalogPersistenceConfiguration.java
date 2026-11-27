package io.github.samska.sandbox.catalog.storage;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;

import io.github.samska.sandbox.catalog.application.MediaLimits;
import io.github.samska.sandbox.catalog.application.ProductStore;

@Configuration(proxyBeanMethods = false)
@Profile("!no-database")
public class CatalogPersistenceConfiguration {

    @Bean
    ProductStore productStore(
            DataSource dataSource,
            @Value("${catalog.media.max-total-bytes:" + MediaLimits.MAX_TOTAL_STORED_BYTES + "}") long maxTotalMediaBytes) {
        return new JdbcProductStore(JdbcClient.create(dataSource), maxTotalMediaBytes);
    }
}
