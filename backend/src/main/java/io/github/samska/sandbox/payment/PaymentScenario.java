package io.github.samska.sandbox.payment;

public enum PaymentScenario {

    APPROVE(PaymentStatus.APPROVED),
    DECLINE(PaymentStatus.DECLINED),
    TEMPORARY_FAILURE(PaymentStatus.FAILED);

    private final PaymentStatus status;

    PaymentScenario(PaymentStatus status) {
        this.status = status;
    }

    public PaymentStatus status() {
        return status;
    }
}
