package io.github.samska.sandbox.shipping;

import java.time.Instant;

/** One step of the timeline; {@code at} is when it happened, and null when the step has not happened yet. */
public record ShipmentStep(String code, Instant at, boolean done) {
}
