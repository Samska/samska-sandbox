package io.github.samska.sandbox.order.application;

import java.util.UUID;

/** The units of an approved attempt are no longer free (its hold expired and the stock was sold). */
public final class OrderOutOfStockException extends RuntimeException {

    private final UUID productId;

    public OrderOutOfStockException(UUID productId) {
        super("Not enough stock for Product " + productId);
        this.productId = productId;
    }

    public UUID productId() {
        return productId;
    }
}
