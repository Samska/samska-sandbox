package io.github.samska.sandbox.cart.api;

import java.util.UUID;

public record AddCartItemRequest(UUID productId, Integer quantity) {
}
