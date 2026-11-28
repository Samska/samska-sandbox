package io.github.samska.sandbox.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** One line of an account's Order history. */
public record OrderSummary(UUID orderId, long orderNumber, Instant createdAt, int itemCount, BigDecimal total) {
}
