package io.github.samska.sandbox.catalog.application;

import java.util.Optional;
import java.util.UUID;

public interface ProductCatalog {

    Optional<CatalogProduct> findById(UUID id);
}
