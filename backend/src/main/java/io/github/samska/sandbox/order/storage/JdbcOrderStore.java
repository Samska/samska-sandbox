package io.github.samska.sandbox.order.storage;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import io.github.samska.sandbox.account.CurrentAccount;
import io.github.samska.sandbox.inventory.StockLine;
import io.github.samska.sandbox.inventory.application.InsufficientStockException;
import io.github.samska.sandbox.inventory.application.Inventory;
import io.github.samska.sandbox.order.Order;
import io.github.samska.sandbox.order.OrderItem;
import io.github.samska.sandbox.order.OrderSummary;
import io.github.samska.sandbox.order.application.OrderOutOfStockException;
import io.github.samska.sandbox.order.application.OrderPaymentNotApprovedException;
import io.github.samska.sandbox.order.application.OrderResult;
import io.github.samska.sandbox.order.application.OrderStore;
import io.github.samska.sandbox.payment.PaymentStatus;
import io.github.samska.sandbox.payment.application.PaymentAttempts;

public class JdbcOrderStore implements OrderStore {

    private static final String ORDER_COLUMNS = "order_id, payment_attempt_id, cart_revision, total";

    private final JdbcClient jdbc;
    private final PaymentAttempts attempts;
    private final CurrentAccount currentAccount;
    private final Inventory inventory;

    public JdbcOrderStore(
            JdbcClient jdbc, PaymentAttempts attempts, CurrentAccount currentAccount, Inventory inventory) {
        this.jdbc = jdbc;
        this.attempts = attempts;
        this.currentAccount = currentAccount;
        this.inventory = inventory;
    }

    @Override
    @Transactional
    public OrderResult create(UUID attemptId) {
        if (attemptId == null) {
            throw new IllegalArgumentException("Payment attempt ID is required");
        }

        var existing = findByPaymentAttemptId(attemptId);
        if (existing.isPresent()) {
            return new OrderResult(existing.get(), false);
        }

        // Directional dependency: Order reads Payment through its owned contract; Payment never calls Order.
        var attempt = attempts.getAttempt(attemptId);
        if (attempt.status() != PaymentStatus.APPROVED) {
            throw new OrderPaymentNotApprovedException();
        }

        var orderId = UUID.randomUUID();
        var inserted = jdbc.sql("""
                        INSERT INTO orders (order_id, account_id, payment_attempt_id, cart_revision, total)
                        VALUES (:orderId, :accountId, :attemptId, :cartRevision, :total)
                        ON CONFLICT (payment_attempt_id) DO NOTHING
                        RETURNING order_id
                        """)
                .param("orderId", orderId)
                .param("accountId", currentAccount.id())
                .param("attemptId", attemptId)
                .param("cartRevision", attempt.cartRevision())
                .param("total", attempt.total())
                .query((resultSet, rowNumber) -> resultSet.getObject("order_id", UUID.class))
                .optional();

        if (inserted.isEmpty()) {
            // A concurrent transaction won the unique constraint. Its commit happened before this
            // statement resolved, so the winning Order is visible under READ COMMITTED.
            return new OrderResult(findByPaymentAttemptId(attemptId)
                    .orElseThrow(() -> new IllegalStateException("Concurrent Order insert was not visible")), false);
        }

        var items = attempt.items().stream()
                .map(item -> new OrderItem(item.productId(), item.name(), item.unitPrice(),
                        item.quantity().value(), item.lineSubtotal()))
                .toList();

        int lineNumber = 1;
        for (var item : items) {
            jdbc.sql("""
                            INSERT INTO order_items
                                (order_id, line_number, product_id, name, unit_price, quantity, line_subtotal)
                            VALUES
                                (:orderId, :lineNumber, :productId, :name, :unitPrice, :quantity, :lineSubtotal)
                            """)
                    .param("orderId", orderId)
                    .param("lineNumber", lineNumber)
                    .param("productId", item.productId())
                    .param("name", item.name())
                    .param("unitPrice", item.unitPrice())
                    .param("quantity", item.quantity())
                    .param("lineSubtotal", item.lineSubtotal())
                    .update();
            lineNumber++;
        }

        // Same transaction as the Order: when the units are gone, no Order is recorded.
        try {
            inventory.consume(attemptId, items.stream()
                    .map(item -> new StockLine(item.productId(), item.quantity()))
                    .toList());
        } catch (InsufficientStockException exception) {
            throw new OrderOutOfStockException(exception.productId());
        }

        return new OrderResult(
                new Order(orderId, attemptId, attempt.cartRevision(), items, attempt.total()), true);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Order> findById(UUID orderId) {
        return findOrder("order_id", orderId);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Order> findByPaymentAttemptId(UUID attemptId) {
        return findOrder("payment_attempt_id", attemptId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderSummary> listForCurrentAccount() {
        return jdbc.sql("""
                        SELECT o.order_id, o.created_at, o.total,
                               (SELECT COUNT(*) FROM order_items i WHERE i.order_id = o.order_id) AS item_count
                        FROM orders o
                        WHERE o.account_id = :accountId
                        ORDER BY o.created_at DESC, o.order_id
                        """)
                .param("accountId", currentAccount.id())
                .query((resultSet, rowNumber) -> new OrderSummary(
                        resultSet.getObject("order_id", UUID.class),
                        resultSet.getObject("created_at", java.time.OffsetDateTime.class).toInstant(),
                        resultSet.getInt("item_count"),
                        resultSet.getBigDecimal("total")))
                .list();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Instant> findCreatedAt(UUID orderId) {
        if (orderId == null) {
            return Optional.empty();
        }

        return jdbc.sql("SELECT created_at FROM orders WHERE order_id = :orderId AND account_id = :accountId")
                .param("orderId", orderId)
                .param("accountId", currentAccount.id())
                .query((resultSet, rowNumber) -> resultSet.getObject("created_at", java.time.OffsetDateTime.class)
                        .toInstant())
                .optional();
    }

    private Optional<Order> findOrder(String column, UUID value) {
        if (value == null) {
            return Optional.empty();
        }

        return jdbc.sql("SELECT " + ORDER_COLUMNS + " FROM orders WHERE " + column + " = :value AND account_id = :accountId")
                .param("value", value)
                .param("accountId", currentAccount.id())
                .query((resultSet, rowNumber) -> new OrderRow(
                        resultSet.getObject("order_id", UUID.class),
                        resultSet.getObject("payment_attempt_id", UUID.class),
                        resultSet.getLong("cart_revision"),
                        resultSet.getBigDecimal("total")))
                .optional()
                .map(this::toOrder);
    }

    private Order toOrder(OrderRow row) {
        var items = jdbc.sql("""
                        SELECT product_id, name, unit_price, quantity, line_subtotal
                        FROM order_items
                        WHERE order_id = :orderId
                        ORDER BY line_number
                        """)
                .param("orderId", row.orderId())
                .query((resultSet, rowNumber) -> new OrderItem(
                        resultSet.getObject("product_id", UUID.class),
                        resultSet.getString("name"),
                        resultSet.getBigDecimal("unit_price"),
                        resultSet.getInt("quantity"),
                        resultSet.getBigDecimal("line_subtotal")))
                .list();

        if (items.isEmpty()) {
            throw new IllegalStateException("Order has no items: " + row.orderId());
        }

        return new Order(row.orderId(), row.paymentAttemptId(), row.cartRevision(), items, row.total());
    }

    private record OrderRow(
            UUID orderId,
            UUID paymentAttemptId,
            long cartRevision,
            BigDecimal total) {
    }
}
