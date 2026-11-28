package io.github.samska.sandbox.shipping.api;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import io.github.samska.sandbox.shipping.application.ShipmentService.HistoryEntry;

public record OrderHistoryResponse(
        UUID orderId, String orderNumber, Instant createdAt, int itemCount, BigDecimal total, String status) {

    public static OrderHistoryResponse from(HistoryEntry entry) {
        return new OrderHistoryResponse(
                entry.order().orderId(), entry.shipment().orderNumber(), entry.order().createdAt(),
                entry.order().itemCount(), entry.order().total(), entry.shipment().status().name());
    }
}
