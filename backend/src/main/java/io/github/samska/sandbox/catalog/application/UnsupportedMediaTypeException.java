package io.github.samska.sandbox.catalog.application;

public final class UnsupportedMediaTypeException extends RuntimeException {

    public UnsupportedMediaTypeException() {
        super("Product media must be a JPEG image");
    }
}
