package io.github.samska.sandbox.shipping.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import io.github.samska.sandbox.shipping.OrderStatus;
import io.github.samska.sandbox.shipping.Shipment;

/** Stored Order statuses. The customer methods see only the signed-in account's Orders. */
public interface ShipmentStore {

    /** The signed-in account's Orders, newest first. */
    List<HistoryEntry> history();

    /** The signed-in account's Order tracking; empty for an unknown or foreign Order. */
    Optional<Shipment> track(UUID orderId);

    /** Every Order, newest first, optionally only those in one status. */
    List<AdminOrder> listAll(OrderStatus status);

    /**
     * Records the new status. Cancelling returns the Order's units to stock in the same transaction.
     *
     * @throws io.github.samska.sandbox.order.application.OrderNotFoundException for an unknown Order
     * @throws InvalidStatusChangeException when the Order is cancelled or already has that status
     */
    AdminOrder changeStatus(UUID orderId, OrderStatus status);

    record HistoryEntry(UUID orderId, long orderNumber, Instant createdAt, int itemCount, BigDecimal total,
            OrderStatus status) {
    }

    record AdminOrder(UUID orderId, long orderNumber, Instant createdAt, String customerEmail, BigDecimal total,
            OrderStatus status, List<Line> lines) {
    }

    record Line(String name, int quantity) {
    }
}
