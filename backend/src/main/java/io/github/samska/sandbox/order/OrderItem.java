package io.github.samska.sandbox.order;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItem(UUID productId, String name, BigDecimal unitPrice, int quantity, BigDecimal lineSubtotal) {

    public OrderItem {
        if (productId == null || name == null || name.isBlank() || unitPrice == null
                || unitPrice.signum() < 0 || quantity < 1 || lineSubtotal == null || lineSubtotal.signum() < 0) {
            throw new IllegalArgumentException("Invalid Order item");
        }
    }
}
