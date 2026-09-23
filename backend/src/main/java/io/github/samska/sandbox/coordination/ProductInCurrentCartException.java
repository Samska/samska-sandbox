package io.github.samska.sandbox.coordination;

import java.util.UUID;

public final class ProductInCurrentCartException extends RuntimeException {

    public ProductInCurrentCartException(UUID productId) {
        super("Product is in the current Cart: " + productId);
    }
}
