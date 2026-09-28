package io.github.samska.sandbox.payment.application;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.cart.ProductReference;
import io.github.samska.sandbox.cart.Quantity;
import io.github.samska.sandbox.cart.application.CartApplicationService;
import io.github.samska.sandbox.cart.storage.InMemoryCartStore;
import io.github.samska.sandbox.payment.InvalidPaymentAttemptException;
import io.github.samska.sandbox.payment.PaymentScenario;
import io.github.samska.sandbox.payment.PaymentStatus;
import io.github.samska.sandbox.payment.storage.InMemoryPaymentStore;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class PaymentApplicationServiceTest {

    private static final UUID PRODUCT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final InMemoryCartStore cartStore = new InMemoryCartStore();
    private final CartApplicationService cartApplicationService =
            new CartApplicationService(cartStore, productId -> Optional.empty());
    private final PaymentApplicationService paymentApplicationService =
            new PaymentApplicationService(new InMemoryPaymentStore(), cartApplicationService);

    @Test
    void initiatesAnAttemptForTheCapturedCartRevision() {
        cartStore.current().addItem(
                new ProductReference(PRODUCT_ID), "Canvas Tote", new BigDecimal("12.50"), new Quantity(2));
        var attemptId = UUID.randomUUID();

        var result = paymentApplicationService.initiateAttempt(attemptId, 1L, "temporary-failure");

        assertThat(result.created()).isTrue();
        assertThat(result.attempt().attemptId()).isEqualTo(attemptId);
        assertThat(result.attempt().status()).isEqualTo(PaymentStatus.FAILED);
        assertThat(result.attempt().total()).isEqualByComparingTo("25.00");
        assertThat(paymentApplicationService.getAttempt(attemptId)).isEqualTo(result.attempt());
    }

    @Test
    void rejectsInvalidInitiationInputs() {
        var attemptId = UUID.randomUUID();

        assertThatExceptionOfType(InvalidPaymentAttemptException.class)
                .isThrownBy(() -> paymentApplicationService.initiateAttempt(null, 0L, "approve"));
        assertThatExceptionOfType(InvalidPaymentAttemptException.class)
                .isThrownBy(() -> paymentApplicationService.initiateAttempt(attemptId, null, "approve"));
        assertThatExceptionOfType(InvalidPaymentAttemptException.class)
                .isThrownBy(() -> paymentApplicationService.initiateAttempt(attemptId, -1L, "approve"));
        assertThatExceptionOfType(InvalidPaymentAttemptException.class)
                .isThrownBy(() -> paymentApplicationService.initiateAttempt(attemptId, 0L, null));
        assertThatExceptionOfType(InvalidPaymentAttemptException.class)
                .isThrownBy(() -> paymentApplicationService.initiateAttempt(attemptId, 0L, "refund"));
    }

    @Test
    void reportsUnknownAttempts() {
        assertThatExceptionOfType(PaymentAttemptNotFoundException.class)
                .isThrownBy(() -> paymentApplicationService.getAttempt(UUID.randomUUID()));
    }

    @Test
    void exposesAllOutcomeWireValuesAndAllowsApprovalAfterADecline() {
        cartStore.current().addItem(
                new ProductReference(PRODUCT_ID), "Canvas Tote", new BigDecimal("12.50"), new Quantity(1));

        var declined = paymentApplicationService.initiateAttempt(UUID.randomUUID(), 1L, "decline");
        var approved = paymentApplicationService.initiateAttempt(UUID.randomUUID(), 1L, "approve");

        assertThat(declined.attempt().status().wireValue()).isEqualTo("declined");
        assertThat(approved.attempt().status().wireValue()).isEqualTo("approved");
        assertThat(PaymentScenario.APPROVE.status()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(PaymentScenario.TEMPORARY_FAILURE.status().wireValue()).isEqualTo("failed");
    }
}
