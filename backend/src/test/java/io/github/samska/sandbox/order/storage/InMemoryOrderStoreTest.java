package io.github.samska.sandbox.order.storage;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.cart.ProductReference;
import io.github.samska.sandbox.cart.Quantity;
import io.github.samska.sandbox.order.application.OrderCapacityExceededException;
import io.github.samska.sandbox.order.application.OrderPaymentNotApprovedException;
import io.github.samska.sandbox.payment.PaymentAttempt;
import io.github.samska.sandbox.payment.PaymentAttemptItem;
import io.github.samska.sandbox.payment.PaymentScenario;
import io.github.samska.sandbox.payment.application.PaymentAttemptNotFoundException;
import io.github.samska.sandbox.payment.application.PaymentAttempts;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class InMemoryOrderStoreTest {

    private static final UUID PRODUCT = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID FIRST = UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111");
    private static final UUID SECOND = UUID.fromString("bbbbbbbb-2222-2222-2222-222222222222");

    private PaymentAttempt attempt(UUID id, PaymentScenario scenario) {
        return new PaymentAttempt(id, 1, scenario,
                List.of(new PaymentAttemptItem(new ProductReference(PRODUCT), "Canvas Tote",
                        new BigDecimal("12.50"), new Quantity(2), new BigDecimal("25.00"))),
                new BigDecimal("25.00"));
    }

    @Test
    void copiesTheApprovedFrozenAttemptAndReplaysAfterTheSourceChanges() {
        var source = new AtomicReference<>(attempt(FIRST, PaymentScenario.APPROVE));
        var store = new InMemoryOrderStore(id -> source.get());
        var created = store.create(FIRST);
        source.set(attempt(FIRST, PaymentScenario.DECLINE));

        assertThat(created.created()).isTrue();
        assertThat(store.create(FIRST).created()).isFalse();
        assertThat(store.create(FIRST).order()).isSameAs(created.order());
        assertThat(store.findById(created.order().orderId())).contains(created.order());
        assertThat(store.findByPaymentAttemptId(FIRST)).contains(created.order());
        assertThat(created.order().cartRevision()).isEqualTo(1);
        assertThat(created.order().total()).isEqualByComparingTo("25.00");
        assertThat(created.order().items()).singleElement().satisfies(item -> {
            assertThat(item.productId()).isEqualTo(PRODUCT);
            assertThat(item.name()).isEqualTo("Canvas Tote");
            assertThat(item.unitPrice()).isEqualByComparingTo("12.50");
            assertThat(item.quantity()).isEqualTo(2);
            assertThat(item.lineSubtotal()).isEqualByComparingTo("25.00");
        });
    }

    @Test
    void refusesMissingOrNonApprovedAttemptWithoutStoringAnOrder() {
        PaymentAttempts source = id -> {
            if (id.equals(SECOND)) {
                throw new PaymentAttemptNotFoundException(id);
            }
            return attempt(id, PaymentScenario.DECLINE);
        };
        var store = new InMemoryOrderStore(source);

        assertThatExceptionOfType(OrderPaymentNotApprovedException.class).isThrownBy(() -> store.create(FIRST));
        assertThatExceptionOfType(PaymentAttemptNotFoundException.class).isThrownBy(() -> store.create(SECOND));
        assertThat(store.findByPaymentAttemptId(FIRST)).isEmpty();

        var failed = new InMemoryOrderStore(id -> attempt(id, PaymentScenario.TEMPORARY_FAILURE));
        assertThatExceptionOfType(OrderPaymentNotApprovedException.class)
                .isThrownBy(() -> failed.create(FIRST));
        assertThat(failed.findByPaymentAttemptId(FIRST)).isEmpty();
    }

    @Test
    void refusesOnlyNewOrdersAtCapacityWithoutWeakeningLookupOrReplay() {
        var store = new InMemoryOrderStore(id -> attempt(id, PaymentScenario.APPROVE), 1);
        var first = store.create(FIRST).order();

        assertThatExceptionOfType(OrderCapacityExceededException.class).isThrownBy(() -> store.create(SECOND));
        assertThat(store.create(FIRST).order()).isSameAs(first);
        assertThat(store.findById(first.orderId())).contains(first);
        assertThat(store.findByPaymentAttemptId(SECOND)).isEmpty();
    }

    @Test
    void serializesConcurrentSameAttemptIncludingARequestHeldInPaymentLookup() throws Exception {
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var store = new InMemoryOrderStore(id -> {
            entered.countDown();
            try {
                if (!release.await(5, TimeUnit.SECONDS)) {
                    throw new AssertionError("Timed out waiting for Payment lookup");
                }
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new AssertionError(exception);
            }
            return attempt(id, PaymentScenario.APPROVE);
        });
        var first = new AtomicReference<io.github.samska.sandbox.order.application.OrderResult>();
        var second = new AtomicReference<io.github.samska.sandbox.order.application.OrderResult>();
        var firstThread = new Thread(() -> first.set(store.create(FIRST)));
        var secondThread = new Thread(() -> second.set(store.create(FIRST)));
        firstThread.start();
        try {
            assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
            secondThread.start();
        } finally {
            release.countDown();
        }
        firstThread.join(5000);
        secondThread.join(5000);
        assertThat(firstThread.isAlive()).isFalse();
        assertThat(secondThread.isAlive()).isFalse();
        assertThat(first.get()).isNotNull();
        assertThat(second.get()).isNotNull();
        assertThat(first.get().created()).isTrue();
        assertThat(second.get().created()).isFalse();
        assertThat(first.get().order()).isSameAs(second.get().order());
    }
}
