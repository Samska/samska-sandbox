package io.github.samska.sandbox.catalog.application;

public final class MediaTooLargeException extends RuntimeException {

    public MediaTooLargeException() {
        super("Product media exceeds an allowed limit");
    }
}
