package io.github.samska.sandbox.cart;

import java.math.BigDecimal;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class CartTest {

    private static final UUID PRODUCT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final ProductReference PRODUCT = new ProductReference(PRODUCT_ID);
    private static final UUID OTHER_PRODUCT_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Test
    void addsProductAndCalculatesExactTotal() {
        var cart = new Cart();

        cart.addItem(PRODUCT, "Canvas Tote", new BigDecimal("12.50"), new Quantity(2));

        assertThat(cart.items()).hasSize(1);
        assertThat(cart.items().getFirst().lineSubtotal()).isEqualByComparingTo("25.00");
        assertThat(cart.total()).isEqualByComparingTo("25.00");
    }

    @Test
    void repeatedAdditionIncrementsExistingQuantityAndRetainsSnapshot() {
        var cart = new Cart();

        cart.addItem(PRODUCT, "Original name", new BigDecimal("2.50"), new Quantity(2));
        cart.addItem(PRODUCT, "Changed name", new BigDecimal("9.00"), new Quantity(3));

        var item = cart.items().getFirst();
        assertThat(item.quantity().value()).isEqualTo(5);
        assertThat(item.name()).isEqualTo("Original name");
        assertThat(item.unitPrice()).isEqualByComparingTo("2.50");
    }

    @Test
    void updatesAndRemovesItem() {
        var cart = new Cart();
        cart.addItem(PRODUCT, "Canvas Tote", new BigDecimal("12.50"), new Quantity(1));

        cart.updateQuantity(PRODUCT, new Quantity(3));
        assertThat(cart.total()).isEqualByComparingTo("37.50");

        cart.removeItem(PRODUCT);
        assertThat(cart.items()).isEmpty();
        assertThat(cart.total()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void rejectsInvalidQuantity() {
        assertThatExceptionOfType(InvalidCartException.class)
                .isThrownBy(() -> new Quantity(0));
        assertThatExceptionOfType(InvalidCartException.class)
                .isThrownBy(() -> new Quantity(-1));
    }

    @Test
    void rejectsQuantityOverflowInsteadOfWrapping() {
        var quantity = new Quantity(Integer.MAX_VALUE);

        assertThatExceptionOfType(InvalidCartException.class)
                .isThrownBy(() -> quantity.add(new Quantity(1)));
    }

    @Test
    void rejectsMissingItemMutation() {
        var cart = new Cart();

        assertThatExceptionOfType(InvalidCartException.class)
                .isThrownBy(() -> cart.updateQuantity(PRODUCT, new Quantity(1)));
        assertThatExceptionOfType(InvalidCartException.class)
                .isThrownBy(() -> cart.removeItem(PRODUCT));
    }

    @Test
    void snapshotCapturesCartStateAndIsIndependentOfLaterMutation() {
        var cart = new Cart();
        cart.addItem(PRODUCT, "Canvas Tote", new BigDecimal("12.50"), new Quantity(2));

        var snapshot = cart.snapshot();

        assertThat(snapshot.items()).hasSize(1);
        assertThat(snapshot.items().getFirst().quantity().value()).isEqualTo(2);
        assertThat(snapshot.total()).isEqualByComparingTo("25.00");

        cart.updateQuantity(PRODUCT, new Quantity(4));
        cart.addItem(new ProductReference(OTHER_PRODUCT_ID), "Pour-Over Set", new BigDecimal("68.50"), new Quantity(1));

        assertThat(snapshot.items()).hasSize(1);
        assertThat(snapshot.items().getFirst().quantity().value()).isEqualTo(2);
        assertThat(snapshot.total()).isEqualByComparingTo("25.00");
        assertThatExceptionOfType(UnsupportedOperationException.class)
                .isThrownBy(() -> snapshot.items().clear());
    }

    @Test
    void snapshotOfEmptyCartIsEmptyWithZeroTotal() {
        var snapshot = new Cart().snapshot();

        assertThat(snapshot.items()).isEmpty();
        assertThat(snapshot.total()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
