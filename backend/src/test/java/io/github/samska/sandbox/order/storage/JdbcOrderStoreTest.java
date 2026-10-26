package io.github.samska.sandbox.order.storage;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
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
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

import io.github.samska.sandbox.cart.ProductReference;
import io.github.samska.sandbox.cart.Quantity;
import io.github.samska.sandbox.order.Order;
import io.github.samska.sandbox.order.OrderItem;
import io.github.samska.sandbox.order.application.OrderPaymentNotApprovedException;
import io.github.samska.sandbox.order.application.OrderResult;
import io.github.samska.sandbox.order.application.OrderStore;
import io.github.samska.sandbox.payment.PaymentAttempt;
import io.github.samska.sandbox.payment.PaymentAttemptItem;
import io.github.samska.sandbox.payment.PaymentScenario;
import io.github.samska.sandbox.payment.application.PaymentAttemptNotFoundException;
import io.github.samska.sandbox.payment.application.PaymentAttempts;
import io.github.samska.sandbox.support.OrderDatabaseTestSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Import(JdbcOrderStoreTest.AttemptsConfiguration.class)
class JdbcOrderStoreTest extends OrderDatabaseTestSupport {

    private static final UUID PRODUCT = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID FIRST = UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111");
    private static final UUID SECOND = UUID.fromString("bbbbbbbb-2222-2222-2222-222222222222");

    @Autowired
    private OrderStore store;

    @Autowired
    private ControlledAttempts attempts;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DataSource dataSource;

    @BeforeEach
    void resetAttempts() {
        attempts.reset();
    }

    @Test
    void roundTripsTheImmutableOrderAndItemsWithObservableMonetaryValues() {
        attempts.put(FIRST, attempt(FIRST, PaymentScenario.APPROVE, "Canvas Tote", "12.5", 2, "25.00"));

        var created = store.create(FIRST);

        assertThat(created.created()).isTrue();
        assertThat(store.create(FIRST).created()).isFalse();
        assertThat(store.findById(created.order().orderId())).contains(created.order());
        assertThat(store.findByPaymentAttemptId(FIRST)).contains(created.order());
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
    void preservesItemOrderForMultiItemOrders() {
        attempts.put(FIRST, new PaymentAttempt(FIRST, 1, PaymentScenario.APPROVE,
                List.of(
                        item("First item", "10.00", 1, "10.00"),
                        item("Second item", "20.00", 1, "20.00")),
                new BigDecimal("30.00")));

        var created = store.create(FIRST).order();
        var reloaded = store.findById(created.orderId()).orElseThrow();

        assertThat(created.items()).extracting(OrderItem::name)
                .containsExactly("First item", "Second item");
        assertThat(reloaded.items()).extracting(OrderItem::name)
                .containsExactly("First item", "Second item");
        assertThat(reloaded.total()).isEqualByComparingTo("30.00");
    }

    @Test
    void refusesMissingOrNonApprovedAttemptsWithoutStoringAnOrder() {
        attempts.put(SECOND, attempt(SECOND, PaymentScenario.DECLINE, "Canvas Tote", "12.50", 2, "25.00"));

        assertThatExceptionOfType(OrderPaymentNotApprovedException.class).isThrownBy(() -> store.create(SECOND));
        assertThatExceptionOfType(PaymentAttemptNotFoundException.class).isThrownBy(() -> store.create(FIRST));
        assertThat(store.findByPaymentAttemptId(SECOND)).isEmpty();
        assertThat(count("orders")).isZero();
    }

    @Test
    void serializesConcurrentCreatesForOneAttemptIntoOneOrder() throws Exception {
        attempts.put(FIRST, attempt(FIRST, PaymentScenario.APPROVE, "Canvas Tote", "12.50", 2, "25.00"));
        attempts.synchronizeLookups(2);
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
                    return store.create(FIRST);
                });
                var second = executor.submit(() -> {
                    start.await(5, TimeUnit.SECONDS);
                    return store.create(FIRST);
                });
                start.countDown();
                Thread.sleep(250);
                lockConnection.rollback();

