package io.github.samska.sandbox.payment.application;

public final class PaymentCapacityExceededException extends RuntimeException {

    public PaymentCapacityExceededException() {
        super("The payment simulator attempt capacity was reached");
    }
}
