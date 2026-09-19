package io.github.samska.sandbox.cart;

public final class InvalidCartException extends IllegalArgumentException {

    public InvalidCartException(String message) {
        super(message);
    }
}
