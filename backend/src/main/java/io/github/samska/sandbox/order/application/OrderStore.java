package io.github.samska.sandbox.order.application;

import java.util.Optional;
import java.util.UUID;

import io.github.samska.sandbox.order.Order;

public interface OrderStore {

    OrderResult create(UUID paymentAttemptId);

    Optional<Order> findById(UUID orderId);

    Optional<Order> findByPaymentAttemptId(UUID paymentAttemptId);
}
