package io.github.samska.sandbox.cart.storage;

import java.util.List;
import java.util.function.Consumer;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import io.github.samska.sandbox.account.CurrentAccount;
import io.github.samska.sandbox.cart.Cart;
import io.github.samska.sandbox.cart.CartItem;
import io.github.samska.sandbox.cart.ProductReference;
import io.github.samska.sandbox.cart.Quantity;
import io.github.samska.sandbox.cart.application.CartStore;

public class JdbcCartStore implements CartStore {

    private final JdbcClient jdbc;
    private final CurrentAccount currentAccount;

    public JdbcCartStore(JdbcClient jdbc, CurrentAccount currentAccount) {
        this.jdbc = jdbc;
        this.currentAccount = currentAccount;
    }

    @Override
    @Transactional(readOnly = true)
    public Cart current() {
        return load();
    }

    @Override
    @Transactional
    public Cart update(Consumer<Cart> change) {
        // Creates the owner's row on first use. The row lock
        // serializes every change, so revisions are strictly increasing and no update is lost.
        jdbc.sql("INSERT INTO cart (owner_id, revision) VALUES (:ownerId, 0) ON CONFLICT (owner_id) DO NOTHING")
                .param("ownerId", currentAccount.id())
                .update();
        jdbc.sql("SELECT revision FROM cart WHERE owner_id = :ownerId FOR UPDATE")
                .param("ownerId", currentAccount.id())
                .query(Long.class)
                .single();

        var cart = load();
        var revisionBefore = cart.snapshot().revision();
        change.accept(cart);

        var snapshot = cart.snapshot();
        if (snapshot.revision() != revisionBefore) {
            save(snapshot.items(), snapshot.revision());
        }
        return cart;
    }

    private Cart load() {
        var revision = jdbc.sql("SELECT revision FROM cart WHERE owner_id = :ownerId")
                .param("ownerId", currentAccount.id())
                .query(Long.class)
                .optional()
                .orElse(0L);

        List<CartItem> items = jdbc.sql("""
                        SELECT product_id, name, unit_price, quantity
                        FROM cart_items
                        WHERE owner_id = :ownerId
                        ORDER BY line_number
                        """)
                .param("ownerId", currentAccount.id())
                .query((resultSet, rowNumber) -> new CartItem(
                        new ProductReference(resultSet.getObject("product_id", java.util.UUID.class)),
                        resultSet.getString("name"),
                        resultSet.getBigDecimal("unit_price"),
                        new Quantity(resultSet.getInt("quantity"))))
                .list();

        return Cart.restore(items, revision);
    }

    private void save(List<CartItem> items, long revision) {
        jdbc.sql("DELETE FROM cart_items WHERE owner_id = :ownerId")
                .param("ownerId", currentAccount.id())
                .update();

        int lineNumber = 1;
        for (var item : items) {
            jdbc.sql("""
                            INSERT INTO cart_items (owner_id, line_number, product_id, name, unit_price, quantity)
                            VALUES (:ownerId, :lineNumber, :productId, :name, :unitPrice, :quantity)
                            """)
                    .param("ownerId", currentAccount.id())
                    .param("lineNumber", lineNumber)
                    .param("productId", item.product().value())
                    .param("name", item.name())
                    .param("unitPrice", item.unitPrice())
                    .param("quantity", item.quantity().value())
                    .update();
            lineNumber++;
        }

        jdbc.sql("UPDATE cart SET revision = :revision WHERE owner_id = :ownerId")
                .param("revision", revision)
                .param("ownerId", currentAccount.id())
                .update();
    }
}
