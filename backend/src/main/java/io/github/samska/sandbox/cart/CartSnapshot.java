package io.github.samska.sandbox.cart;

import java.math.BigDecimal;
import java.util.List;

public record CartSnapshot(List<CartItem> items, BigDecimal total, long revision) {

    public CartSnapshot {
        if (items == null) {
            throw new InvalidCartException("Cart snapshot items must not be null");
        }
        if (total == null) {
            throw new InvalidCartException("Cart snapshot total must not be null");
        }
        if (revision < 0) {
            throw new InvalidCartException("Cart snapshot revision must not be negative");
        }
        items = List.copyOf(items);
    }
}
