package io.github.samska.sandbox.payment.storage;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import io.github.samska.sandbox.cart.Cart;
import io.github.samska.sandbox.cart.CartRevisionMismatchException;
import io.github.samska.sandbox.cart.ProductReference;
import io.github.samska.sandbox.cart.Quantity;
import io.github.samska.sandbox.payment.InvalidPaymentAttemptException;
import io.github.samska.sandbox.payment.PaymentScenario;
import io.github.samska.sandbox.payment.PaymentStatus;
import io.github.samska.sandbox.payment.application.PaymentAlreadyApprovedException;
import io.github.samska.sandbox.payment.application.PaymentAttemptConflictException;
import io.github.samska.sandbox.payment.application.PaymentAttemptResult;
import io.github.samska.sandbox.payment.application.PaymentStore;
import io.github.samska.sandbox.support.OrderDatabaseTestSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class JdbcPaymentStoreTest extends OrderDatabaseTestSupport {

    private static final UUID TOTE = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID MUG = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID FIRST = UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111");
    private static final UUID SECOND = UUID.fromString("bbbbbbbb-2222-2222-2222-222222222222");

    @Autowired
    private PaymentStore store;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void usesTheProductionJdbcStore() {
        assertThat(store).isInstanceOf(JdbcPaymentStore.class);
    }

    @Test
    void roundTripsTheFrozenSnapshotInLineOrderAndReplaysIt() {
        var cart = twoItemCart();

        var created = store.createAttempt(FIRST, 2, PaymentScenario.APPROVE, cart::snapshotForRevision);
        var loaded = store.findAttempt(FIRST).orElseThrow();

        assertThat(created.created()).isTrue();
        assertThat(loaded.status()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(loaded.cartRevision()).isEqualTo(2);
        assertThat(loaded.total()).isEqualByComparingTo("49.75");
        assertThat(loaded.items()).extracting(item -> item.productId()).containsExactly(TOTE, MUG);
        assertThat(loaded.items()).extracting(item -> item.name()).containsExactly("Canvas Tote", "Enamel Mug");
        assertThat(loaded.items().get(1).lineSubtotal()).isEqualByComparingTo("24.75");

        var replay = store.createAttempt(FIRST, 2, PaymentScenario.APPROVE, cart::snapshotForRevision);
        assertThat(replay.created()).isFalse();
        assertThat(replay.attempt().items()).isEqualTo(loaded.items());
        assertThat(count("payment_attempts")).isEqualTo(1);
        assertThat(count("payment_attempt_items")).isEqualTo(2);
    }

    @Test
    void replayDoesNotReadTheCartAgain() {
        store.createAttempt(FIRST, 2, PaymentScenario.DECLINE, twoItemCart()::snapshotForRevision);

        var replay = store.createAttempt(FIRST, 2, PaymentScenario.DECLINE, revision -> {
            throw new IllegalStateException("Cart must not be read for a replay");
        });

        assertThat(replay.created()).isFalse();
    }

    @Test
    void rejectsAReusedAttemptIdWithADifferentScenarioOrRevision() {
        var cart = twoItemCart();
        store.createAttempt(FIRST, 2, PaymentScenario.DECLINE, cart::snapshotForRevision);

        assertThatThrownBy(() -> store.createAttempt(FIRST, 2, PaymentScenario.APPROVE, cart::snapshotForRevision))
                .isInstanceOf(PaymentAttemptConflictException.class);
        assertThatThrownBy(() -> store.createAttempt(FIRST, 3, PaymentScenario.DECLINE, cart::snapshotForRevision))
                .isInstanceOf(PaymentAttemptConflictException.class);
        assertThat(count("payment_attempts")).isEqualTo(1);
    }

    @Test
    void recordsOnlyOneApprovalPerRevisionAndRejectsFurtherAttemptsForIt() {
        var cart = twoItemCart();
        assertThat(store.createAttempt(SECOND, 2, PaymentScenario.DECLINE, cart::snapshotForRevision).created())
                .isTrue();
        assertThat(store.createAttempt(UUID.randomUUID(), 2, PaymentScenario.TEMPORARY_FAILURE,
                cart::snapshotForRevision).created()).isTrue();
        store.createAttempt(FIRST, 2, PaymentScenario.APPROVE, cart::snapshotForRevision);

        var other = UUID.randomUUID();
        assertThatThrownBy(() -> store.createAttempt(other, 2, PaymentScenario.APPROVE, cart::snapshotForRevision))
                .isInstanceOfSatisfying(PaymentAlreadyApprovedException.class,
                        exception -> assertThat(exception.existingAttemptId()).isEqualTo(FIRST));
        assertThatThrownBy(() -> store.createAttempt(other, 2, PaymentScenario.DECLINE, cart::snapshotForRevision))
                .isInstanceOf(PaymentAlreadyApprovedException.class);
        assertThat(store.findAttempt(other)).isEmpty();
        assertThat(count("payment_attempts")).isEqualTo(3);
    }

    @Test
    void rejectsAnEmptyCartAndAStaleRevisionWithoutStoringAnything() {
        assertThatThrownBy(() -> store.createAttempt(
                FIRST, 0, PaymentScenario.APPROVE, new Cart()::snapshotForRevision))
                .isInstanceOf(InvalidPaymentAttemptException.class);

        var cart = twoItemCart();
        assertThatThrownBy(() -> store.createAttempt(FIRST, 1, PaymentScenario.APPROVE, cart::snapshotForRevision))
                .isInstanceOf(CartRevisionMismatchException.class);

        assertThat(store.findAttempt(FIRST)).isEmpty();
        assertThat(count("payment_attempts")).isZero();
    }

    @Test
    void keepsMoreThanThirtyTwoAttemptsWithoutAnAdmissionLimit() {
        var cart = twoItemCart();

        for (int i = 0; i < 40; i++) {
            store.createAttempt(UUID.randomUUID(), 2, PaymentScenario.DECLINE, cart::snapshotForRevision);
        }

        assertThat(count("payment_attempts")).isEqualTo(40);
    }

    @Test
    void rollsBackTheAttemptWhenAnItemInsertFails() {
        var cart = twoItemCart();
        jdbcTemplate.execute("ALTER TABLE payment_attempt_items ADD CONSTRAINT test_rollback_sentinel "
                + "CHECK (name <> 'Enamel Mug')");

        try {
            assertThatThrownBy(() -> store.createAttempt(FIRST, 2, PaymentScenario.APPROVE, cart::snapshotForRevision))
                    .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        } finally {
            jdbcTemplate.execute("ALTER TABLE payment_attempt_items DROP CONSTRAINT test_rollback_sentinel");
        }

        assertThat(count("payment_attempts")).isZero();
        assertThat(count("payment_attempt_items")).isZero();
        assertThat(store.createAttempt(FIRST, 2, PaymentScenario.APPROVE, cart::snapshotForRevision).created())
                .isTrue();
    }

    @Test
    void recordsOnePersistedApprovalWhenDifferentIdsApproveSimultaneously() throws Exception {
        var cart = twoItemCart();
        var results = runConcurrently(List.of(
                () -> store.createAttempt(FIRST, 2, PaymentScenario.APPROVE, cart::snapshotForRevision),
                () -> store.createAttempt(SECOND, 2, PaymentScenario.APPROVE, cart::snapshotForRevision)));

        var winners = results.stream().filter(PaymentAttemptResult.class::isInstance).toList();
        var errors = results.stream().filter(Throwable.class::isInstance).toList();
        assertThat(winners).hasSize(1);
        assertThat(errors).singleElement().isInstanceOf(PaymentAlreadyApprovedException.class);
        assertThat(count("payment_attempts")).isEqualTo(1);
        assertThat(count("payment_attempt_items")).isEqualTo(2);
    }

    @Test
    void replaysAConcurrentIdenticalRequestWithASingleStoredAttempt() throws Exception {
        var cart = twoItemCart();
        Callable<Object> request = () -> store.createAttempt(
                FIRST, 2, PaymentScenario.DECLINE, cart::snapshotForRevision);

        var results = runConcurrently(List.of(request, request, request));

        assertThat(results).allMatch(PaymentAttemptResult.class::isInstance);
        assertThat(results.stream().map(PaymentAttemptResult.class::cast).filter(PaymentAttemptResult::created))
                .hasSize(1);
        assertThat(count("payment_attempts")).isEqualTo(1);
        assertThat(count("payment_attempt_items")).isEqualTo(2);
    }

    private List<Object> runConcurrently(List<Callable<Object>> requests) throws Exception {
        var barrier = new CyclicBarrier(requests.size());
        var executor = Executors.newFixedThreadPool(requests.size());
        try {
            var futures = new ArrayList<java.util.concurrent.Future<Object>>();
            for (var request : requests) {
                futures.add(executor.submit(() -> {
                    barrier.await(10, TimeUnit.SECONDS);
                    try {
                        return request.call();
                    } catch (Exception exception) {
                        return exception;
                    }
                }));
            }
            var results = new ArrayList<Object>();
            for (var future : futures) {
                results.add(future.get(30, TimeUnit.SECONDS));
            }
            return results;
        } finally {
            executor.shutdownNow();
        }
    }

    private static Cart twoItemCart() {
        var cart = new Cart();
        cart.addItem(new ProductReference(TOTE), "Canvas Tote", new BigDecimal("12.50"), new Quantity(2));
        cart.addItem(new ProductReference(MUG), "Enamel Mug", new BigDecimal("8.25"), new Quantity(3));
        return cart;
    }

    private long count(String table) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM " + table, Long.class);
    }
}
