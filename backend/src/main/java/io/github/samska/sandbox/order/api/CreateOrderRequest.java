package io.github.samska.sandbox.order.api;

import java.util.UUID;

public record CreateOrderRequest(UUID paymentAttemptId) {
}
