package io.github.samska.sandbox.catalog.storage;

import java.util.Optional;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.stereotype.Component;

import io.github.samska.sandbox.catalog.Product;
import io.github.samska.sandbox.catalog.ProductId;
import io.github.samska.sandbox.catalog.application.ProductStore;

@Component
public class InMemoryProductStore implements ProductStore {

    private final ConcurrentMap<ProductId, Product> products = new ConcurrentHashMap<>();

    @Override
    public void save(Product product) {
        products.put(product.id(), product);
    }

    @Override
    public Optional<Product> findById(ProductId id) {
        return Optional.ofNullable(products.get(id));
    }

    @Override
    public Collection<Product> findAll() {
        return List.copyOf(products.values());
    }
}
