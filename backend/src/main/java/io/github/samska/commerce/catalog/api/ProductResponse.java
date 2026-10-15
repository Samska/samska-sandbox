package io.github.samska.commerce.catalog.api;

import java.math.BigDecimal;
import java.util.UUID;

import io.github.samska.commerce.catalog.domain.Product;

public record ProductResponse(
        UUID id,
        String name,
        String description,
        BigDecimal price,
        String mediaKey,
        UUID uploadedMediaId) {

    public static ProductResponse from(Product product) {
        return new ProductResponse(
                product.id(),
                product.name(),
                product.description(),
                product.price(),
                product.mediaKey(),
                null);
    }
}
