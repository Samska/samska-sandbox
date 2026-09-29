package io.github.samska.sandbox.order.application;

import io.github.samska.sandbox.order.Order;

public record OrderResult(Order order, boolean created) {
}
