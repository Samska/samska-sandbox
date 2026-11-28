package io.github.samska.sandbox.catalog.api;

import java.math.BigDecimal;
import java.util.UUID;

import io.github.samska.sandbox.catalog.Product;

/** {@code stock} is the number of units a customer can still buy (on hand minus held units). */
public record ProductResponse(
        UUID id, String name, String description, BigDecimal price, String mediaKey, UUID uploadedMediaId,
        int stock) {

    public static ProductResponse from(Product product, UUID uploadedMediaId, int stock) {
        return new ProductResponse(
                product.id().value(),
                product.name(),
                product.description(),
                product.price(),
                product.mediaKey(),
                uploadedMediaId,
                stock);
    }
}