                var results = List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS));
                assertThat(results).filteredOn(OrderResult::created).hasSize(1);
                assertThat(results.get(0).order().orderId()).isEqualTo(results.get(1).order().orderId());
                assertThat(count("orders")).isEqualTo(1);
                assertThat(count("order_items")).isEqualTo(1);
            } finally {
                executor.shutdownNow();
            }
        }
    }

    @Test
    void rollsBackTheOrderWhenAnItemInsertFails() {
        attempts.put(FIRST, attempt(FIRST, PaymentScenario.APPROVE, "ROLLBACK_SENTINEL", "12.50", 2, "25.00"));
        jdbcTemplate.execute(
                "ALTER TABLE order_items ADD CONSTRAINT test_rollback_sentinel CHECK (name <> 'ROLLBACK_SENTINEL')");

        try {
            assertThatThrownBy(() -> store.create(FIRST)).isInstanceOf(DataIntegrityViolationException.class);
            assertThat(count("orders")).isZero();
            assertThat(count("order_items")).isZero();
        } finally {
            jdbcTemplate.execute("ALTER TABLE order_items DROP CONSTRAINT test_rollback_sentinel");
        }

        var retried = store.create(FIRST);
        assertThat(retried.created()).isTrue();
        assertThat(count("orders")).isEqualTo(1);
        assertThat(count("order_items")).isEqualTo(1);
    }

    @Test
    void returnsTheCommittedOrderWhenTheCallerObservesFailureAfterCommit() {
        attempts.put(FIRST, attempt(FIRST, PaymentScenario.APPROVE, "Canvas Tote", "12.50", 2, "25.00"));

        OrderStore losingResponse = new OrderStore() {
            @Override
            public OrderResult create(UUID paymentAttemptId) {
                store.create(paymentAttemptId);
                throw new DataAccessResourceFailureException("response lost after commit");
            }

            @Override
            public Optional<Order> findById(UUID orderId) {
                return store.findById(orderId);
            }

            @Override
            public Optional<Order> findByPaymentAttemptId(UUID paymentAttemptId) {
                return store.findByPaymentAttemptId(paymentAttemptId);
            }
        };

        assertThatThrownBy(() -> losingResponse.create(FIRST))
                .isInstanceOf(DataAccessResourceFailureException.class);

        var retried = store.create(FIRST);
        assertThat(retried.created()).isFalse();
        assertThat(retried.order().paymentAttemptId()).isEqualTo(FIRST);
        assertThat(count("orders")).isEqualTo(1);
        assertThat(count("order_items")).isEqualTo(1);
    }

    @Test
    void createsMoreThanThirtyTwoOrdersWithoutAnAdmissionLimit() {
        for (int index = 0; index < 33; index++) {
            var attemptId = UUID.nameUUIDFromBytes(("attempt-" + index).getBytes());
            attempts.put(attemptId, attempt(attemptId, PaymentScenario.APPROVE, "Canvas Tote", "12.50", 1, "12.50"));
            assertThat(store.create(attemptId).created()).isTrue();
        }

        assertThat(count("orders")).isEqualTo(33);
        assertThat(count("order_items")).isEqualTo(33);
    }

    private long count(String table) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM " + table, Long.class);
    }

    private static PaymentAttempt attempt(
            UUID attemptId, PaymentScenario scenario, String name, String unitPrice, int quantity, String lineSubtotal) {
        return new PaymentAttempt(attemptId, 1, scenario,
                List.of(item(name, unitPrice, quantity, lineSubtotal)),
                new BigDecimal(lineSubtotal));
    }

    private static PaymentAttemptItem item(String name, String unitPrice, int quantity, String lineSubtotal) {
        return new PaymentAttemptItem(new ProductReference(PRODUCT), name,
                new BigDecimal(unitPrice), new Quantity(quantity), new BigDecimal(lineSubtotal));
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class AttemptsConfiguration {

        @Bean
        @Primary
        ControlledAttempts controlledAttempts() {
            return new ControlledAttempts();
        }
    }

    static class ControlledAttempts implements PaymentAttempts {

        private final Map<UUID, PaymentAttempt> attempts = new ConcurrentHashMap<>();
        private volatile CyclicBarrier lookupBarrier;

        void reset() {
            attempts.clear();
            lookupBarrier = null;
        }

        void put(UUID id, PaymentAttempt attempt) {
            attempts.put(id, attempt);
        }

        void synchronizeLookups(int parties) {
            lookupBarrier = new CyclicBarrier(parties);
        }

        @Override
        public PaymentAttempt getAttempt(UUID attemptId) {
            var attempt = attempts.get(attemptId);
            if (attempt == null) {
                throw new PaymentAttemptNotFoundException(attemptId);
            }

            var barrier = lookupBarrier;
            if (barrier != null) {
                try {
                    barrier.await(5, TimeUnit.SECONDS);
                } catch (Exception exception) {
                    throw new IllegalStateException("Timed out synchronizing Payment lookups", exception);
                }
            }
            return attempt;
        }
    }
}
