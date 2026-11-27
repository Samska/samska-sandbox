package io.github.samska.sandbox.payment.application;

import java.util.UUID;

/** An approval needs units that are no longer free; nothing was recorded. */
public final class PaymentOutOfStockException extends RuntimeException {

    private final UUID productId;

    public PaymentOutOfStockException(UUID productId) {
        super("Not enough stock for Product " + productId);
        this.productId = productId;
    }

    public UUID productId() {
        return productId;
    }
}
