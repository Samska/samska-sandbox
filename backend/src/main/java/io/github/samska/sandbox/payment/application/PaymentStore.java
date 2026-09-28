package io.github.samska.sandbox.payment.application;

import java.util.Optional;
import java.util.UUID;

import io.github.samska.sandbox.payment.PaymentAttempt;
import io.github.samska.sandbox.payment.PaymentScenario;

public interface PaymentStore {

    PaymentAttemptResult createAttempt(
            UUID attemptId,
            long cartRevision,
            PaymentScenario scenario,
            CartSnapshotProvider cartSnapshotProvider);

    Optional<PaymentAttempt> findAttempt(UUID attemptId);
}
