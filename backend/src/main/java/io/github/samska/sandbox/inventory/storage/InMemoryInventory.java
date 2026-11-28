package io.github.samska.sandbox.inventory.storage;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import io.github.samska.sandbox.inventory.StockLine;
import io.github.samska.sandbox.inventory.application.InsufficientStockException;
import io.github.samska.sandbox.inventory.application.Inventory;

/**
 * Test double for the {@code no-database} profile. It checks and decrements stock directly,
 * which is enough for the Catalog and Cart API suites.
 */
public class InMemoryInventory implements Inventory {

    private final Map<UUID, Integer> onHand = new ConcurrentHashMap<>();

    @Override
    public Map<UUID, Integer> available(Collection<UUID> productIds) {
        var result = new HashMap<UUID, Integer>();
        for (var id : productIds) {
            var units = onHand.get(id);
            if (units != null) {
                result.put(id, units);
            }
        }
        return result;
    }

    @Override
    public void setOnHand(UUID productId, int units) {
        if (units < 0 || units > MAX_ON_HAND) {
            throw new IllegalArgumentException("Stock must be between 0 and " + MAX_ON_HAND);
        }
        onHand.put(productId, units);
    }

    @Override
    public void remove(UUID productId) {
        onHand.remove(productId);
    }

    @Override
    public synchronized void consume(List<StockLine> lines) {
        for (var line : lines) {
            var units = onHand.getOrDefault(line.productId(), 0);
            if (units < line.quantity()) {
                throw new InsufficientStockException(line.productId(), units);
            }
        }
        for (var line : lines) {
            onHand.merge(line.productId(), -line.quantity(), Integer::sum);
        }
    }
}
