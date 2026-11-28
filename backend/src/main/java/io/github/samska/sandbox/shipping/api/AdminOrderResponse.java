package io.github.samska.sandbox.shipping.api;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import io.github.samska.sandbox.order.Order;
import io.github.samska.sandbox.shipping.application.ShipmentStore.AdminOrder;

public record AdminOrderResponse(
        UUID orderId, String orderNumber, Instant createdAt, String customerEmail, BigDecimal total, String status,
        List<Line> lines) {

    public record Line(String name, int quantity) {
    }

    public static AdminOrderResponse from(AdminOrder order) {
        return new AdminOrderResponse(
                order.orderId(), Order.displayNumber(order.orderNumber()), order.createdAt(), order.customerEmail(),
                order.total(), order.status().name(),
                order.lines().stream().map(line -> new Line(line.name(), line.quantity())).toList());
    }
}
