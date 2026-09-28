package io.github.samska.sandbox.payment;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PaymentAttempt(
        UUID attemptId,
        long cartRevision,
        PaymentScenario scenario,
        List<PaymentAttemptItem> items,
        BigDecimal total) {

    public PaymentAttempt {
        if (attemptId == null) {
            throw new InvalidPaymentAttemptException("Payment attempt ID must not be null");
        }
        if (cartRevision < 0) {
            throw new InvalidPaymentAttemptException("Payment attempt Cart revision must not be negative");
        }
        if (scenario == null) {
            throw new InvalidPaymentAttemptException("Payment attempt scenario must not be null");
        }
        if (items == null || items.isEmpty()) {
            throw new InvalidPaymentAttemptException("Payment attempt items must not be null or empty");
        }
        if (total == null || total.signum() < 0) {
            throw new InvalidPaymentAttemptException("Payment attempt total must not be negative or null");
        }
        items = List.copyOf(items);
    }

    public PaymentStatus status() {
        return scenario.status();
    }
}
