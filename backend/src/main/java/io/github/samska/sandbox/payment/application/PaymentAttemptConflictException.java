package io.github.samska.sandbox.payment.application;

import java.util.UUID;

public final class PaymentAttemptConflictException extends RuntimeException {

    public PaymentAttemptConflictException(UUID attemptId) {
        super("Payment attempt ID conflicts with a stored attempt: " + attemptId);
    }
}
