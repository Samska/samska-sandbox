package io.github.samska.sandbox.catalog.application;

public final class InvalidMediaException extends IllegalArgumentException {

    public InvalidMediaException() {
        super("Product media could not be decoded as a JPEG image");
    }
}
