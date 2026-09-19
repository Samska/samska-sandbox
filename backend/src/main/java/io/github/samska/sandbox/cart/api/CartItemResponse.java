package io.github.samska.sandbox.cart.api;

import java.math.BigDecimal;
import java.util.UUID;

import io.github.samska.sandbox.cart.CartItem;

public record CartItemResponse(
        UUID productId,
        String name,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineSubtotal) {

    public static CartItemResponse from(CartItem item) {
        return new CartItemResponse(
                item.product().value(),
                item.name(),
                item.quantity().value(),
                item.unitPrice(),
                item.lineSubtotal());
    }
}
