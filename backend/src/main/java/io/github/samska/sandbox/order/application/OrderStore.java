package io.github.samska.sandbox.order.application;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import io.github.samska.sandbox.order.Order;
import io.github.samska.sandbox.order.OrderSummary;

public interface OrderStore {

    OrderResult create(UUID paymentAttemptId);

    Optional<Order> findById(UUID orderId);

    Optional<Order> findByPaymentAttemptId(UUID paymentAttemptId);

    /** The signed-in account's Orders, newest first. */
    List<OrderSummary> listForCurrentAccount();

    /** When the signed-in account's Order was created; empty for an unknown or foreign Order. */
    Optional<Instant> findCreatedAt(UUID orderId);
}
