package io.github.samska.sandbox.catalog.application;

public final class MediaNotFoundException extends RuntimeException {

    public MediaNotFoundException() {
        super("Product media was not found");
    }
}
