package io.github.samska.sandbox.catalog.application;

import java.util.Optional;

import io.github.samska.sandbox.catalog.Product;
import io.github.samska.sandbox.catalog.ProductId;

public interface ProductStore {

    void save(Product product);

    Optional<Product> findById(ProductId id);
}
