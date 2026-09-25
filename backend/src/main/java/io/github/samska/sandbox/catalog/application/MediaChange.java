package io.github.samska.sandbox.catalog.application;

public record MediaChange(MediaChangeResult result, ProductSnapshot snapshot) {

    public static MediaChange updated(ProductSnapshot snapshot) {
        return new MediaChange(MediaChangeResult.UPDATED, snapshot);
    }

    public static MediaChange productNotFound() {
        return new MediaChange(MediaChangeResult.PRODUCT_NOT_FOUND, null);
    }

    public static MediaChange capacityExceeded() {
        return new MediaChange(MediaChangeResult.CAPACITY_EXCEEDED, null);
    }
}
