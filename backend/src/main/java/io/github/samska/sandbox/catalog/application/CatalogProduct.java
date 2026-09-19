package io.github.samska.sandbox.catalog.application;

import java.math.BigDecimal;
import java.util.UUID;

public record CatalogProduct(UUID id, String name, BigDecimal price) {
}
