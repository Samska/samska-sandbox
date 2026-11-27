package io.github.samska.sandbox.catalog.api;

import java.math.BigDecimal;

/** {@code stock} is optional; a new Product starts with 25 units when it is omitted. */
public record CreateProductRequest(String name, String description, BigDecimal price, String mediaKey, Integer stock) {
}
