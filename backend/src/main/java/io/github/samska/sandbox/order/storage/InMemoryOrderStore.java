package io.github.samska.sandbox.order.storage;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import io.github.samska.sandbox.order.Order;
import io.github.samska.sandbox.order.OrderItem;
import io.github.samska.sandbox.order.application.OrderCapacityExceededException;
import io.github.samska.sandbox.order.application.OrderPaymentNotApprovedException;
import io.github.samska.sandbox.order.application.OrderResult;
import io.github.samska.sandbox.order.application.OrderStore;
import io.github.samska.sandbox.payment.PaymentStatus;
import io.github.samska.sandbox.payment.application.PaymentAttempts;

@Component
public class InMemoryOrderStore implements OrderStore {

    private final ReentrantLock lock = new ReentrantLock();
    private final Map<UUID, Order> byId = new HashMap<>();
    private final Map<UUID, Order> byAttempt = new HashMap<>();
    private final PaymentAttempts attempts;
    private final int capacity;

    @Autowired
    public InMemoryOrderStore(PaymentAttempts attempts) {
        this(attempts, 32);
    }

    // Allows the otherwise unreachable capacity boundary to be exercised with a constrained store.
    InMemoryOrderStore(PaymentAttempts attempts, int capacity) {
        if (capacity < 1) {
            throw new IllegalArgumentException("Order capacity must be positive");
        }
        this.attempts = attempts;
        this.capacity = capacity;
    }

    @Override
    public OrderResult create(UUID attemptId) {
        var proposedOrderId = UUID.randomUUID();
        lock.lock();
        try {
            var existing = byAttempt.get(attemptId);
            if (existing != null) {
                return new OrderResult(existing, false);
            }

            // Directional lock order: Order -> Payment. Payment never calls Order.
            var attempt = attempts.getAttempt(attemptId);
            if (attempt.status() != PaymentStatus.APPROVED) {
                throw new OrderPaymentNotApprovedException();
            }
            if (byAttempt.size() >= capacity) {
                throw new OrderCapacityExceededException();
            }

            var items = attempt.items().stream().map(item -> new OrderItem(item.productId(), item.name(),
                    item.unitPrice(), item.quantity().value(), item.lineSubtotal())).toList();
            var order = new Order(proposedOrderId, attemptId, attempt.cartRevision(), items, attempt.total());
            byAttempt.put(attemptId, order);
            byId.put(order.orderId(), order);
            return new OrderResult(order, true);
        } finally {
            lock.unlock();
        }
    }

    @Override
    public Optional<Order> findById(UUID orderId) {
        lock.lock();
        try {
            return Optional.ofNullable(byId.get(orderId));
        } finally {
            lock.unlock();
        }
    }

    @Override
    public Optional<Order> findByPaymentAttemptId(UUID attemptId) {
        lock.lock();
        try {
            return Optional.ofNullable(byAttempt.get(attemptId));
        } finally {
            lock.unlock();
        }
    }
}
