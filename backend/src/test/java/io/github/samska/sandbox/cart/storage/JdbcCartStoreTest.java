package io.github.samska.sandbox.cart.storage;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.LongStream;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import io.github.samska.sandbox.cart.CartItem;
import io.github.samska.sandbox.cart.InvalidCartException;
import io.github.samska.sandbox.cart.ProductReference;
import io.github.samska.sandbox.cart.Quantity;
import io.github.samska.sandbox.cart.application.CartStore;
import io.github.samska.sandbox.support.OrderDatabaseTestSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class JdbcCartStoreTest extends OrderDatabaseTestSupport {

    private static final ProductReference TOTE = new ProductReference(
            UUID.fromString("11111111-1111-1111-1111-111111111111"));
    private static final ProductReference MUG = new ProductReference(
            UUID.fromString("22222222-2222-2222-2222-222222222222"));

    @Autowired
    private CartStore store;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void usesTheProductionJdbcStore() {
        assertThat(store).isInstanceOf(JdbcCartStore.class);
    }

    @Test
    void anAbsentCartRowReadsAsAnEmptyCartAtRevisionZero() {
        var cart = store.current();

        assertThat(cart.items()).isEmpty();
        assertThat(cart.snapshot().revision()).isZero();
        assertThat(cart.total()).isEqualByComparingTo("0");
    }

    @Test
    void roundTripsItemsSnapshotsExactAmountsAndOrder() {
        store.update(cart -> cart.addItem(TOTE, "Canvas Tote", new BigDecimal("12.50"), new Quantity(2)));
        store.update(cart -> cart.addItem(MUG, "Enamel Mug", new BigDecimal("8.25"), new Quantity(3)));

        var loaded = store.current();

        assertThat(loaded.snapshot().revision()).isEqualTo(2);
        assertThat(loaded.items()).extracting(CartItem::product).containsExactly(TOTE, MUG);
        assertThat(loaded.items()).extracting(CartItem::name).containsExactly("Canvas Tote", "Enamel Mug");
        assertThat(loaded.items().get(0).unitPrice()).isEqualByComparingTo("12.50");
        assertThat(loaded.items()).extracting(item -> item.quantity().value()).containsExactly(2, 3);
        assertThat(loaded.total()).isEqualByComparingTo("49.75");
    }

    @Test
    void repeatedAdditionKeepsTheOriginalSnapshotAndPosition() {
        store.update(cart -> cart.addItem(TOTE, "Canvas Tote", new BigDecimal("12.50"), new Quantity(1)));
        store.update(cart -> cart.addItem(MUG, "Enamel Mug", new BigDecimal("8.25"), new Quantity(1)));
        store.update(cart -> cart.addItem(TOTE, "Renamed", new BigDecimal("99.00"), new Quantity(4)));

        var loaded = store.current();

        assertThat(loaded.items()).extracting(CartItem::product).containsExactly(TOTE, MUG);
        assertThat(loaded.items().getFirst().name()).isEqualTo("Canvas Tote");
        assertThat(loaded.items().getFirst().unitPrice()).isEqualByComparingTo("12.50");
        assertThat(loaded.items().getFirst().quantity().value()).isEqualTo(5);
        assertThat(loaded.snapshot().revision()).isEqualTo(3);
    }

    @Test
    void updatesQuantityAndRemovesAnItemWithOneRevisionEach() {
        store.update(cart -> cart.addItem(TOTE, "Canvas Tote", new BigDecimal("12.50"), new Quantity(1)));
        store.update(cart -> cart.addItem(MUG, "Enamel Mug", new BigDecimal("8.25"), new Quantity(1)));

        store.update(cart -> cart.updateQuantity(MUG, new Quantity(6)));
        var afterRemoval = store.update(cart -> cart.removeItem(TOTE));

        assertThat(afterRemoval.snapshot().revision()).isEqualTo(4);
        var loaded = store.current();
        assertThat(loaded.items()).extracting(CartItem::product).containsExactly(MUG);
        assertThat(loaded.items().getFirst().quantity().value()).isEqualTo(6);
        assertThat(count("cart_items")).isEqualTo(1);
    }

    @Test
    void aRejectedChangeLeavesStoredItemsAndRevisionUntouched() {
        store.update(cart -> cart.addItem(TOTE, "Canvas Tote", new BigDecimal("12.50"), new Quantity(2)));

        assertThatThrownBy(() -> store.update(cart -> cart.removeItem(MUG)))
                .isInstanceOf(InvalidCartException.class);
        assertThatThrownBy(() -> store.update(cart -> {
            cart.updateQuantity(TOTE, new Quantity(9));
            throw new IllegalStateException("fails after the in-memory change");
        })).isInstanceOf(IllegalStateException.class);

        var loaded = store.current();
        assertThat(loaded.snapshot().revision()).isEqualTo(1);
        assertThat(loaded.items().getFirst().quantity().value()).isEqualTo(2);
    }

    @Test
    void aStorageFailureRollsBackTheWholeChange() {
        store.update(cart -> cart.addItem(TOTE, "Canvas Tote", new BigDecimal("12.50"), new Quantity(2)));
        jdbcTemplate.execute(
                "ALTER TABLE cart_items ADD CONSTRAINT test_rollback_sentinel CHECK (name <> 'ROLLBACK_SENTINEL')");

        try {
            assertThatThrownBy(() -> store.update(cart -> cart.addItem(
                    MUG, "ROLLBACK_SENTINEL", new BigDecimal("8.25"), new Quantity(1))))
                    .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        } finally {
            jdbcTemplate.execute("ALTER TABLE cart_items DROP CONSTRAINT test_rollback_sentinel");
        }

        var loaded = store.current();
        assertThat(loaded.snapshot().revision()).isEqualTo(1);
        assertThat(loaded.items()).extracting(CartItem::product).containsExactly(TOTE);
        assertThat(loaded.items().getFirst().quantity().value()).isEqualTo(2);
    }

    @Test
    void concurrentChangesNeverLoseAnUpdateOrRepeatARevision() throws Exception {
        int workers = 8;
        int additionsPerWorker = 5;
        var barrier = new CyclicBarrier(workers);
        var executor = Executors.newFixedThreadPool(workers);
        try {
            List<Callable<List<Long>>> tasks = new ArrayList<>();
            for (int worker = 0; worker < workers; worker++) {
                tasks.add(() -> {
                    barrier.await(10, TimeUnit.SECONDS);
                    var revisions = new ArrayList<Long>();
                    for (int i = 0; i < additionsPerWorker; i++) {
                        // The same Product from every worker: only a serialized update keeps the sum.
                        revisions.add(store.update(cart -> cart.addItem(
                                TOTE, "Canvas Tote", new BigDecimal("12.50"), new Quantity(1)))
                                .snapshot().revision());
                    }
                    return revisions;
                });
            }

            var seen = new ArrayList<Long>();
            for (var future : executor.invokeAll(tasks, 60, TimeUnit.SECONDS)) {
                seen.addAll(future.get());
            }

            int total = workers * additionsPerWorker;
            assertThat(seen).hasSize(total).doesNotHaveDuplicates();
            assertThat(seen).containsExactlyInAnyOrderElementsOf(LongStream.rangeClosed(1, total).boxed().toList());
            var loaded = store.current();
            assertThat(loaded.snapshot().revision()).isEqualTo(total);
            assertThat(loaded.items().getFirst().quantity().value()).isEqualTo(total);
        } finally {
            executor.shutdownNow();
        }
    }

    private long count(String table) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM " + table, Long.class);
    }
}
