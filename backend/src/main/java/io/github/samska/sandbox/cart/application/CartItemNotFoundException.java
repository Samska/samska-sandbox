package io.github.samska.sandbox.cart.application;

import java.util.UUID;

public final class CartItemNotFoundException extends RuntimeException {

    public CartItemNotFoundException(UUID productId) {
        super("Cart item not found: " + productId);
    }
}
