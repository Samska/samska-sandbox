package io.github.samska.sandbox.order.application;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import io.github.samska.sandbox.order.Order;
import io.github.samska.sandbox.order.OrderSummary;

@Service
public class OrderApplicationService {

    private final OrderStore store;

    public OrderApplicationService(OrderStore store) {
        this.store = store;
    }

    public OrderResult create(UUID paymentAttemptId) {
        if (paymentAttemptId == null) {
            throw new IllegalArgumentException("Payment attempt ID is required");
        }
        return store.create(paymentAttemptId);
    }

    public Order getById(UUID orderId) {
        return store.findById(orderId).orElseThrow(OrderNotFoundException::new);
    }

    public Order getByPaymentAttemptId(UUID attemptId) {
        return store.findByPaymentAttemptId(attemptId).orElseThrow(OrderNotFoundException::new);
    }

    public List<OrderSummary> history() {
        return store.listForCurrentAccount();
    }

    public Instant createdAt(UUID orderId) {
        return store.findCreatedAt(orderId).orElseThrow(OrderNotFoundException::new);
    }
}
