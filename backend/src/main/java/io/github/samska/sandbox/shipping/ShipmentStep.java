package io.github.samska.sandbox.shipping;

import java.time.Instant;

/** One step of the timeline; {@code at} is when it happened, or the estimate when {@code done} is false. */
public record ShipmentStep(String code, Instant at, boolean done) {
}
