package io.github.samska.sandbox.order.storage;

import java.math.BigDecimal;
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
import io.github.samska.sandbox.order.application.CartSnapshotProvider;
import io.github.samska.sandbox.order.application.OrderOutOfStockException;
import io.github.samska.sandbox.order.application.OrderResult;
import io.github.samska.sandbox.order.application.OrderStore;

public class JdbcOrderStore implements OrderStore {

    private static final String ORDER_COLUMNS = "order_id, order_number, request_id, cart_revision, total";

    private static final String SUMMARY_SELECT = """
            SELECT o.order_id, o.order_number, o.created_at, o.total,
                   (SELECT COUNT(*) FROM order_items i WHERE i.order_id = o.order_id) AS item_count
            FROM orders o""";

    private final JdbcClient jdbc;
    private final CurrentAccount currentAccount;
    private final Inventory inventory;

    public JdbcOrderStore(JdbcClient jdbc, CurrentAccount currentAccount, Inventory inventory) {
        this.jdbc = jdbc;
        this.currentAccount = currentAccount;
        this.inventory = inventory;
    }

    @Override
    @Transactional
    public OrderResult create(UUID requestId, long cartRevision, CartSnapshotProvider cartSnapshotProvider) {
        if (requestId == null) {
            throw new IllegalArgumentException("Request ID is required");
        }

        var existing = findByRequestId(requestId);
        if (existing.isPresent()) {
            return new OrderResult(existing.get(), false);
        }

        // Checks the revision at read time; the snapshot is frozen into the Order.
        var snapshot = cartSnapshotProvider.capture(cartRevision);
        if (snapshot.items().isEmpty()) {
            throw new IllegalArgumentException("An Order cannot be placed from an empty Cart");
        }

        var orderId = UUID.randomUUID();
        var inserted = jdbc.sql("""
                        INSERT INTO orders (order_id, account_id, request_id, cart_revision, total)
                        VALUES (:orderId, :accountId, :requestId, :cartRevision, :total)
                        ON CONFLICT (request_id) DO NOTHING
                        RETURNING order_number
                        """)
                .param("orderId", orderId)
                .param("accountId", currentAccount.id())
                .param("requestId", requestId)
                .param("cartRevision", cartRevision)
                .param("total", snapshot.total())
                .query((resultSet, rowNumber) -> resultSet.getLong("order_number"))
                .optional();

        if (inserted.isEmpty()) {
            // A concurrent transaction won the unique constraint. Its commit happened before this
            // statement resolved, so the winning Order is visible under READ COMMITTED.
            // When it is not visible to this account, the id belongs to another account: refused, not revealed.
            return new OrderResult(findByRequestId(requestId)
                    .orElseThrow(() -> new IllegalArgumentException("Request ID is already in use")), false);
        }

        var items = snapshot.items().stream()
                .map(item -> new OrderItem(item.product().value(), item.name(), item.unitPrice(),
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
            inventory.consume(items.stream()
                    .map(item -> new StockLine(item.productId(), item.quantity()))
                    .toList());
        } catch (InsufficientStockException exception) {
            throw new OrderOutOfStockException(exception.productId());
        }

        return new OrderResult(
                new Order(orderId, inserted.get(), requestId, cartRevision, items, snapshot.total()), true);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Order> findById(UUID orderId) {
        return findOrder("order_id", orderId);
    }

    @Transactional(readOnly = true)
    Optional<Order> findByRequestId(UUID requestId) {
        return findOrder("request_id", requestId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderSummary> listForCurrentAccount() {
        return jdbc.sql(SUMMARY_SELECT + " WHERE o.account_id = :accountId ORDER BY o.order_number DESC")
                .param("accountId", currentAccount.id())
                .query(JdbcOrderStore::toSummary)
                .list();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<OrderSummary> findSummary(UUID orderId) {
        if (orderId == null) {
            return Optional.empty();
        }

        return jdbc.sql(SUMMARY_SELECT + " WHERE o.order_id = :orderId AND o.account_id = :accountId")
                .param("orderId", orderId)
                .param("accountId", currentAccount.id())
                .query(JdbcOrderStore::toSummary)
                .optional();
    }

    private static OrderSummary toSummary(java.sql.ResultSet resultSet, int rowNumber) throws java.sql.SQLException {
        return new OrderSummary(
                resultSet.getObject("order_id", UUID.class),
                resultSet.getLong("order_number"),
                resultSet.getObject("created_at", java.time.OffsetDateTime.class).toInstant(),
                resultSet.getInt("item_count"),
                resultSet.getBigDecimal("total"));
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
                        resultSet.getLong("order_number"),
                        resultSet.getObject("request_id", UUID.class),
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

        return new Order(row.orderId(), row.orderNumber(), row.requestId(), row.cartRevision(), items, row.total());
    }

    private record OrderRow(
            UUID orderId,
            long orderNumber,
            UUID requestId,
            long cartRevision,
            BigDecimal total) {
    }
}
