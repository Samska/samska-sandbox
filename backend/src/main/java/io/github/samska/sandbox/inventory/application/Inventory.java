package io.github.samska.sandbox.inventory.application;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import io.github.samska.sandbox.inventory.StockLine;

/**
 * Stock on hand. "Available" is what a customer can still put in a Cart; an Order takes its units out
 * of stock in the same transaction that stores it.
 */
public interface Inventory {

    int MAX_ON_HAND = 100_000;

    /** Available units per Product; a Product with no stock record has none. */
    Map<UUID, Integer> available(Collection<UUID> productIds);

    default int available(UUID productId) {
        return available(List.of(productId)).getOrDefault(productId, 0);
    }

    /** Sets the units on hand, creating the record when needed. */
    void setOnHand(UUID productId, int onHand);

    /** Forgets a Product's stock. */
    void remove(UUID productId);

    /**
     * Takes the lines out of stock for good. Must run in the caller's transaction so that a failure
     * rolls back the Order as well.
     *
     * @throws InsufficientStockException when the units are gone
     */
    void consume(List<StockLine> lines);

    /**
     * Puts units back on hand, for a cancelled Order. A Product that no longer has a stock record stays
     * without one.
     */
    void restock(List<StockLine> lines);
}
