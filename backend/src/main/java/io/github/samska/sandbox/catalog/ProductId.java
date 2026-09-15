package io.github.samska.sandbox.catalog;

import java.util.UUID;

public record ProductId(UUID value) {

    public ProductId {
        if (value == null) {
            throw new IllegalArgumentException("Product ID must not be null");
        }
    }

    public static ProductId generate() {
        return new ProductId(UUID.randomUUID());
    }
}
