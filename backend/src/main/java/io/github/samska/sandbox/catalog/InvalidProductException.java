package io.github.samska.sandbox.catalog;

public final class InvalidProductException extends IllegalArgumentException {

    public InvalidProductException(String message) {
        super(message);
    }
}
