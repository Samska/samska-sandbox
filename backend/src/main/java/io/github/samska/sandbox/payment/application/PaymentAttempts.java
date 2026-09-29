package io.github.samska.sandbox.payment.application;

import java.util.UUID;

import io.github.samska.sandbox.payment.PaymentAttempt;

/** Read-only Payment-owned contract for consumers of captured attempts. */
public interface PaymentAttempts {

    PaymentAttempt getAttempt(UUID attemptId);
}
