package io.github.samska.sandbox.catalog.application;

import java.util.Optional;
import java.util.Collection;

import io.github.samska.sandbox.catalog.Product;
import io.github.samska.sandbox.catalog.ProductId;

public interface ProductStore {

    void save(Product product);

    boolean replace(Product product);

    boolean deleteById(ProductId id);

    Optional<Product> findById(ProductId id);

    Collection<Product> findAll();
}
