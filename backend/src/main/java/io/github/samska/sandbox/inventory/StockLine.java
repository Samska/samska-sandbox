package io.github.samska.sandbox.inventory;

import java.util.UUID;

public record StockLine(UUID productId, int quantity) {

    public StockLine {
        if (productId == null || quantity < 1) {
            throw new IllegalArgumentException("A stock line needs a Product and a positive quantity");
        }
    }
}
