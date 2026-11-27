package io.github.samska.sandbox.payment.storage;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import io.github.samska.sandbox.cart.CartSnapshot;
import io.github.samska.sandbox.cart.ProductReference;
import io.github.samska.sandbox.cart.Quantity;
import io.github.samska.sandbox.payment.InvalidPaymentAttemptException;
import io.github.samska.sandbox.payment.PaymentAttempt;
import io.github.samska.sandbox.payment.PaymentAttemptItem;
import io.github.samska.sandbox.payment.PaymentScenario;
import io.github.samska.sandbox.payment.PaymentStatus;
import io.github.samska.sandbox.payment.application.CartSnapshotProvider;
import io.github.samska.sandbox.payment.application.PaymentAlreadyApprovedException;
import io.github.samska.sandbox.payment.application.PaymentAttemptConflictException;
import io.github.samska.sandbox.payment.application.PaymentAttemptResult;
import io.github.samska.sandbox.payment.application.PaymentStore;

public class JdbcPaymentStore implements PaymentStore {

    private final JdbcClient jdbc;

    public JdbcPaymentStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional
    public PaymentAttemptResult createAttempt(
            UUID attemptId,
            long cartRevision,
            PaymentScenario scenario,
            CartSnapshotProvider cartSnapshotProvider) {
        var existing = find(attemptId);
        if (existing.isPresent()) {
            return replay(existing.get(), cartRevision, scenario);
        }

        // Cart capture checks the revision at read time and the snapshot is frozen into this attempt.
        var snapshot = cartSnapshotProvider.capture(cartRevision);

        if (snapshot.items().isEmpty()) {
            throw new InvalidPaymentAttemptException("Payment cannot be initiated for an empty Cart");
        }

        var approvedAttemptId = approvedAttemptId(cartRevision);
        if (approvedAttemptId.isPresent()) {
            throw new PaymentAlreadyApprovedException(approvedAttemptId.get());
        }

        var attempt = attemptFrom(attemptId, cartRevision, scenario, snapshot);

        // No conflict target: both the attempt-ID primary key and the one-approval-per-revision
        // partial index resolve to "no row inserted" instead of aborting the transaction.
        int inserted = jdbc.sql("""
                        INSERT INTO payment_attempts (attempt_id, cart_revision, scenario, status, total)
                        VALUES (:attemptId, :cartRevision, :scenario, :status, :total)
                        ON CONFLICT DO NOTHING
                        """)
                .param("attemptId", attemptId)
                .param("cartRevision", cartRevision)
                .param("scenario", scenario.name())
                .param("status", attempt.status().name())
                .param("total", attempt.total())
                .update();

        if (inserted == 0) {
            // A concurrent transaction committed first; its row is visible under READ COMMITTED.
            var winner = find(attemptId);
            if (winner.isPresent()) {
                return replay(winner.get(), cartRevision, scenario);
            }
            throw new PaymentAlreadyApprovedException(approvedAttemptId(cartRevision)
                    .orElseThrow(() -> new IllegalStateException("Concurrent Payment insert was not visible")));
        }

        int lineNumber = 1;
        for (var item : attempt.items()) {
            jdbc.sql("""
                            INSERT INTO payment_attempt_items
                                (attempt_id, line_number, product_id, name, unit_price, quantity, line_subtotal)
                            VALUES
                                (:attemptId, :lineNumber, :productId, :name, :unitPrice, :quantity, :lineSubtotal)
                            """)
                    .param("attemptId", attemptId)
                    .param("lineNumber", lineNumber)
                    .param("productId", item.productId())
                    .param("name", item.name())
                    .param("unitPrice", item.unitPrice())
                    .param("quantity", item.quantity().value())
                    .param("lineSubtotal", item.lineSubtotal())
                    .update();
            lineNumber++;
        }

        return new PaymentAttemptResult(attempt, true);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PaymentAttempt> findAttempt(UUID attemptId) {
        return find(attemptId);
    }

    private Optional<UUID> approvedAttemptId(long cartRevision) {
        return jdbc.sql("SELECT attempt_id FROM payment_attempts WHERE cart_revision = :revision AND status = :status")
                .param("revision", cartRevision)
                .param("status", PaymentStatus.APPROVED.name())
                .query((resultSet, rowNumber) -> resultSet.getObject("attempt_id", UUID.class))
                .optional();
    }

    private Optional<PaymentAttempt> find(UUID attemptId) {
        if (attemptId == null) {
            return Optional.empty();
        }

        return jdbc.sql("SELECT attempt_id, cart_revision, scenario, total FROM payment_attempts WHERE attempt_id = :id")
                .param("id", attemptId)
                .query((resultSet, rowNumber) -> new AttemptRow(
                        resultSet.getObject("attempt_id", UUID.class),
                        resultSet.getLong("cart_revision"),
                        PaymentScenario.valueOf(resultSet.getString("scenario")),
                        resultSet.getBigDecimal("total")))
                .optional()
                .map(this::toAttempt);
    }

    private PaymentAttempt toAttempt(AttemptRow row) {
        var items = jdbc.sql("""
                        SELECT product_id, name, unit_price, quantity, line_subtotal
                        FROM payment_attempt_items
                        WHERE attempt_id = :id
                        ORDER BY line_number
                        """)
                .param("id", row.attemptId())
                .query((resultSet, rowNumber) -> new PaymentAttemptItem(
                        new ProductReference(resultSet.getObject("product_id", UUID.class)),
                        resultSet.getString("name"),
                        resultSet.getBigDecimal("unit_price"),
                        new Quantity(resultSet.getInt("quantity")),
                        resultSet.getBigDecimal("line_subtotal")))
                .list();

        return new PaymentAttempt(row.attemptId(), row.cartRevision(), row.scenario(), items, row.total());
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

    private record AttemptRow(UUID attemptId, long cartRevision, PaymentScenario scenario, BigDecimal total) {
    }
}
