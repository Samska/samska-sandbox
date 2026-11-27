package io.github.samska.sandbox.shipping.api;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import io.github.samska.sandbox.shipping.Shipment;

public record ShipmentResponse(
        UUID orderId,
        String reference,
        String trackingCode,
        String courier,
        String status,
        boolean delayed,
        Instant estimatedDelivery,
        List<Step> steps) {

    public record Step(String code, Instant at, boolean done) {
    }

    public static ShipmentResponse from(Shipment shipment) {
        return new ShipmentResponse(
                shipment.orderId(), shipment.reference(), shipment.trackingCode(), shipment.courier(),
                shipment.status().name(), shipment.delayed(), shipment.estimatedDelivery(),
                shipment.steps().stream().map(step -> new Step(step.code(), step.at(), step.done())).toList());
    }
}
