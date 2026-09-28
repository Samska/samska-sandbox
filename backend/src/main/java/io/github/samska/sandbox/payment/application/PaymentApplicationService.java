package io.github.samska.sandbox.payment.application;

import java.util.UUID;

import org.springframework.stereotype.Service;

import io.github.samska.sandbox.cart.application.CartApplicationService;
import io.github.samska.sandbox.payment.InvalidPaymentAttemptException;
import io.github.samska.sandbox.payment.PaymentAttempt;
import io.github.samska.sandbox.payment.PaymentScenario;

@Service
public class PaymentApplicationService {

    private final PaymentStore paymentStore;
    private final CartApplicationService cartApplicationService;

    public PaymentApplicationService(PaymentStore paymentStore, CartApplicationService cartApplicationService) {
        this.paymentStore = paymentStore;
        this.cartApplicationService = cartApplicationService;
    }

    public PaymentAttemptResult initiateAttempt(UUID attemptId, Long cartRevision, String scenario) {
        if (attemptId == null) {
            throw new InvalidPaymentAttemptException("Payment attempt ID must not be null");
        }
        if (cartRevision == null || cartRevision < 0) {
            throw new InvalidPaymentAttemptException("Cart revision must not be null or negative");
        }

        return paymentStore.createAttempt(
                attemptId,
                cartRevision,
                scenario(scenario),
                cartApplicationService::captureSnapshot);
    }

    public PaymentAttempt getAttempt(UUID attemptId) {
        return paymentStore.findAttempt(attemptId)
                .orElseThrow(() -> new PaymentAttemptNotFoundException(attemptId));
    }

    private static PaymentScenario scenario(String value) {
        if (value == null) {
            throw new InvalidPaymentAttemptException("Payment scenario must not be null");
        }

        return switch (value) {
            case "approve" -> PaymentScenario.APPROVE;
            case "decline" -> PaymentScenario.DECLINE;
            case "temporary-failure" -> PaymentScenario.TEMPORARY_FAILURE;
            default -> throw new InvalidPaymentAttemptException("Unsupported payment scenario: " + value);
        };
    }
}
