package io.github.samska.sandbox.payment;

import java.math.BigDecimal;
import java.util.UUID;

import io.github.samska.sandbox.cart.ProductReference;
import io.github.samska.sandbox.cart.Quantity;

public record PaymentAttemptItem(
        ProductReference product,
        String name,
        BigDecimal unitPrice,
        Quantity quantity,
        BigDecimal lineSubtotal) {

    public PaymentAttemptItem {
        if (product == null) {
            throw new InvalidPaymentAttemptException("Payment attempt item Product must not be null");
        }
        if (name == null || name.isBlank()) {
            throw new InvalidPaymentAttemptException("Payment attempt item name must not be blank");
        }
        if (unitPrice == null || unitPrice.signum() < 0) {
            throw new InvalidPaymentAttemptException("Payment attempt item unit price must not be negative or null");
        }
        if (quantity == null) {
            throw new InvalidPaymentAttemptException("Payment attempt item quantity must not be null");
        }
        if (lineSubtotal == null || lineSubtotal.signum() < 0) {
            throw new InvalidPaymentAttemptException("Payment attempt item line subtotal must not be negative or null");
        }
    }

    public UUID productId() {
        return product.value();
    }
}
