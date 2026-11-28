package io.github.samska.sandbox.shipping.api;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import io.github.samska.sandbox.order.Order;
import io.github.samska.sandbox.shipping.application.ShipmentStore.HistoryEntry;

public record OrderHistoryResponse(
        UUID orderId, String orderNumber, Instant createdAt, int itemCount, BigDecimal total, String status) {

    public static OrderHistoryResponse from(HistoryEntry entry) {
        return new OrderHistoryResponse(
                entry.orderId(), Order.displayNumber(entry.orderNumber()), entry.createdAt(), entry.itemCount(),
                entry.total(), entry.status().name());
    }
}
