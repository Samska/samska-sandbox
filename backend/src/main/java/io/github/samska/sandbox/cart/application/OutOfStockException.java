package io.github.samska.sandbox.cart.application;

import java.util.UUID;

public class OutOfStockException extends RuntimeException {

    private final UUID productId;
    private final int available;

    public OutOfStockException(UUID productId, int available) {
        super("Only " + available + " units of Product " + productId + " are available");
        this.productId = productId;
        this.available = available;
    }

    public UUID productId() {
        return productId;
    }

    public int available() {
        return available;
    }
}
