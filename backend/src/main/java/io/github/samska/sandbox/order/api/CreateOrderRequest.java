package io.github.samska.sandbox.order.api;

import java.util.UUID;

/** {@code requestId} makes a retry safe: the same id always returns the same Order. */
public record CreateOrderRequest(UUID requestId, Long cartRevision) {
}
