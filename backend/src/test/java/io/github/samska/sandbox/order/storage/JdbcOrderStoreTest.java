package io.github.samska.sandbox.order.storage;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

import io.github.samska.sandbox.cart.CartItem;
import io.github.samska.sandbox.cart.CartRevisionMismatchException;
import io.github.samska.sandbox.cart.CartSnapshot;
import io.github.samska.sandbox.cart.ProductReference;
import io.github.samska.sandbox.cart.Quantity;
import io.github.samska.sandbox.order.Order;
import io.github.samska.sandbox.order.OrderItem;
import io.github.samska.sandbox.order.application.CartSnapshotProvider;
import io.github.samska.sandbox.order.application.OrderOutOfStockException;
import io.github.samska.sandbox.order.application.OrderResult;
import io.github.samska.sandbox.order.application.OrderStore;
import io.github.samska.sandbox.support.OrderDatabaseTestSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class JdbcOrderStoreTest extends OrderDatabaseTestSupport {

    private static final UUID PRODUCT = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID FIRST = UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111");
    private static final UUID SECOND = UUID.fromString("bbbbbbbb-2222-2222-2222-222222222222");

    @Autowired
    private OrderStore store;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DataSource dataSource;

    @Test
    void roundTripsTheImmutableOrderAndItemsWithObservableMonetaryValues() {
        var cart = cart("Canvas Tote", "12.5", 2, "25.00");

        var created = store.create(FIRST, 1, cart);

        assertThat(created.created()).isTrue();
        assertThat(store.create(FIRST, 1, cart).created()).isFalse();
        assertThat(store.findById(created.order().orderId())).contains(created.order());
        assertThat(created.order().requestId()).isEqualTo(FIRST);
        assertThat(created.order().cartRevision()).isEqualTo(1);
        assertThat(created.order().total()).isEqualByComparingTo("25.00");
        assertThat(created.order().items()).singleElement().satisfies(item -> {
            assertThat(item.productId()).isEqualTo(PRODUCT);
            assertThat(item.name()).isEqualTo("Canvas Tote");
            assertThat(item.unitPrice()).isEqualByComparingTo("12.5");
            assertThat(item.quantity()).isEqualTo(2);
            assertThat(item.lineSubtotal()).isEqualByComparingTo("25.00");
        });
        assertThat(count("orders")).isEqualTo(1);
        assertThat(count("order_items")).isEqualTo(1);
    }

    @Test
    void replaysAnExistingRequestWithoutReadingTheCartAgain() {
        var created = store.create(FIRST, 1, cart("Canvas Tote", "12.50", 1, "12.50")).order();

        CartSnapshotProvider emptiedCart = revision -> {
            throw new CartRevisionMismatchException(revision, revision + 1);
        };
        var replay = store.create(FIRST, 1, emptiedCart);

        assertThat(replay.created()).isFalse();
        assertThat(replay.order()).isEqualTo(created);
    }

    @Test
    void numbersOrdersInCreationOrderWithAFriendlyDisplayForm() {
        var cart = cart("Canvas Tote", "12.50", 1, "12.50");

        var first = store.create(FIRST, 1, cart).order();
        var second = store.create(SECOND, 1, cart).order();

        assertThat(second.orderNumber()).isGreaterThan(first.orderNumber());
        assertThat(store.create(FIRST, 1, cart).order().orderNumber()).isEqualTo(first.orderNumber());
        assertThat(store.findSummary(second.orderId())).get()
                .extracting(summary -> summary.orderNumber()).isEqualTo(second.orderNumber());
        assertThat(store.listForCurrentAccount()).extracting(summary -> summary.orderNumber())
                .containsExactly(second.orderNumber(), first.orderNumber());
        assertThat(Order.displayNumber(128)).isEqualTo("SK-000128");
    }

    @Test
    void preservesItemOrderForMultiItemOrders() {
        var snapshot = new CartSnapshot(List.of(
                cartItem(PRODUCT, "First item", "10.00", 1),
                cartItem(UUID.fromString("22222222-2222-2222-2222-222222222222"), "Second item", "20.00", 1)),
                new BigDecimal("30.00"), 1);

        var created = store.create(FIRST, 1, revision -> snapshot).order();
        var reloaded = store.findById(created.orderId()).orElseThrow();

        assertThat(created.items()).extracting(OrderItem::name)
                .containsExactly("First item", "Second item");
        assertThat(reloaded.items()).extracting(OrderItem::name)
                .containsExactly("First item", "Second item");
        assertThat(reloaded.total()).isEqualByComparingTo("30.00");
    }

    @Test
    void refusesAnEmptyCartOrAChangedCartWithoutStoringAnOrder() {
        var empty = new CartSnapshot(List.of(), BigDecimal.ZERO, 0);
        CartSnapshotProvider changed = revision -> {
            throw new CartRevisionMismatchException(revision, revision + 1);
        };

        assertThatExceptionOfType(IllegalArgumentException.class)
                .isThrownBy(() -> store.create(FIRST, 0, revision -> empty));
        assertThatExceptionOfType(CartRevisionMismatchException.class)
                .isThrownBy(() -> store.create(FIRST, 1, changed));
        assertThat(count("orders")).isZero();
    }

    @Test
    void takesTheStockAndRefusesTheOrderWhenTheUnitsAreGone() {
        var stocked = cart("Canvas Tote", "12.50", 1000, "12500.00");

        assertThat(store.create(FIRST, 1, stocked).created()).isTrue();
        assertThat(stock()).isZero();

        assertThatExceptionOfType(OrderOutOfStockException.class)
                .isThrownBy(() -> store.create(SECOND, 1, cart("Canvas Tote", "12.50", 1, "12.50")));
        assertThat(count("orders")).isEqualTo(1);
        assertThat(count("order_items")).isEqualTo(1);
        assertThat(stock()).isZero();
    }

    @Test
    void serializesConcurrentCreatesForOneRequestIntoOneOrder() throws Exception {
        var barrier = new CyclicBarrier(2);
        var snapshot = snapshot("Canvas Tote", "12.50", 2, "25.00");
        CartSnapshotProvider synchronizedCart = revision -> {
            try {
                barrier.await(5, TimeUnit.SECONDS);
            } catch (Exception exception) {
                throw new IllegalStateException("Timed out synchronizing Cart reads", exception);
            }
            return snapshot;
        };
        var start = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);

        // Hold a SHARE lock so both requests finish the replay SELECT and then block on INSERT.
        // Releasing it makes the second insert hit the unique constraint deterministically.
        try (var lockConnection = dataSource.getConnection()) {
            lockConnection.setAutoCommit(false);
            try (var statement = lockConnection.createStatement()) {
                statement.execute("LOCK TABLE orders IN SHARE MODE");
            }

            try {
                var first = executor.submit(() -> {
                    start.await(5, TimeUnit.SECONDS);
                    return store.create(FIRST, 1, synchronizedCart);
                });
                var second = executor.submit(() -> {
                    start.await(5, TimeUnit.SECONDS);
                    return store.create(FIRST, 1, synchronizedCart);
                });
                start.countDown();
                Thread.sleep(250);
                lockConnection.rollback();

                var results = List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS));
                assertThat(results).filteredOn(OrderResult::created).hasSize(1);
                assertThat(results.get(0).order().orderId()).isEqualTo(results.get(1).order().orderId());
                assertThat(count("orders")).isEqualTo(1);
                assertThat(count("order_items")).isEqualTo(1);
                assertThat(stock()).isEqualTo(998);
            } finally {
                executor.shutdownNow();
            }
        }
    }

    @Test
    void rollsBackTheOrderWhenAnItemInsertFails() {
        var cart = cart("ROLLBACK_SENTINEL", "12.50", 2, "25.00");
        jdbcTemplate.execute(
                "ALTER TABLE order_items ADD CONSTRAINT test_rollback_sentinel CHECK (name <> 'ROLLBACK_SENTINEL')");

        try {
            assertThatThrownBy(() -> store.create(FIRST, 1, cart)).isInstanceOf(DataIntegrityViolationException.class);
            assertThat(count("orders")).isZero();
            assertThat(count("order_items")).isZero();
            assertThat(stock()).isEqualTo(1000);
        } finally {
            jdbcTemplate.execute("ALTER TABLE order_items DROP CONSTRAINT test_rollback_sentinel");
        }

        var retried = store.create(FIRST, 1, cart);
        assertThat(retried.created()).isTrue();
        assertThat(count("orders")).isEqualTo(1);
        assertThat(count("order_items")).isEqualTo(1);
    }

    @Test
    void returnsTheCommittedOrderWhenTheCallerObservesFailureAfterCommit() {
        var cart = cart("Canvas Tote", "12.50", 2, "25.00");

        assertThatThrownBy(() -> {
            store.create(FIRST, 1, cart);
            throw new DataAccessResourceFailureException("response lost after commit");
        }).isInstanceOf(DataAccessResourceFailureException.class);

        var retried = store.create(FIRST, 1, cart);
        assertThat(retried.created()).isFalse();
        assertThat(retried.order().requestId()).isEqualTo(FIRST);
        assertThat(count("orders")).isEqualTo(1);
        assertThat(count("order_items")).isEqualTo(1);
        assertThat(stock()).isEqualTo(998);
    }

    @Test
    void createsMoreThanThirtyTwoOrdersWithoutAnAdmissionLimit() {
        var cart = cart("Canvas Tote", "12.50", 1, "12.50");
        for (int index = 0; index < 33; index++) {
            var requestId = UUID.nameUUIDFromBytes(("request-" + index).getBytes());
            assertThat(store.create(requestId, 1, cart).created()).isTrue();
        }

        assertThat(count("orders")).isEqualTo(33);
        assertThat(count("order_items")).isEqualTo(33);
    }

    private long count(String table) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM " + table, Long.class);
    }

    private long stock() {
        return jdbcTemplate.queryForObject("SELECT on_hand FROM stock_levels WHERE product_id = ?", Long.class, PRODUCT);
    }

    private static CartSnapshotProvider cart(String name, String unitPrice, int quantity, String lineSubtotal) {
        var snapshot = snapshot(name, unitPrice, quantity, lineSubtotal);
        return revision -> snapshot;
    }

    private static CartSnapshot snapshot(String name, String unitPrice, int quantity, String lineSubtotal) {
        return new CartSnapshot(List.of(cartItem(PRODUCT, name, unitPrice, quantity)),
                new BigDecimal(lineSubtotal), 1);
    }

    private static CartItem cartItem(UUID product, String name, String unitPrice, int quantity) {
        return new CartItem(new ProductReference(product), name, new BigDecimal(unitPrice), new Quantity(quantity));
    }
}
