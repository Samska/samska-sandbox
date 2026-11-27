package io.github.samska.sandbox.shipping;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A simulated shipment. It is derived from the Order's creation time and the current time, so there is
 * no stored state to keep in sync; the same inputs always give the same shipment.
 */
public record Shipment(
        UUID orderId,
        String reference,
        String trackingCode,
        String courier,
        ShipmentStatus status,
        boolean delayed,
        Instant estimatedDelivery,
        List<ShipmentStep> steps) {

    public static final String COURIER = "Simulated Express";

    public static Shipment of(UUID orderId, Instant createdAt, Instant now, ShippingPolicy policy) {
        var delayed = isDelayed(orderId);
        var extra = delayed ? policy.delay() : java.time.Duration.ZERO;

        var packed = createdAt.plus(policy.packedAfter());
        var left = createdAt.plus(policy.leftWarehouseAfter());
        var out = createdAt.plus(policy.outForDeliveryAfter()).plus(extra);
        var delivered = createdAt.plus(policy.deliveredAfter()).plus(extra);

        var steps = List.of(
                new ShipmentStep("ORDER_CREATED", createdAt, true),
                new ShipmentStep("PACKED", packed, !now.isBefore(packed)),
                new ShipmentStep("LEFT_WAREHOUSE", left, !now.isBefore(left)),
                new ShipmentStep("OUT_FOR_DELIVERY", out, !now.isBefore(out)),
                new ShipmentStep("DELIVERED", delivered, !now.isBefore(delivered)));

        ShipmentStatus status;
        if (!now.isBefore(delivered)) {
            status = ShipmentStatus.DELIVERED;
        } else if (!now.isBefore(left)) {
            // Past the warehouse, a delayed shipment reports the delay until it is delivered.
            status = delayed ? ShipmentStatus.DELAYED : ShipmentStatus.IN_TRANSIT;
        } else if (!now.isBefore(packed)) {
            status = ShipmentStatus.PACKED;
        } else {
            status = ShipmentStatus.PROCESSING;
        }

        return new Shipment(orderId, reference(orderId), trackingCode(orderId), COURIER, status, delayed,
                delivered, steps);
    }

    /** About one Order in five is delayed, chosen from the Order ID so it is stable. */
    public static boolean isDelayed(UUID orderId) {
        return Math.floorMod(orderId.getLeastSignificantBits(), 5L) == 0;
    }

    /** The short code shown to people, such as {@code 2AFA-6574}. */
    public static String reference(UUID orderId) {
        var hex = orderId.toString().replace("-", "").toUpperCase(java.util.Locale.ROOT);
        return hex.substring(0, 4) + "-" + hex.substring(4, 8);
    }

    public static String trackingCode(UUID orderId) {
        var hex = orderId.toString().replace("-", "").toUpperCase(java.util.Locale.ROOT);
        return "SK-" + hex.substring(8, 12) + "-" + hex.substring(12, 14);
    }
}
