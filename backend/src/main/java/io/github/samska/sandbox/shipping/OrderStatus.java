package io.github.samska.sandbox.shipping;

import java.util.List;

/** Where an Order is. The administrator moves it; {@code CANCELLED} is final and returns the stock. */
public enum OrderStatus {
    PLACED,
    PACKED,
    SHIPPED,
    DELIVERED,
    CANCELLED;

    /** The usual path of an Order, in order. */
    public static final List<OrderStatus> PATH = List.of(PLACED, PACKED, SHIPPED, DELIVERED);

    public boolean isFinal() {
        return this == CANCELLED;
    }
}
