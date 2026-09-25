package io.github.samska.sandbox.catalog.application;

import java.util.Optional;
import java.util.Collection;

import io.github.samska.sandbox.catalog.Product;
import io.github.samska.sandbox.catalog.ProductId;

public interface ProductStore {

    void save(Product product);

    Optional<ProductSnapshot> replaceProduct(Product product);

    boolean deleteById(ProductId id);

    Optional<ProductSnapshot> findById(ProductId id);

    Collection<ProductSnapshot> findAll();

    MediaChange replaceMedia(ProductId id, UploadedMedia media);

    MediaChangeResult removeMedia(ProductId id);
}
