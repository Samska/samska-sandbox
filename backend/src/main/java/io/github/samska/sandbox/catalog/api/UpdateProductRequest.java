package io.github.samska.sandbox.catalog.api;

import java.math.BigDecimal;

/** {@code stock} is optional; when omitted the units on hand are left as they are. */
public record UpdateProductRequest(String name, String description, BigDecimal price, String mediaKey, Integer stock) {
}
