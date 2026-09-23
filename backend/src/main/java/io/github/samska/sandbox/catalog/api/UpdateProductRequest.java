package io.github.samska.sandbox.catalog.api;

import java.math.BigDecimal;

public record UpdateProductRequest(String name, String description, BigDecimal price, String mediaKey) {
}
