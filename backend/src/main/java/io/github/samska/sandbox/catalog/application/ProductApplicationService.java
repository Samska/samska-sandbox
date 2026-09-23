package io.github.samska.sandbox.catalog.application;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;

import io.github.samska.sandbox.catalog.Product;
import io.github.samska.sandbox.catalog.ProductId;

@Service
public class ProductApplicationService implements ProductCatalog {

    private final ProductStore productStore;

    public ProductApplicationService(ProductStore productStore) {
        this.productStore = productStore;
    }

    public Product createProduct(String name, String description, BigDecimal price, String mediaKey) {
        var product = new Product(ProductId.generate(), name, description, price, mediaKey);
        productStore.save(product);
        return product;
    }

    public Product updateProduct(ProductId id, String name, String description, BigDecimal price, String mediaKey) {
        var updatedProduct = new Product(id, name, description, price, mediaKey);
        if (!productStore.replace(updatedProduct)) {
            throw new ProductNotFoundException(id);
        }
        return updatedProduct;
    }

    public void deleteProduct(ProductId id) {
        if (!productStore.deleteById(id)) {
            throw new ProductNotFoundException(id);
        }
    }

    public Product getProduct(ProductId id) {
        return productStore.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }

    public List<Product> listProducts() {
        return productStore.findAll().stream().toList();
    }

    @Override
    public Optional<CatalogProduct> findById(UUID id) {
        return productStore.findById(new ProductId(id))
                .map(product -> new CatalogProduct(product.id().value(), product.name(), product.price()));
    }
}
