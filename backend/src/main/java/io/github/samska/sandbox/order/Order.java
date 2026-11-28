package io.github.samska.sandbox.order;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record Order(UUID orderId, long orderNumber, UUID requestId, long cartRevision, List<OrderItem> items,
        BigDecimal total) {

    /** The Order number shown to people, such as {@code SK-000128}. */
    public static String displayNumber(long orderNumber) {
        return String.format("SK-%06d", orderNumber);
    }

    public Order {
        if (orderId == null || orderNumber < 1 || requestId == null || cartRevision < 0 || items == null || items.isEmpty()
                || total == null || total.signum() < 0) {
            throw new IllegalArgumentException("Invalid Order");
        }
        items = List.copyOf(items);
    }
}
