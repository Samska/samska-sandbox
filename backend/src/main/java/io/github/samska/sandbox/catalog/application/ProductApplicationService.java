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
    private final ProductMediaNormalizer productMediaNormalizer;

    public ProductApplicationService(ProductStore productStore, ProductMediaNormalizer productMediaNormalizer) {
        this.productStore = productStore;
        this.productMediaNormalizer = productMediaNormalizer;
    }

    public Product createProduct(String name, String description, BigDecimal price, String mediaKey) {
        var product = new Product(ProductId.generate(), name, description, price, mediaKey);
        productStore.save(product);
        return product;
    }

    public ProductSnapshot updateProduct(
            ProductId id, String name, String description, BigDecimal price, String mediaKey) {
        var updatedProduct = new Product(id, name, description, price, mediaKey);
        return productStore.replaceProduct(updatedProduct)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }

    public void deleteProduct(ProductId id) {
        if (!productStore.deleteById(id)) {
            throw new ProductNotFoundException(id);
        }
    }

    public Product getProduct(ProductId id) {
        return getSnapshot(id).product();
    }

    public ProductSnapshot getSnapshot(ProductId id) {
        return productStore.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }

    public List<ProductSnapshot> listProducts() {
        return productStore.findAll().stream().toList();
    }

    public ProductSnapshot uploadMedia(ProductId id, byte[] content) {
        var normalized = productMediaNormalizer.normalizeJpeg(content);
        var media = new UploadedMedia(UUID.randomUUID(), normalized);
        var change = productStore.replaceMedia(id, media);

        return switch (change.result()) {
            case UPDATED -> change.snapshot();
            case PRODUCT_NOT_FOUND -> throw new ProductNotFoundException(id);
            case CAPACITY_EXCEEDED -> throw new MediaCapacityExceededException();
            case REMOVED, NO_MEDIA -> throw new IllegalStateException(
                    "Unexpected media replacement result: " + change.result());
        };
    }

    public void removeMedia(ProductId id) {
        var result = productStore.removeMedia(id);

        switch (result) {
            case REMOVED, NO_MEDIA -> {
            }
            case PRODUCT_NOT_FOUND -> throw new ProductNotFoundException(id);
            case UPDATED, CAPACITY_EXCEEDED -> throw new IllegalStateException(
                    "Unexpected media removal result: " + result);
        }
    }

    public UploadedMedia getMedia(ProductId id, UUID mediaId) {
        var media = getSnapshot(id).media();
        if (media == null || !media.id().equals(mediaId)) {
            throw new MediaNotFoundException();
        }
        return media;
    }

    @Override
    public Optional<CatalogProduct> findById(UUID id) {
        return productStore.findById(new ProductId(id))
                .map(snapshot -> new CatalogProduct(
                        snapshot.product().id().value(),
                        snapshot.product().name(),
                        snapshot.product().price()));
    }
}
