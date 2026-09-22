package io.github.samska.sandbox.catalog.api;

import java.math.BigDecimal;

public record CreateProductRequest(String name, String description, BigDecimal price, String mediaKey) {
}
