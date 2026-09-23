package io.github.samska.sandbox.cart.api;

import java.math.BigDecimal;
import java.util.List;

import io.github.samska.sandbox.cart.Cart;

public record CartResponse(List<CartItemResponse> items, BigDecimal total) {

    public static CartResponse from(Cart cart) {
        var snapshot = cart.snapshot();

        return new CartResponse(
                snapshot.items().stream().map(CartItemResponse::from).toList(),
                snapshot.total());
    }
}
