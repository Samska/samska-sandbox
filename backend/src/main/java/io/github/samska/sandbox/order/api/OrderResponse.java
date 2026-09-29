package io.github.samska.sandbox.order.api;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import io.github.samska.sandbox.order.Order;

public record OrderResponse(UUID orderId, UUID paymentAttemptId, long cartRevision,
        List<OrderItemResponse> items, BigDecimal total) {

    public static OrderResponse from(Order order) {
        return new OrderResponse(order.orderId(), order.paymentAttemptId(), order.cartRevision(),
                order.items().stream().map(item -> new OrderItemResponse(item.productId(), item.name(),
                        item.unitPrice(), item.quantity(), item.lineSubtotal())).toList(), order.total());
    }

    public record OrderItemResponse(UUID productId, String name, BigDecimal unitPrice,
            int quantity, BigDecimal lineSubtotal) {
    }
}
