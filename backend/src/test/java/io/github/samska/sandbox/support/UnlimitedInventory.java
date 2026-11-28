package io.github.samska.sandbox.support;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import io.github.samska.sandbox.inventory.StockLine;
import io.github.samska.sandbox.inventory.application.Inventory;

/** For unit tests that are not about stock: every Product has plenty. */
public final class UnlimitedInventory implements Inventory {

    @Override
    public Map<UUID, Integer> available(Collection<UUID> productIds) {
        var result = new HashMap<UUID, Integer>();
        productIds.forEach(id -> result.put(id, Integer.MAX_VALUE));
        return result;
    }

    @Override
    public void setOnHand(UUID productId, int onHand) {
    }

    @Override
    public void remove(UUID productId) {
    }

    @Override
    public void consume(List<StockLine> lines) {
    }

    @Override
    public void restock(List<StockLine> lines) {
    }
}
