package io.github.samska.sandbox.shipping.application;

public class InvalidStatusChangeException extends RuntimeException {

    public InvalidStatusChangeException(String message) {
        super(message);
    }
}
