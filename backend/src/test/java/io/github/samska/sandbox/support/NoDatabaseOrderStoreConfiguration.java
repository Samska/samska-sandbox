package io.github.samska.sandbox.support;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

import io.github.samska.sandbox.order.Order;
import io.github.samska.sandbox.order.OrderSummary;
import io.github.samska.sandbox.order.application.CartSnapshotProvider;
import io.github.samska.sandbox.order.application.OrderResult;
import io.github.samska.sandbox.order.application.OrderStore;

@TestConfiguration(proxyBeanMethods = false)
public class NoDatabaseOrderStoreConfiguration {

    @Bean
    OrderStore orderStore() {
        return new OrderStore() {

            @Override
            public OrderResult create(UUID requestId, long cartRevision, CartSnapshotProvider cartSnapshotProvider) {
                throw new UnsupportedOperationException("Order persistence is not available in this test");
            }

            @Override
            public Optional<Order> findById(UUID orderId) {
                throw new UnsupportedOperationException("Order persistence is not available in this test");
            }

            @Override
            public List<OrderSummary> listForCurrentAccount() {
                throw new UnsupportedOperationException("Order persistence is not available in this test");
            }

            @Override
            public Optional<OrderSummary> findSummary(UUID orderId) {
                throw new UnsupportedOperationException("Order persistence is not available in this test");
            }
        };
    }
}
