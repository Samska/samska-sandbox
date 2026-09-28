package io.github.samska.sandbox.payment;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.cart.ProductReference;
import io.github.samska.sandbox.cart.Quantity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class PaymentAttemptTest {

    private static final UUID ATTEMPT_ID = UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111");
    private static final UUID PRODUCT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Test
    void mapsScenariosToTheirDeclaredStatus() {
        assertThat(PaymentScenario.APPROVE.status()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(PaymentScenario.DECLINE.status()).isEqualTo(PaymentStatus.DECLINED);
        assertThat(PaymentScenario.TEMPORARY_FAILURE.status()).isEqualTo(PaymentStatus.FAILED);
        assertThat(PaymentStatus.APPROVED.wireValue()).isEqualTo("approved");
        assertThat(PaymentStatus.DECLINED.wireValue()).isEqualTo("declined");
        assertThat(PaymentStatus.FAILED.wireValue()).isEqualTo("failed");
    }

    @Test
    void carriesAnImmutableSnapshotOfItsItems() {
        var item = item(2);
        var items = new ArrayList<>(List.of(item));
        var attempt = new PaymentAttempt(
                ATTEMPT_ID, 4, PaymentScenario.APPROVE, items, new BigDecimal("25.00"));

        items.clear();

        assertThat(attempt.items()).containsExactly(item);
        assertThat(attempt.status()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(attempt.cartRevision()).isEqualTo(4);
        assertThatExceptionOfType(UnsupportedOperationException.class)
                .isThrownBy(() -> attempt.items().clear());
    }

    @Test
    void rejectsInvalidAttemptValues() {
        var item = item(1);

        assertThatExceptionOfType(InvalidPaymentAttemptException.class)
                .isThrownBy(() -> new PaymentAttempt(null, 1, PaymentScenario.APPROVE, List.of(item), BigDecimal.ONE));
        assertThatExceptionOfType(InvalidPaymentAttemptException.class)
                .isThrownBy(() -> new PaymentAttempt(ATTEMPT_ID, -1, PaymentScenario.APPROVE, List.of(item), BigDecimal.ONE));
        assertThatExceptionOfType(InvalidPaymentAttemptException.class)
                .isThrownBy(() -> new PaymentAttempt(ATTEMPT_ID, 1, null, List.of(item), BigDecimal.ONE));
        assertThatExceptionOfType(InvalidPaymentAttemptException.class)
                .isThrownBy(() -> new PaymentAttempt(ATTEMPT_ID, 1, PaymentScenario.APPROVE, List.of(), BigDecimal.ONE));
        assertThatExceptionOfType(InvalidPaymentAttemptException.class)
                .isThrownBy(() -> new PaymentAttempt(ATTEMPT_ID, 1, PaymentScenario.APPROVE, List.of(item), null));
    }

    @Test
    void rejectsInvalidAttemptItemValues() {
        var product = new ProductReference(PRODUCT_ID);
        var quantity = new Quantity(1);
        var price = new BigDecimal("12.50");

        assertThatExceptionOfType(InvalidPaymentAttemptException.class)
                .isThrownBy(() -> new PaymentAttemptItem(null, "Canvas Tote", price, quantity, price));
        assertThatExceptionOfType(InvalidPaymentAttemptException.class)
                .isThrownBy(() -> new PaymentAttemptItem(product, " ", price, quantity, price));
        assertThatExceptionOfType(InvalidPaymentAttemptException.class)
                .isThrownBy(() -> new PaymentAttemptItem(product, "Canvas Tote", new BigDecimal("-1"), quantity, price));
        assertThatExceptionOfType(InvalidPaymentAttemptException.class)
                .isThrownBy(() -> new PaymentAttemptItem(product, "Canvas Tote", price, null, price));
        assertThatExceptionOfType(InvalidPaymentAttemptException.class)
                .isThrownBy(() -> new PaymentAttemptItem(product, "Canvas Tote", price, quantity, null));
    }

    private static PaymentAttemptItem item(int quantity) {
        return new PaymentAttemptItem(
                new ProductReference(PRODUCT_ID),
                "Canvas Tote",
                new BigDecimal("12.50"),
                new Quantity(quantity),
                new BigDecimal("12.50").multiply(BigDecimal.valueOf(quantity)));
    }
}
