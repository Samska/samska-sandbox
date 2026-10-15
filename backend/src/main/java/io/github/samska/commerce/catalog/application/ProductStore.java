package io.github.samska.commerce.catalog.application;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

import io.github.samska.commerce.catalog.domain.Product;

public interface ProductStore {

    void save(Product product);

    Optional<Product> findById(UUID id);

    Collection<Product> findAll();
}
