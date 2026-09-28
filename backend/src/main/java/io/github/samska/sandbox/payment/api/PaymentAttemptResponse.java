package io.github.samska.sandbox.payment.api;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import io.github.samska.sandbox.payment.PaymentAttempt;

public record PaymentAttemptResponse(
        UUID attemptId,
        String status,
        long cartRevision,
        List<PaymentAttemptItemResponse> items,
        BigDecimal total) {

    public static PaymentAttemptResponse from(PaymentAttempt attempt) {
        return new PaymentAttemptResponse(
                attempt.attemptId(),
                attempt.status().wireValue(),
                attempt.cartRevision(),
                attempt.items().stream().map(PaymentAttemptItemResponse::from).toList(),
                attempt.total());
    }
}
