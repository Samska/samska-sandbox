package io.github.samska.sandbox.payment.api;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PaymentErrorResponse(String code, UUID attemptId) {

    public static final String CART_CHANGED = "cart-changed";
    public static final String ALREADY_APPROVED = "already-approved";
    public static final String ATTEMPT_ID_CONFLICT = "attempt-id-conflict";
    public static final String CAPACITY_EXCEEDED = "attempt-capacity-exceeded";

    public static PaymentErrorResponse cartChanged() {
        return new PaymentErrorResponse(CART_CHANGED, null);
    }

    public static PaymentErrorResponse alreadyApproved(UUID existingAttemptId) {
        return new PaymentErrorResponse(ALREADY_APPROVED, existingAttemptId);
    }

    public static PaymentErrorResponse attemptIdConflict() {
        return new PaymentErrorResponse(ATTEMPT_ID_CONFLICT, null);
    }

    public static PaymentErrorResponse capacityExceeded() {
        return new PaymentErrorResponse(CAPACITY_EXCEEDED, null);
    }
}
