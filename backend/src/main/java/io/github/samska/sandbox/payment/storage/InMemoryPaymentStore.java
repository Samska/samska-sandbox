package io.github.samska.sandbox.payment.storage;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.stereotype.Component;

import io.github.samska.sandbox.cart.CartSnapshot;
import io.github.samska.sandbox.payment.InvalidPaymentAttemptException;
import io.github.samska.sandbox.payment.PaymentAttempt;
import io.github.samska.sandbox.payment.PaymentAttemptItem;
import io.github.samska.sandbox.payment.PaymentLimits;
import io.github.samska.sandbox.payment.PaymentScenario;
import io.github.samska.sandbox.payment.PaymentStatus;
import io.github.samska.sandbox.payment.application.CartSnapshotProvider;
import io.github.samska.sandbox.payment.application.PaymentAlreadyApprovedException;
import io.github.samska.sandbox.payment.application.PaymentAttemptConflictException;
import io.github.samska.sandbox.payment.application.PaymentAttemptResult;
import io.github.samska.sandbox.payment.application.PaymentCapacityExceededException;
import io.github.samska.sandbox.payment.application.PaymentStore;

@Component
public class InMemoryPaymentStore implements PaymentStore {

    private final ReentrantLock lock = new ReentrantLock();
    private final Map<UUID, PaymentAttempt> attempts = new LinkedHashMap<>();
    private final Map<Long, UUID> approvedAttemptsByRevision = new HashMap<>();

    @Override
    public PaymentAttemptResult createAttempt(
            UUID attemptId,
            long cartRevision,
            PaymentScenario scenario,
            CartSnapshotProvider cartSnapshotProvider) {
        lock.lock();
        try {
            var existingAttempt = attempts.get(attemptId);

            if (existingAttempt != null) {
                return replay(existingAttempt, cartRevision, scenario);
            }

            // Lock order is Payment -> Cart: the Cart revision check and capture happen
            // while this store lock is held, so the decision applies to one frozen revision.
            var snapshot = cartSnapshotProvider.capture(cartRevision);

            if (snapshot.items().isEmpty()) {
                throw new InvalidPaymentAttemptException("Payment cannot be initiated for an empty Cart");
            }

            var approvedAttemptId = approvedAttemptsByRevision.get(cartRevision);

            if (approvedAttemptId != null) {
                throw new PaymentAlreadyApprovedException(approvedAttemptId);
            }

            if (attempts.size() >= PaymentLimits.MAX_ATTEMPTS) {
                throw new PaymentCapacityExceededException();
            }

            var attempt = attemptFrom(attemptId, cartRevision, scenario, snapshot);
            attempts.put(attemptId, attempt);

            if (attempt.status() == PaymentStatus.APPROVED) {
                approvedAttemptsByRevision.put(cartRevision, attemptId);
            }

            return new PaymentAttemptResult(attempt, true);
        } finally {
            lock.unlock();
        }
    }

    @Override
    public Optional<PaymentAttempt> findAttempt(UUID attemptId) {
        lock.lock();
        try {
            return Optional.ofNullable(attempts.get(attemptId));
        } finally {
            lock.unlock();
        }
    }

    private static PaymentAttemptResult replay(
            PaymentAttempt existingAttempt, long cartRevision, PaymentScenario scenario) {
        if (existingAttempt.cartRevision() != cartRevision || existingAttempt.scenario() != scenario) {
            throw new PaymentAttemptConflictException(existingAttempt.attemptId());
        }

        return new PaymentAttemptResult(existingAttempt, false);
    }

    private static PaymentAttempt attemptFrom(
            UUID attemptId, long cartRevision, PaymentScenario scenario, CartSnapshot snapshot) {
        var items = snapshot.items().stream()
                .map(item -> new PaymentAttemptItem(
                        item.product(), item.name(), item.unitPrice(), item.quantity(), item.lineSubtotal()))
                .toList();

        return new PaymentAttempt(attemptId, cartRevision, scenario, items, snapshot.total());
    }
}
