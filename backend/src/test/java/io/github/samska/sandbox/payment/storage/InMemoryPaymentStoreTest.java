package io.github.samska.sandbox.payment.storage;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.cart.Cart;
import io.github.samska.sandbox.cart.CartRevisionMismatchException;
import io.github.samska.sandbox.cart.ProductReference;
import io.github.samska.sandbox.cart.Quantity;
import io.github.samska.sandbox.payment.InvalidPaymentAttemptException;
import io.github.samska.sandbox.payment.PaymentLimits;
import io.github.samska.sandbox.payment.PaymentScenario;
import io.github.samska.sandbox.payment.PaymentStatus;
import io.github.samska.sandbox.payment.application.CartSnapshotProvider;
import io.github.samska.sandbox.payment.application.PaymentAlreadyApprovedException;
import io.github.samska.sandbox.payment.application.PaymentAttemptConflictException;
import io.github.samska.sandbox.payment.application.PaymentAttemptResult;
import io.github.samska.sandbox.payment.application.PaymentCapacityExceededException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

class InMemoryPaymentStoreTest {

    private static final UUID PRODUCT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID ATTEMPT_ID = UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111");

    private final InMemoryPaymentStore store = new InMemoryPaymentStore();

    @Test
    void createsAnAttemptAndReplaysItForAnIdenticalRequest() {
        var cart = cartWithItem(2);

        var created = store.createAttempt(ATTEMPT_ID, 1, PaymentScenario.APPROVE, cart::snapshotForRevision);

        assertThat(created.created()).isTrue();
        assertThat(created.attempt().status()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(created.attempt().cartRevision()).isEqualTo(1);
        assertThat(created.attempt().total()).isEqualByComparingTo("25.00");
        assertThat(created.attempt().items()).singleElement().satisfies(item -> {
            assertThat(item.productId()).isEqualTo(PRODUCT_ID);
            assertThat(item.name()).isEqualTo("Canvas Tote");
            assertThat(item.unitPrice()).isEqualByComparingTo("12.50");
            assertThat(item.quantity().value()).isEqualTo(2);
            assertThat(item.lineSubtotal()).isEqualByComparingTo("25.00");
        });

        var replay = store.createAttempt(ATTEMPT_ID, 1, PaymentScenario.APPROVE, cart::snapshotForRevision);

        assertThat(replay.created()).isFalse();
        assertThat(replay.attempt()).isEqualTo(created.attempt());
    }

    @Test
    void rejectsAReusedAttemptIdWithADifferentScenarioOrRevision() {
        var cart = cartWithItem(1);
        store.createAttempt(ATTEMPT_ID, 1, PaymentScenario.DECLINE, cart::snapshotForRevision);

        assertThatExceptionOfType(PaymentAttemptConflictException.class)
                .isThrownBy(() -> store.createAttempt(ATTEMPT_ID, 1, PaymentScenario.APPROVE, cart::snapshotForRevision));
        assertThatExceptionOfType(PaymentAttemptConflictException.class)
                .isThrownBy(() -> store.createAttempt(ATTEMPT_ID, 2, PaymentScenario.DECLINE, cart::snapshotForRevision));

        assertThat(store.findAttempt(ATTEMPT_ID)).isPresent()
                .get()
                .satisfies(attempt -> assertThat(attempt.scenario()).isEqualTo(PaymentScenario.DECLINE));
    }

    @Test
    void recordsOnlyOneApprovalPerCartRevision() {
        var cart = cartWithItem(1);
        var declinedId = UUID.randomUUID();
        var approvedId = UUID.randomUUID();
        var refusedId = UUID.randomUUID();

        store.createAttempt(declinedId, 1, PaymentScenario.DECLINE, cart::snapshotForRevision);
        var approved = store.createAttempt(approvedId, 1, PaymentScenario.APPROVE, cart::snapshotForRevision);

        assertThat(approved.attempt().status()).isEqualTo(PaymentStatus.APPROVED);

        var exception = catchThrowableOfType(
                () -> store.createAttempt(refusedId, 1, PaymentScenario.DECLINE, cart::snapshotForRevision),
                PaymentAlreadyApprovedException.class);

        assertThat(exception).isNotNull();
        assertThat(exception.existingAttemptId()).isEqualTo(approvedId);
        assertThat(store.findAttempt(refusedId)).isEmpty();
        assertThat(store.findAttempt(declinedId)).isPresent();
    }

    @Test
    void rejectsAnEmptyCartWithoutStoringAnAttempt() {
        var emptyCart = new Cart();

        assertThatExceptionOfType(InvalidPaymentAttemptException.class)
                .isThrownBy(() -> store.createAttempt(ATTEMPT_ID, 0, PaymentScenario.DECLINE, emptyCart::snapshotForRevision));

        assertThat(store.findAttempt(ATTEMPT_ID)).isEmpty();
    }

    @Test
    void rejectsAStaleCartRevisionWithoutStoringAnAttempt() {
        var cart = cartWithItem(1);

        assertThatExceptionOfType(CartRevisionMismatchException.class)
                .isThrownBy(() -> store.createAttempt(ATTEMPT_ID, 0, PaymentScenario.DECLINE, cart::snapshotForRevision));

        assertThat(store.findAttempt(ATTEMPT_ID)).isEmpty();
    }

    @Test
    void keepsTheCapturedSnapshotWhenTheCartChangesAfterCapture() {
        var cart = cartWithItem(2);
        store.createAttempt(ATTEMPT_ID, 1, PaymentScenario.APPROVE, cart::snapshotForRevision);

        cart.updateQuantity(new ProductReference(PRODUCT_ID), new Quantity(5));

        assertThat(store.findAttempt(ATTEMPT_ID)).isPresent().get().satisfies(attempt -> {
            assertThat(attempt.cartRevision()).isEqualTo(1);
            assertThat(attempt.items()).singleElement()
                    .satisfies(item -> assertThat(item.quantity().value()).isEqualTo(2));
            assertThat(attempt.total()).isEqualByComparingTo("25.00");
        });
        assertThat(cart.snapshot().revision()).isEqualTo(2);
        assertThat(cart.total()).isEqualByComparingTo("62.50");
    }

    @Test
    void holdsTheAttemptLockWhileTheCartIsCaptured() throws Exception {
        var cart = cartWithItem(1);
        var captureStarted = new CountDownLatch(1);
        var releaseCapture = new CountDownLatch(1);
        CartSnapshotProvider blockingSnapshot = expectedRevision -> {
            captureStarted.countDown();
            await(releaseCapture);
            return cart.snapshotForRevision(expectedRevision);
        };
        var firstId = UUID.randomUUID();
        var secondId = UUID.randomUUID();
        var firstError = new AtomicReference<Throwable>();
        var secondResult = new AtomicReference<PaymentAttemptResult>();
        var secondError = new AtomicReference<Throwable>();
        var secondFinished = new CountDownLatch(1);

        var first = new Thread(() -> {
            try {
                store.createAttempt(firstId, 1, PaymentScenario.APPROVE, blockingSnapshot);
            } catch (Throwable throwable) {
                firstError.set(throwable);
            }
        });
        var second = new Thread(() -> {
            try {
                secondResult.set(store.createAttempt(secondId, 1, PaymentScenario.DECLINE, cart::snapshotForRevision));
            } catch (Throwable throwable) {
                secondError.set(throwable);
            } finally {
                secondFinished.countDown();
            }
        });

        first.start();
        assertThat(captureStarted.await(5, TimeUnit.SECONDS)).isTrue();

        second.start();
        assertThat(secondFinished.await(200, TimeUnit.MILLISECONDS)).isFalse();

        releaseCapture.countDown();
        first.join(5_000);
        second.join(5_000);

        assertThat(firstError.get()).isNull();
        assertThat(secondResult.get()).isNull();
        assertThat(secondError.get()).isInstanceOf(PaymentAlreadyApprovedException.class);
        assertThat(((PaymentAlreadyApprovedException) secondError.get()).existingAttemptId()).isEqualTo(firstId);
        assertThat(store.findAttempt(firstId)).isPresent();
        assertThat(store.findAttempt(secondId)).isEmpty();
    }

    @Test
    void rejectsACartMutationThatWinsBeforeTheSnapshotCapture() throws Exception {
        var cart = cartWithItem(2);
        var providerEntered = new CountDownLatch(1);
        var releaseProvider = new CountDownLatch(1);
        CartSnapshotProvider interleavedSnapshot = expectedRevision -> {
            providerEntered.countDown();
            await(releaseProvider);
            return cart.snapshotForRevision(expectedRevision);
        };
        var result = new AtomicReference<Throwable>();
        var initiation = new Thread(() -> {
            try {
                store.createAttempt(ATTEMPT_ID, 1, PaymentScenario.DECLINE, interleavedSnapshot);
            } catch (Throwable throwable) {
                result.set(throwable);
            }
        });

        initiation.start();
        assertThat(providerEntered.await(5, TimeUnit.SECONDS)).isTrue();

        cart.updateQuantity(new ProductReference(PRODUCT_ID), new Quantity(4));

        releaseProvider.countDown();
        initiation.join(5_000);

        assertThat(result.get()).isInstanceOf(CartRevisionMismatchException.class);
        assertThat(store.findAttempt(ATTEMPT_ID)).isEmpty();
    }

    @Test
    void recordsOnlyOneApprovalWhenDifferentIdsApproveSimultaneously() throws Exception {
        var cart = cartWithItem(1);
        var startGate = new CountDownLatch(1);
        var firstId = UUID.randomUUID();
        var secondId = UUID.randomUUID();
        List<PaymentAttemptResult> outcomes = new CopyOnWriteArrayList<>();
        List<Throwable> errors = new CopyOnWriteArrayList<>();

        var first = initiationThread(firstId, 1, PaymentScenario.APPROVE, cart, startGate, outcomes, errors);
        var second = initiationThread(secondId, 1, PaymentScenario.APPROVE, cart, startGate, outcomes, errors);

        first.start();
        second.start();
        startGate.countDown();
        first.join(5_000);
        second.join(5_000);

        var approved = outcomes.stream().filter(PaymentAttemptResult::created).toList();
        assertThat(approved).hasSize(1);
        assertThat(approved.getFirst().attempt().status()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(errors).hasSize(1);
        assertThat(errors.getFirst()).isInstanceOf(PaymentAlreadyApprovedException.class);
        assertThat(((PaymentAlreadyApprovedException) errors.getFirst()).existingAttemptId())
                .isEqualTo(approved.getFirst().attempt().attemptId());

        var stored = Stream.of(firstId, secondId)
                .filter(attemptId -> store.findAttempt(attemptId).isPresent())
                .toList();
        assertThat(stored).containsExactly(approved.getFirst().attempt().attemptId());
    }

    @Test
    void replaysAConcurrentIdenticalRequestWithASingleStoredAttempt() throws Exception {
        var cart = cartWithItem(1);
        var startGate = new CountDownLatch(1);
        List<PaymentAttemptResult> outcomes = new CopyOnWriteArrayList<>();
        List<Throwable> errors = new CopyOnWriteArrayList<>();

        var first = initiationThread(ATTEMPT_ID, 1, PaymentScenario.DECLINE, cart, startGate, outcomes, errors);
        var second = initiationThread(ATTEMPT_ID, 1, PaymentScenario.DECLINE, cart, startGate, outcomes, errors);

        first.start();
        second.start();
        startGate.countDown();
        first.join(5_000);
        second.join(5_000);

        assertThat(errors).isEmpty();
        assertThat(outcomes).hasSize(2);
        assertThat(outcomes.stream().filter(PaymentAttemptResult::created)).hasSize(1);
        assertThat(outcomes.get(0).attempt()).isEqualTo(outcomes.get(1).attempt());
        assertThat(store.findAttempt(ATTEMPT_ID)).isPresent();
    }

    @Test
    void allowsSeparateNonApprovingAttemptsForTheSameRevision() {
        var cart = cartWithItem(1);
        var firstId = UUID.randomUUID();
        var secondId = UUID.randomUUID();

        assertThat(store.createAttempt(firstId, 1, PaymentScenario.DECLINE, cart::snapshotForRevision).created())
                .isTrue();
        assertThat(store.createAttempt(secondId, 1, PaymentScenario.TEMPORARY_FAILURE, cart::snapshotForRevision).created())
                .isTrue();

        assertThat(store.findAttempt(firstId)).isPresent();
        assertThat(store.findAttempt(secondId)).isPresent();
    }

    @Test
    void enforcesTheAttemptCapacityWithoutEvictionOrReplayLoss() {
        var cart = cartWithItem(1);
        var firstId = UUID.randomUUID();
        store.createAttempt(firstId, 1, PaymentScenario.DECLINE, cart::snapshotForRevision);

        for (int index = 1; index < PaymentLimits.MAX_ATTEMPTS; index++) {
            store.createAttempt(UUID.randomUUID(), 1, PaymentScenario.DECLINE, cart::snapshotForRevision);
        }

        assertThatExceptionOfType(PaymentCapacityExceededException.class)
                .isThrownBy(() -> store.createAttempt(
                        UUID.randomUUID(), 1, PaymentScenario.DECLINE, cart::snapshotForRevision));

        var replay = store.createAttempt(firstId, 1, PaymentScenario.DECLINE, cart::snapshotForRevision);
        assertThat(replay.created()).isFalse();

        assertThatExceptionOfType(PaymentAttemptConflictException.class)
                .isThrownBy(() -> store.createAttempt(firstId, 2, PaymentScenario.DECLINE, cart::snapshotForRevision));

        assertThat(store.findAttempt(firstId)).isPresent();
    }

    @Test
    void losesAttemptsWhenTheProcessStoreIsRecreated() {
        var cart = cartWithItem(1);
        store.createAttempt(ATTEMPT_ID, 1, PaymentScenario.APPROVE, cart::snapshotForRevision);

        var restartedStore = new InMemoryPaymentStore();

        assertThat(restartedStore.findAttempt(ATTEMPT_ID)).isEmpty();
    }

    private Thread initiationThread(
            UUID attemptId,
            long revision,
            PaymentScenario scenario,
            Cart cart,
            CountDownLatch startGate,
            List<PaymentAttemptResult> outcomes,
            List<Throwable> errors) {
        return new Thread(() -> {
            await(startGate);
            try {
                outcomes.add(store.createAttempt(attemptId, revision, scenario, cart::snapshotForRevision));
            } catch (Throwable throwable) {
                errors.add(throwable);
            }
        });
    }

    private static Cart cartWithItem(int quantity) {
        var cart = new Cart();
        cart.addItem(new ProductReference(PRODUCT_ID), "Canvas Tote", new BigDecimal("12.50"), new Quantity(quantity));
        return cart;
    }

    private static void await(CountDownLatch latch) {
        try {
            if (!latch.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Timed out waiting for latch");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for latch", exception);
        }
    }
}
