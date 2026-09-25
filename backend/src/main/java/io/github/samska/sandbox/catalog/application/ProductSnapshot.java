package io.github.samska.sandbox.catalog.application;

import java.util.UUID;

import io.github.samska.sandbox.catalog.Product;

public record ProductSnapshot(Product product, UploadedMedia media) {

    public UUID uploadedMediaId() {
        return media == null ? null : media.id();
    }
}
