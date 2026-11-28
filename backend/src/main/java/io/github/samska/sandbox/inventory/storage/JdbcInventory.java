package io.github.samska.sandbox.inventory.storage;

import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import io.github.samska.sandbox.inventory.StockLine;
import io.github.samska.sandbox.inventory.application.InsufficientStockException;
import io.github.samska.sandbox.inventory.application.Inventory;

public class JdbcInventory implements Inventory {

    private final JdbcClient jdbc;

    public JdbcInventory(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, Integer> available(Collection<UUID> productIds) {
        if (productIds.isEmpty()) {
            return Map.of();
        }

        var result = new HashMap<UUID, Integer>();
        jdbc.sql("""
                        SELECT product_id, on_hand AS available FROM stock_levels WHERE product_id IN (:ids)
                        """)
                .param("ids", productIds)
                .query((resultSet, rowNumber) -> {
                    result.put(resultSet.getObject("product_id", UUID.class), resultSet.getInt("available"));
                    return null;
                })
                .list();
        return result;
    }

    @Override
    @Transactional
    public void setOnHand(UUID productId, int onHand) {
        if (onHand < 0 || onHand > MAX_ON_HAND) {
            throw new IllegalArgumentException("Stock must be between 0 and " + MAX_ON_HAND);
        }

        jdbc.sql("""
                        INSERT INTO stock_levels (product_id, on_hand) VALUES (:id, :onHand)
                        ON CONFLICT (product_id) DO UPDATE SET on_hand = EXCLUDED.on_hand
                        """)
                .param("id", productId)
                .param("onHand", onHand)
                .update();
    }

    @Override
    @Transactional
    public void remove(UUID productId) {
        jdbc.sql("DELETE FROM stock_levels WHERE product_id = :id").param("id", productId).update();
    }

    @Override
    @Transactional
    public void consume(List<StockLine> lines) {
        for (var line : sorted(lines)) {
            // Locks the Product's stock row, so concurrent buyers of the same Product take turns. Lines are
            // visited in Product order to avoid deadlocks.
            var onHand = jdbc.sql("SELECT on_hand FROM stock_levels WHERE product_id = :id FOR UPDATE")
                    .param("id", line.productId())
                    .query(Integer.class)
                    .optional()
                    .orElse(0);
            if (onHand < line.quantity()) {
                throw new InsufficientStockException(line.productId(), onHand);
            }
            jdbc.sql("UPDATE stock_levels SET on_hand = on_hand - :quantity WHERE product_id = :id")
                    .param("quantity", line.quantity())
                    .param("id", line.productId())
                    .update();
        }
    }

    private static List<StockLine> sorted(List<StockLine> lines) {
        return lines.stream().sorted(Comparator.comparing(StockLine::productId)).toList();
    }
}
