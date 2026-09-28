package io.github.samska.sandbox.payment.application;

import java.util.UUID;

public final class PaymentAttemptNotFoundException extends RuntimeException {

    public PaymentAttemptNotFoundException(UUID attemptId) {
        super("Payment attempt was not found: " + attemptId);
    }
}
