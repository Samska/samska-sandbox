package io.github.samska.commerce.catalog.application;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import io.github.samska.commerce.catalog.domain.Product;

@Service
public class ProductService {

    private final ProductStore productStore;

    public ProductService(ProductStore productStore) {
        this.productStore = productStore;
    }

    public Product createProduct(String name, String description, BigDecimal price, String mediaKey) {
        var product = new Product(UUID.randomUUID(), name, description, price, mediaKey);
        productStore.save(product);
        return product;
    }

    public Product getProduct(UUID id) {
        return productStore.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }

    public List<Product> listProducts() {
        return List.copyOf(productStore.findAll());
    }
}
