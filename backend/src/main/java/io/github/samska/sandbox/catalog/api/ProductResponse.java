package io.github.samska.sandbox.catalog.api;

import java.math.BigDecimal;
import java.util.UUID;

import io.github.samska.sandbox.catalog.Product;

public record ProductResponse(UUID id, String name, String description, BigDecimal price) {

    public static ProductResponse from(Product product) {
        return new ProductResponse(product.id().value(), product.name(), product.description(), product.price());
    }
}
