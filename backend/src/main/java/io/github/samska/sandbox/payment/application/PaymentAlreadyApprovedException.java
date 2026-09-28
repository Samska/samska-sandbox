package io.github.samska.sandbox.payment.application;

import java.util.UUID;

public final class PaymentAlreadyApprovedException extends RuntimeException {

    private final UUID existingAttemptId;

    public PaymentAlreadyApprovedException(UUID existingAttemptId) {
        super("Cart revision already has an approved payment attempt: " + existingAttemptId);
        this.existingAttemptId = existingAttemptId;
    }

    public UUID existingAttemptId() {
        return existingAttemptId;
    }
}
