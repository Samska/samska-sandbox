package io.github.samska.sandbox.inventory.application;

import java.util.UUID;

public class InsufficientStockException extends RuntimeException {

    private final UUID productId;
    private final int available;

    public InsufficientStockException(UUID productId, int available) {
        super("Not enough stock for Product " + productId);
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
