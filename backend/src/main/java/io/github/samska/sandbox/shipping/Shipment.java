package io.github.samska.sandbox.shipping;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import io.github.samska.sandbox.order.Order;

/**
 * An Order's tracking: its current status and a timeline of what happened, followed by the steps still
 * to come. The status comes from what the administrator recorded, never from the clock.
 */
public record Shipment(UUID orderId, String orderNumber, OrderStatus status, List<ShipmentStep> steps) {

    /**
     * @param placedAt when the Order was created
     * @param changes the recorded status changes, oldest first
     */
    public static Shipment of(UUID orderId, long orderNumber, Instant placedAt, List<StatusChange> changes) {
        var steps = new ArrayList<ShipmentStep>();
        steps.add(new ShipmentStep(OrderStatus.PLACED.name(), placedAt, true));
        changes.forEach(change -> steps.add(new ShipmentStep(change.status().name(), change.at(), true)));

        var status = changes.isEmpty() ? OrderStatus.PLACED : changes.get(changes.size() - 1).status();
        if (!status.isFinal()) {
            var reached = OrderStatus.PATH.indexOf(status);
            OrderStatus.PATH.subList(reached + 1, OrderStatus.PATH.size())
                    .forEach(next -> steps.add(new ShipmentStep(next.name(), null, false)));
        }
        return new Shipment(orderId, Order.displayNumber(orderNumber), status, List.copyOf(steps));
    }

    /** One recorded change of status. */
    public record StatusChange(OrderStatus status, Instant at) {
    }
}
