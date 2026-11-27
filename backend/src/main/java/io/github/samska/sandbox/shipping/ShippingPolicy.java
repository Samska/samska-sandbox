package io.github.samska.sandbox.shipping;

import java.time.Duration;

/** How long after the Order each simulated step happens, and how long a delay adds. */
public record ShippingPolicy(
        Duration packedAfter,
        Duration leftWarehouseAfter,
        Duration outForDeliveryAfter,
        Duration deliveredAfter,
        Duration delay) {

    public ShippingPolicy {
        if (packedAfter.isNegative()
                || leftWarehouseAfter.compareTo(packedAfter) < 0
                || outForDeliveryAfter.compareTo(leftWarehouseAfter) < 0
                || deliveredAfter.compareTo(outForDeliveryAfter) < 0
                || delay.isNegative()) {
            throw new IllegalArgumentException("Shipping steps must be in order and delays not negative");
        }
    }

    /** Demo-friendly defaults: a whole delivery takes about an hour; a delay adds a day. */
    public static ShippingPolicy demo() {
        return new ShippingPolicy(
                Duration.ofMinutes(2), Duration.ofMinutes(10), Duration.ofMinutes(30), Duration.ofMinutes(60),
                Duration.ofDays(1));
    }
}
