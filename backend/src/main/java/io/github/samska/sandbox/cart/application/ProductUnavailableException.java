package io.github.samska.sandbox.cart.application;

import java.util.UUID;

public final class ProductUnavailableException extends RuntimeException {

    public ProductUnavailableException(UUID productId) {
        super("Product unavailable: " + productId);
    }
}
