package io.github.samska.sandbox.catalog.application;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;

import io.github.samska.sandbox.catalog.Product;
import io.github.samska.sandbox.catalog.ProductId;

@Service
public class ProductApplicationService {

    private final ProductStore productStore;

    public ProductApplicationService(ProductStore productStore) {
        this.productStore = productStore;
    }

    public Product createProduct(String name, BigDecimal price) {
        var product = new Product(ProductId.generate(), name, price);
        productStore.save(product);
        return product;
    }

    public Product getProduct(ProductId id) {
        return productStore.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }
}
