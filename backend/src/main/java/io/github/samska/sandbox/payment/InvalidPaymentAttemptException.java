package io.github.samska.sandbox.payment;

public final class InvalidPaymentAttemptException extends IllegalArgumentException {

    public InvalidPaymentAttemptException(String message) {
        super(message);
    }
}
