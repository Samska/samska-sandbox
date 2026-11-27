package io.github.samska.sandbox.inventory.application;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import io.github.samska.sandbox.inventory.StockLine;

/**
 * Stock on hand and the units held for approved Payment attempts. "Available" is on hand minus the
 * unexpired reservations; it is what a customer can still put in a Cart.
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

    /** Forgets a Product's stock and reservations. */
    void remove(UUID productId);

    /**
     * Holds the lines for the attempt until it expires, replacing an earlier hold of the same attempt.
     * Must run in the caller's transaction so that a failure rolls back the attempt as well.
     *
     * @throws InsufficientStockException when any line exceeds what other customers have not held
     */
    void reserve(UUID attemptId, List<StockLine> lines);

    /**
     * Takes the lines out of stock for good and releases the attempt's hold. A hold that has expired is
     * not required, as long as the units are still free.
     *
     * @throws InsufficientStockException when the units are gone
     */
    void consume(UUID attemptId, List<StockLine> lines);
}
