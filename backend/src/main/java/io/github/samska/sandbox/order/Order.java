package io.github.samska.sandbox.order;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record Order(UUID orderId, UUID paymentAttemptId, long cartRevision, List<OrderItem> items, BigDecimal total) {

    public Order {
        if (orderId == null || paymentAttemptId == null || cartRevision < 0 || items == null || items.isEmpty()
                || total == null || total.signum() < 0) {
            throw new IllegalArgumentException("Invalid Order");
        }
        items = List.copyOf(items);
    }
}
