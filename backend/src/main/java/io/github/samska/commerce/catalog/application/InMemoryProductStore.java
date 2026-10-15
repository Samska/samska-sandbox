package io.github.samska.commerce.catalog.application;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.stereotype.Component;

import io.github.samska.commerce.catalog.domain.Product;

@Component
public class InMemoryProductStore implements ProductStore {

    private final ReentrantLock lock = new ReentrantLock();
    private final Map<UUID, Product> products = new LinkedHashMap<>();

    @Override
    public void save(Product product) {
        lock.lock();
        try {
            if (products.putIfAbsent(product.id(), product) != null) {
                throw new IllegalStateException("Product already exists: " + product.id());
            }
        } finally {
            lock.unlock();
        }
    }

    @Override
    public Optional<Product> findById(UUID id) {
        lock.lock();
        try {
            return Optional.ofNullable(products.get(id));
        } finally {
            lock.unlock();
        }
    }

    @Override
    public Collection<Product> findAll() {
        lock.lock();
        try {
            return products.values().stream().toList();
        } finally {
            lock.unlock();
        }
    }
}
