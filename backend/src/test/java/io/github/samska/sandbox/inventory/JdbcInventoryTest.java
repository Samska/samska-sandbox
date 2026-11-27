package io.github.samska.sandbox.inventory;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
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
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import io.github.samska.sandbox.inventory.application.InsufficientStockException;
import io.github.samska.sandbox.inventory.application.Inventory;
import io.github.samska.sandbox.inventory.storage.JdbcInventory;
import io.github.samska.sandbox.support.MutableClock;
import io.github.samska.sandbox.support.PostgresTestSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Import(JdbcInventoryTest.ClockConfiguration.class)
@TestPropertySource(properties = "samska.inventory.reservation-ttl=PT10M")
class JdbcInventoryTest extends PostgresTestSupport {

    static final MutableClock CLOCK = new MutableClock(Instant.parse("2026-11-27T12:00:00Z"));

    @TestConfiguration(proxyBeanMethods = false)
    static class ClockConfiguration {

        @Bean
        @Primary
        Clock testClock() {
            return CLOCK;
        }
    }

    @Autowired
    private Inventory inventory;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void reset() {
        jdbc.execute("TRUNCATE TABLE stock_reservations, stock_levels");
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
    void holdsUnitsForAnApprovedAttemptUntilItExpires() {
        var id = stocked(5);

        inventory.reserve(UUID.randomUUID(), lines(id, 3));
        assertThat(inventory.available(id)).isEqualTo(2);

        CLOCK.advance(Duration.ofMinutes(11));
        assertThat(inventory.available(id)).isEqualTo(5);
    }

    @Test
    void refusesToHoldMoreThanOthersHaveNotHeld() {
        var id = stocked(5);
        inventory.reserve(UUID.randomUUID(), lines(id, 4));

        assertThatThrownBy(() -> inventory.reserve(UUID.randomUUID(), lines(id, 2)))
                .isInstanceOfSatisfying(InsufficientStockException.class, exception -> {
                    assertThat(exception.productId()).isEqualTo(id);
                    assertThat(exception.available()).isEqualTo(1);
                });
        inventory.reserve(UUID.randomUUID(), lines(id, 1));
        assertThat(inventory.available(id)).isZero();
    }

    @Test
    void replacingAnAttemptsHoldDoesNotCountItAgainstItself() {
        var id = stocked(5);
        var attempt = UUID.randomUUID();
        inventory.reserve(attempt, lines(id, 5));

        inventory.reserve(attempt, lines(id, 5));

        assertThat(inventory.available(id)).isZero();
    }

    @Test
    void aRefusedReservationHoldsNothing() {
        var plenty = stocked(10);
        var scarce = stocked(1);

        assertThatThrownBy(() -> inventory.reserve(UUID.randomUUID(),
                List.of(new StockLine(plenty, 4), new StockLine(scarce, 2))))
                .isInstanceOf(InsufficientStockException.class);

        assertThat(inventory.available(plenty)).isEqualTo(10);
    }

    @Test
    void consumingTakesUnitsOutForGoodAndReleasesTheHold() {
        var id = stocked(5);
        var attempt = UUID.randomUUID();
        inventory.reserve(attempt, lines(id, 2));

        inventory.consume(attempt, lines(id, 2));

        assertThat(inventory.available(id)).isEqualTo(3);
        assertThat(jdbc.queryForObject("SELECT on_hand FROM stock_levels WHERE product_id = ?", Integer.class, id))
                .isEqualTo(3);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM stock_reservations", Integer.class)).isZero();
    }

    @Test
    void anExpiredHoldCanStillBeConsumedWhileTheUnitsAreFree() {
        var id = stocked(2);
        var attempt = UUID.randomUUID();
        inventory.reserve(attempt, lines(id, 2));
        CLOCK.advance(Duration.ofMinutes(11));

        inventory.consume(attempt, lines(id, 2));

        assertThat(inventory.available(id)).isZero();
    }

    @Test
    void anExpiredHoldCannotBeConsumedOnceSomeoneElseHoldsTheUnits() {
        var id = stocked(1);
        var late = UUID.randomUUID();
        inventory.reserve(late, lines(id, 1));
        CLOCK.advance(Duration.ofMinutes(11));
        inventory.reserve(UUID.randomUUID(), lines(id, 1));

        assertThatThrownBy(() -> inventory.consume(late, lines(id, 1)))
                .isInstanceOf(InsufficientStockException.class);
        assertThat(jdbc.queryForObject("SELECT on_hand FROM stock_levels WHERE product_id = ?", Integer.class, id))
                .isEqualTo(1);
    }

    @Test
    void removingAProductForgetsItsStockAndHolds() {
        var id = stocked(3);
        inventory.reserve(UUID.randomUUID(), lines(id, 1));

        inventory.remove(id);

        assertThat(inventory.available(id)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM stock_reservations", Integer.class)).isZero();
    }

    @Test
    void concurrentBuyersOfTheLastUnitProduceExactlyOneHold() throws Exception {
        var id = stocked(1);
        int buyers = 8;
        var barrier = new CyclicBarrier(buyers);
        var executor = Executors.newFixedThreadPool(buyers);
        try {
            List<Callable<Boolean>> tasks = new ArrayList<>();
            for (int index = 0; index < buyers; index++) {
                tasks.add(() -> {
                    barrier.await();
                    try {
                        inventory.reserve(UUID.randomUUID(), lines(id, 1));
                        return true;
                    } catch (InsufficientStockException exception) {
                        return false;
                    }
                });
            }
            var won = 0;
            for (var future : executor.invokeAll(tasks)) {
                if (future.get()) {
                    won++;
                }
            }
            assertThat(won).isEqualTo(1);
            assertThat(inventory.available(id)).isZero();
        } finally {
            executor.shutdownNow();
            executor.awaitTermination(5, TimeUnit.SECONDS);
        }
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
                        inventory.consume(UUID.randomUUID(), lines(id, 1));
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
