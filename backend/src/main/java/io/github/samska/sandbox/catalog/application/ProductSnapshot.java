package io.github.samska.sandbox.catalog.application;

import java.util.UUID;

import io.github.samska.sandbox.catalog.Product;

/**
 * A Product with its uploaded media. {@code media} carries the bytes; a listing may carry only the
 * media ID ({@code media} is then null) so that images are not loaded for every Product.
 */
public record ProductSnapshot(Product product, UUID uploadedMediaId, UploadedMedia media) {

    public ProductSnapshot {
        if (media != null && !media.id().equals(uploadedMediaId)) {
            throw new IllegalArgumentException("Media ID must match the media content");
        }
    }

    public ProductSnapshot(Product product, UploadedMedia media) {
        this(product, media == null ? null : media.id(), media);
    }
}
