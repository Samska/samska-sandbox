package io.github.samska.sandbox.catalog.application;

import io.github.samska.sandbox.catalog.ProductId;

public final class ProductNotFoundException extends RuntimeException {

    public ProductNotFoundException(ProductId id) {
        super("Product not found: " + id.value());
    }
}
