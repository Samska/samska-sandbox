package io.github.samska.sandbox.shipping.application;

import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.github.samska.sandbox.order.OrderSummary;
import io.github.samska.sandbox.order.application.OrderApplicationService;
import io.github.samska.sandbox.shipping.Shipment;
import io.github.samska.sandbox.shipping.ShippingPolicy;

@Service
public class ShipmentService {

    private final OrderApplicationService orders;
    private final Clock clock;
    private final ShippingPolicy policy;

    public ShipmentService(
            OrderApplicationService orders,
            Clock clock,
            @Value("${samska.shipping.packed-after:PT2M}") Duration packedAfter,
            @Value("${samska.shipping.left-warehouse-after:PT10M}") Duration leftWarehouseAfter,
            @Value("${samska.shipping.out-for-delivery-after:PT30M}") Duration outForDeliveryAfter,
            @Value("${samska.shipping.delivered-after:PT60M}") Duration deliveredAfter,
            @Value("${samska.shipping.delay:P1D}") Duration delay) {
        this.orders = orders;
        this.clock = clock;
        this.policy = new ShippingPolicy(packedAfter, leftWarehouseAfter, outForDeliveryAfter, deliveredAfter, delay);
    }

    /** The shipment of one of the signed-in account's Orders; unknown or foreign Orders are not found. */
    public Shipment track(UUID orderId) {
        var summary = orders.summary(orderId);
        return Shipment.of(orderId, summary.orderNumber(), summary.createdAt(), clock.instant(), policy);
    }

    public List<HistoryEntry> history() {
        var now = clock.instant();
        return orders.history().stream()
                .map(summary -> new HistoryEntry(summary, Shipment.of(summary.orderId(), summary.orderNumber(), summary.createdAt(), now, policy)))
                .toList();
    }

    public record HistoryEntry(OrderSummary order, Shipment shipment) {
    }
}
