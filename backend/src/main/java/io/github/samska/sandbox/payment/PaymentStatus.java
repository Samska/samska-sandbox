package io.github.samska.sandbox.payment;

public enum PaymentStatus {

    APPROVED("approved"),
    DECLINED("declined"),
    FAILED("failed");

    private final String wireValue;

    PaymentStatus(String wireValue) {
        this.wireValue = wireValue;
    }

    public String wireValue() {
        return wireValue;
    }
}
