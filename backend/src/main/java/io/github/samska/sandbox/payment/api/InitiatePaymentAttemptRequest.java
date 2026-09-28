package io.github.samska.sandbox.payment.api;

import java.util.UUID;

public record InitiatePaymentAttemptRequest(UUID attemptId, Long cartRevision, String scenario) {
}
