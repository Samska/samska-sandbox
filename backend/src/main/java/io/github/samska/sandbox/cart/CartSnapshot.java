package io.github.samska.sandbox.cart;

import java.math.BigDecimal;
import java.util.List;

public record CartSnapshot(List<CartItem> items, BigDecimal total) {

    public CartSnapshot {
        if (items == null) {
            throw new InvalidCartException("Cart snapshot items must not be null");
        }
        if (total == null) {
            throw new InvalidCartException("Cart snapshot total must not be null");
        }
        items = List.copyOf(items);
    }
}
