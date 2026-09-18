package io.github.samska.sandbox.catalog.api;

import java.math.BigDecimal;

public record CreateProductRequest(String name, BigDecimal price) {
}
