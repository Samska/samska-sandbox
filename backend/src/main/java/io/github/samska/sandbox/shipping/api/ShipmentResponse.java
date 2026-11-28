package io.github.samska.sandbox.shipping.api;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import io.github.samska.sandbox.shipping.Shipment;

public record ShipmentResponse(UUID orderId, String orderNumber, String status, List<Step> steps) {

    public record Step(String code, Instant at, boolean done) {
    }

    public static ShipmentResponse from(Shipment shipment) {
        return new ShipmentResponse(
                shipment.orderId(), shipment.orderNumber(), shipment.status().name(),
                shipment.steps().stream().map(step -> new Step(step.code(), step.at(), step.done())).toList());
    }
}
