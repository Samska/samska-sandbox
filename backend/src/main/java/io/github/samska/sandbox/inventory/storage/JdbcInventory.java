package io.github.samska.sandbox.inventory.storage;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
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
    private final Clock clock;
    private final Duration reservationTtl;

    public JdbcInventory(JdbcClient jdbc, Clock clock, Duration reservationTtl) {
        this.jdbc = jdbc;
        this.clock = clock;
        this.reservationTtl = reservationTtl;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, Integer> available(Collection<UUID> productIds) {
        if (productIds.isEmpty()) {
            return Map.of();
        }

        var result = new HashMap<UUID, Integer>();
        jdbc.sql("""
                        SELECT s.product_id,
                               s.on_hand - COALESCE((SELECT SUM(r.quantity) FROM stock_reservations r
                                                     WHERE r.product_id = s.product_id AND r.expires_at > :now), 0)
                                   AS available
                        FROM stock_levels s
                        WHERE s.product_id IN (:ids)
                        """)
                .param("now", now())
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
        jdbc.sql("DELETE FROM stock_reservations WHERE product_id = :id").param("id", productId).update();
        jdbc.sql("DELETE FROM stock_levels WHERE product_id = :id").param("id", productId).update();
    }

    @Override
    @Transactional
    public void reserve(UUID attemptId, List<StockLine> lines) {
        var now = now();
        jdbc.sql("DELETE FROM stock_reservations WHERE expires_at <= :now").param("now", now).update();

        for (var line : sorted(lines)) {
            var free = lockedFree(line.productId(), attemptId, now);
            if (free < line.quantity()) {
                throw new InsufficientStockException(line.productId(), Math.max(free, 0));
            }
        }

        jdbc.sql("DELETE FROM stock_reservations WHERE attempt_id = :attempt").param("attempt", attemptId).update();
        var expiresAt = Timestamp.from(clock.instant().plus(reservationTtl));
        for (var line : lines) {
            jdbc.sql("""
                            INSERT INTO stock_reservations (attempt_id, product_id, quantity, expires_at)
                            VALUES (:attempt, :product, :quantity, :expiresAt)
                            """)
                    .param("attempt", attemptId)
                    .param("product", line.productId())
                    .param("quantity", line.quantity())
                    .param("expiresAt", expiresAt)
                    .update();
        }
    }

    @Override
    @Transactional
    public void consume(UUID attemptId, List<StockLine> lines) {
        var now = now();

        for (var line : sorted(lines)) {
            var free = lockedFree(line.productId(), attemptId, now);
            if (free < line.quantity()) {
                throw new InsufficientStockException(line.productId(), Math.max(free, 0));
            }
            jdbc.sql("UPDATE stock_levels SET on_hand = on_hand - :quantity WHERE product_id = :id")
                    .param("quantity", line.quantity())
                    .param("id", line.productId())
                    .update();
        }

        jdbc.sql("DELETE FROM stock_reservations WHERE attempt_id = :attempt").param("attempt", attemptId).update();
    }

    @Override
    @Transactional
    public void restock(List<StockLine> lines) {
        for (var line : sorted(lines)) {
            jdbc.sql("UPDATE stock_levels SET on_hand = LEAST(on_hand + :quantity, :max) WHERE product_id = :id")
                    .param("quantity", line.quantity())
                    .param("max", MAX_ON_HAND)
                    .param("id", line.productId())
                    .update();
        }
    }

    /**
     * Locks the Product's stock row, so concurrent buyers of the same Product take turns, and returns
     * the units not held by anyone else. Lines are visited in Product order to avoid deadlocks.
     */
    private int lockedFree(UUID productId, UUID attemptId, Timestamp now) {
        var onHand = jdbc.sql("SELECT on_hand FROM stock_levels WHERE product_id = :id FOR UPDATE")
                .param("id", productId)
                .query(Integer.class)
                .optional()
                .orElse(0);
        var heldByOthers = jdbc.sql("""
                        SELECT COALESCE(SUM(quantity), 0) FROM stock_reservations
                        WHERE product_id = :id AND attempt_id <> :attempt AND expires_at > :now
                        """)
                .param("id", productId)
                .param("attempt", attemptId)
                .param("now", now)
                .query(Long.class)
                .single();
        return (int) (onHand - heldByOthers);
    }

    private static List<StockLine> sorted(List<StockLine> lines) {
        return lines.stream().sorted(Comparator.comparing(StockLine::productId)).toList();
    }

    private Timestamp now() {
        return Timestamp.from(clock.instant());
    }
}
