package io.github.samska.sandbox.cart;

public final class CartRevisionMismatchException extends RuntimeException {

    public CartRevisionMismatchException(long expectedRevision, long actualRevision) {
        super("Cart revision " + actualRevision + " does not match expected revision " + expectedRevision);
    }
}
