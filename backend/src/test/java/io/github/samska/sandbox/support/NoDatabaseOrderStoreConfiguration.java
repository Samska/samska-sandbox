package io.github.samska.sandbox.support;

import java.util.Optional;
import java.util.UUID;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

import io.github.samska.sandbox.order.Order;
import io.github.samska.sandbox.order.application.OrderResult;
import io.github.samska.sandbox.order.application.OrderStore;

@TestConfiguration(proxyBeanMethods = false)
public class NoDatabaseOrderStoreConfiguration {

    @Bean
    OrderStore orderStore() {
        return new OrderStore() {

            @Override
            public OrderResult create(UUID paymentAttemptId) {
                throw new UnsupportedOperationException("Order persistence is not available in this test");
            }

            @Override
            public Optional<Order> findById(UUID orderId) {
                throw new UnsupportedOperationException("Order persistence is not available in this test");
            }

            @Override
            public Optional<Order> findByPaymentAttemptId(UUID paymentAttemptId) {
                throw new UnsupportedOperationException("Order persistence is not available in this test");
            }
        };
    }
}
