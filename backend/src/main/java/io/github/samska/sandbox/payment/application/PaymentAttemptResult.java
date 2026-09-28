package io.github.samska.sandbox.payment.application;

import io.github.samska.sandbox.payment.PaymentAttempt;

public record PaymentAttemptResult(PaymentAttempt attempt, boolean created) {

    public PaymentAttemptResult {
        if (attempt == null) {
            throw new IllegalArgumentException("Payment attempt result must carry an attempt");
        }
    }
}
