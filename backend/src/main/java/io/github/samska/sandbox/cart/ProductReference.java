package io.github.samska.sandbox.cart;

import java.util.UUID;

public record ProductReference(UUID value) {

    public ProductReference {
        if (value == null) {
            throw new InvalidCartException("Product reference must not be null");
        }
    }
}
