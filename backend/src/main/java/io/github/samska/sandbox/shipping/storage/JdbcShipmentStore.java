package io.github.samska.sandbox.shipping.storage;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import io.github.samska.sandbox.account.CurrentAccount;
import io.github.samska.sandbox.inventory.StockLine;
import io.github.samska.sandbox.inventory.application.Inventory;
import io.github.samska.sandbox.order.application.OrderNotFoundException;
import io.github.samska.sandbox.shipping.OrderStatus;
import io.github.samska.sandbox.shipping.Shipment;
import io.github.samska.sandbox.shipping.Shipment.StatusChange;
import io.github.samska.sandbox.shipping.application.InvalidStatusChangeException;
import io.github.samska.sandbox.shipping.application.ShipmentStore;

/**
 * Reads Orders and their status events. The Order tables stay owned by the Order module; this store only
 * reads them to build the tracking and administrator views.
 */
public class JdbcShipmentStore implements ShipmentStore {

    /** The current status is the latest event, or Placed when the Order has none. */
    private static final String CURRENT_STATUS = """
            COALESCE((SELECT e.status FROM order_status_events e WHERE e.order_id = o.order_id
                      ORDER BY e.event_id DESC LIMIT 1), 'PLACED')""";

    private final JdbcClient jdbc;
    private final CurrentAccount currentAccount;
    private final Inventory inventory;

    public JdbcShipmentStore(JdbcClient jdbc, CurrentAccount currentAccount, Inventory inventory) {
        this.jdbc = jdbc;
        this.currentAccount = currentAccount;
        this.inventory = inventory;
    }

    @Override
    @Transactional(readOnly = true)
    public List<HistoryEntry> history() {
        return jdbc.sql("""
                        SELECT o.order_id, o.order_number, o.created_at, o.total, %s AS status,
                               (SELECT COUNT(*) FROM order_items i WHERE i.order_id = o.order_id) AS item_count
                        FROM orders o
                        WHERE o.account_id = :accountId
                        ORDER BY o.order_number DESC""".formatted(CURRENT_STATUS))
                .param("accountId", currentAccount.id())
                .query((rs, row) -> new HistoryEntry(
                        rs.getObject("order_id", UUID.class), rs.getLong("order_number"), instant(rs, "created_at"),
                        rs.getInt("item_count"), rs.getBigDecimal("total"), OrderStatus.valueOf(rs.getString("status"))))
                .list();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Shipment> track(UUID orderId) {
        if (orderId == null) {
            return Optional.empty();
        }
        return jdbc.sql("""
                        SELECT order_id, order_number, created_at FROM orders
                        WHERE order_id = :orderId AND account_id = :accountId""")
                .param("orderId", orderId)
                .param("accountId", currentAccount.id())
                .query((rs, row) -> Shipment.of(
                        orderId, rs.getLong("order_number"), instant(rs, "created_at"), changes(orderId)))
                .optional();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminOrder> listAll(OrderStatus status) {
        return adminOrders(status, null);
    }

    private List<AdminOrder> adminOrders(OrderStatus status, UUID orderId) {
        var sql = new StringBuilder("""
                SELECT * FROM (
                    SELECT o.order_id, o.order_number, o.created_at, o.total, a.email, %s AS status
                    FROM orders o JOIN accounts a ON a.account_id = o.account_id) x
                WHERE TRUE""".formatted(CURRENT_STATUS));
        var params = new java.util.HashMap<String, Object>();
        if (status != null) {
            sql.append(" AND x.status = :status");
            params.put("status", status.name());
        }
        if (orderId != null) {
            sql.append(" AND x.order_id = :orderId");
            params.put("orderId", orderId);
        }
        sql.append(" ORDER BY x.order_number DESC");
        return jdbc.sql(sql.toString()).params(params).query(this::toAdminOrder).list();
    }

    @Override
    @Transactional
    public AdminOrder changeStatus(UUID orderId, OrderStatus status) {
        if (orderId == null || status == null) {
            throw new IllegalArgumentException("Order and status are required");
        }

        // Locking the Order row makes two administrators changing it at once take turns.
        var locked = jdbc.sql("SELECT order_id FROM orders WHERE order_id = :orderId FOR UPDATE")
                .param("orderId", orderId)
                .query(UUID.class)
                .optional();
        if (locked.isEmpty()) {
            throw new OrderNotFoundException();
        }

        var current = currentStatus(orderId);
        if (current.isFinal()) {
            throw new InvalidStatusChangeException("A cancelled Order cannot change status");
        }
        if (current == status) {
            throw new InvalidStatusChangeException("The Order already has this status");
        }

        jdbc.sql("INSERT INTO order_status_events (order_id, status) VALUES (:orderId, :status)")
                .param("orderId", orderId)
                .param("status", status.name())
                .update();

        if (status == OrderStatus.CANCELLED) {
            var lines = jdbc.sql("SELECT product_id, quantity FROM order_items WHERE order_id = :orderId")
                    .param("orderId", orderId)
                    .query((rs, row) -> new StockLine(rs.getObject("product_id", UUID.class), rs.getInt("quantity")))
                    .list();
            inventory.restock(lines);
        }

        return adminOrders(null, orderId).get(0);
    }

    private OrderStatus currentStatus(UUID orderId) {
        return jdbc.sql("SELECT status FROM order_status_events WHERE order_id = :orderId ORDER BY event_id DESC LIMIT 1")
                .param("orderId", orderId)
                .query(String.class)
                .optional()
                .map(OrderStatus::valueOf)
                .orElse(OrderStatus.PLACED);
    }

    private List<StatusChange> changes(UUID orderId) {
        return jdbc.sql("SELECT status, changed_at FROM order_status_events WHERE order_id = :orderId ORDER BY event_id")
                .param("orderId", orderId)
                .query((rs, row) -> new StatusChange(OrderStatus.valueOf(rs.getString("status")), instant(rs, "changed_at")))
                .list();
    }

    private AdminOrder toAdminOrder(ResultSet rs, int row) throws SQLException {
        var orderId = rs.getObject("order_id", UUID.class);
        var lines = jdbc.sql("SELECT name, quantity FROM order_items WHERE order_id = :orderId ORDER BY line_number")
                .param("orderId", orderId)
                .query((items, n) -> new Line(items.getString("name"), items.getInt("quantity")))
                .list();
        return new AdminOrder(orderId, rs.getLong("order_number"), instant(rs, "created_at"), rs.getString("email"),
                rs.getBigDecimal("total"), OrderStatus.valueOf(rs.getString("status")), lines);
    }

    private static java.time.Instant instant(ResultSet rs, String column) throws SQLException {
        return rs.getObject(column, OffsetDateTime.class).toInstant();
    }
}
