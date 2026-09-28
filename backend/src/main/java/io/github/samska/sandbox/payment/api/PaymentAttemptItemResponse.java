package io.github.samska.sandbox.payment.api;

import java.math.BigDecimal;
import java.util.UUID;

import io.github.samska.sandbox.payment.PaymentAttemptItem;

public record PaymentAttemptItemResponse(
        UUID productId,
        String name,
        BigDecimal unitPrice,
        int quantity,
        BigDecimal lineSubtotal) {

    public static PaymentAttemptItemResponse from(PaymentAttemptItem item) {
        return new PaymentAttemptItemResponse(
                item.productId(),
                item.name(),
                item.unitPrice(),
                item.quantity().value(),
                item.lineSubtotal());
    }
}
