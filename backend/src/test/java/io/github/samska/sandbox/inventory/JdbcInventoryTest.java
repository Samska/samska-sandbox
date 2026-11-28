package io.github.samska.sandbox.inventory;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import io.github.samska.sandbox.inventory.application.InsufficientStockException;
import io.github.samska.sandbox.inventory.application.Inventory;
import io.github.samska.sandbox.inventory.storage.JdbcInventory;
import io.github.samska.sandbox.support.PostgresTestSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class JdbcInventoryTest extends PostgresTestSupport {

    @Autowired
    private Inventory inventory;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void reset() {
        jdbc.execute("TRUNCATE TABLE stock_levels");
    }

    private static List<StockLine> lines(UUID product, int quantity) {
        return List.of(new StockLine(product, quantity));
    }

    private UUID stocked(int onHand) {
        var id = UUID.randomUUID();
        inventory.setOnHand(id, onHand);
        return id;
    }

    @Test
    void usesTheProductionJdbcImplementation() {
        assertThat(inventory).isInstanceOf(JdbcInventory.class);
    }

    @Test
    void reportsUnitsOnHandAndNoneForAnUnknownProduct() {
        var id = stocked(7);

        assertThat(inventory.available(id)).isEqualTo(7);
        assertThat(inventory.available(UUID.randomUUID())).isZero();
        assertThat(inventory.available(List.of())).isEmpty();
    }

    @Test
    void validatesTheStockRange() {
        var id = UUID.randomUUID();
        assertThatThrownBy(() -> inventory.setOnHand(id, -1)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> inventory.setOnHand(id, Inventory.MAX_ON_HAND + 1))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void consumingTakesUnitsOutForGood() {
        var id = stocked(5);

        inventory.consume(lines(id, 2));

        assertThat(inventory.available(id)).isEqualTo(3);
        assertThat(jdbc.queryForObject("SELECT on_hand FROM stock_levels WHERE product_id = ?", Integer.class, id))
                .isEqualTo(3);
    }

    @Test
    void refusesToConsumeMoreThanIsOnHand() {
        var id = stocked(2);

        assertThatThrownBy(() -> inventory.consume(lines(id, 3)))
                .isInstanceOfSatisfying(InsufficientStockException.class, exception -> {
                    assertThat(exception.productId()).isEqualTo(id);
                    assertThat(exception.available()).isEqualTo(2);
                });
        assertThat(inventory.available(id)).isEqualTo(2);
    }

    @Test
    void aRefusedConsumptionTakesNothingFromTheOtherLinesOfTheTransaction() {
        var plenty = stocked(10);
        var scarce = stocked(1);

        assertThatThrownBy(() -> inventory.consume(List.of(new StockLine(plenty, 4), new StockLine(scarce, 2))))
                .isInstanceOf(InsufficientStockException.class);
        assertThat(inventory.available(plenty)).isEqualTo(10);
        assertThat(inventory.available(scarce)).isEqualTo(1);
    }

    @Test
    void removingAProductForgetsItsStock() {
        var id = stocked(3);

        inventory.remove(id);

        assertThat(inventory.available(id)).isZero();
    }

    @Test
    void concurrentConsumptionNeverDrivesStockBelowZero() throws Exception {
        var id = stocked(3);
        int buyers = 10;
        var barrier = new CyclicBarrier(buyers);
        var executor = Executors.newFixedThreadPool(buyers);
        try {
            List<Callable<Boolean>> tasks = new ArrayList<>();
            for (int index = 0; index < buyers; index++) {
                tasks.add(() -> {
                    barrier.await();
                    try {
                        inventory.consume(lines(id, 1));
                        return true;
                    } catch (InsufficientStockException exception) {
                        return false;
                    }
                });
            }
            var consumed = 0;
            for (var future : executor.invokeAll(tasks)) {
                if (future.get()) {
                    consumed++;
                }
            }
            assertThat(consumed).isEqualTo(3);
            assertThat(jdbc.queryForObject("SELECT on_hand FROM stock_levels WHERE product_id = ?", Integer.class, id))
                    .isZero();
        } finally {
            executor.shutdownNow();
            executor.awaitTermination(5, TimeUnit.SECONDS);
        }
    }
}
