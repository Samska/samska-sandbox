package io.github.samska.sandbox.cart.storage;

import java.util.List;
import java.util.function.Consumer;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import io.github.samska.sandbox.cart.Cart;
import io.github.samska.sandbox.cart.CartItem;
import io.github.samska.sandbox.cart.ProductReference;
import io.github.samska.sandbox.cart.Quantity;
import io.github.samska.sandbox.cart.application.CartStore;

public class JdbcCartStore implements CartStore {

    private static final short CART_ID = 1;

    private final JdbcClient jdbc;

    public JdbcCartStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional(readOnly = true)
    public Cart current() {
        return load();
    }

    @Override
    @Transactional
    public Cart update(Consumer<Cart> change) {
        // The migration seeds the row; this covers a database whose row was removed. The row lock
        // serializes every change, so revisions are strictly increasing and no update is lost.
        jdbc.sql("INSERT INTO cart (cart_id, revision) VALUES (:cartId, 0) ON CONFLICT (cart_id) DO NOTHING")
                .param("cartId", CART_ID)
                .update();
        jdbc.sql("SELECT revision FROM cart WHERE cart_id = :cartId FOR UPDATE")
                .param("cartId", CART_ID)
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
        var revision = jdbc.sql("SELECT revision FROM cart WHERE cart_id = :cartId")
                .param("cartId", CART_ID)
                .query(Long.class)
                .optional()
                .orElse(0L);

        List<CartItem> items = jdbc.sql("""
                        SELECT product_id, name, unit_price, quantity
                        FROM cart_items
                        WHERE cart_id = :cartId
                        ORDER BY line_number
                        """)
                .param("cartId", CART_ID)
                .query((resultSet, rowNumber) -> new CartItem(
                        new ProductReference(resultSet.getObject("product_id", java.util.UUID.class)),
                        resultSet.getString("name"),
                        resultSet.getBigDecimal("unit_price"),
                        new Quantity(resultSet.getInt("quantity"))))
                .list();

        return Cart.restore(items, revision);
    }

    private void save(List<CartItem> items, long revision) {
        jdbc.sql("DELETE FROM cart_items WHERE cart_id = :cartId")
                .param("cartId", CART_ID)
                .update();

        int lineNumber = 1;
        for (var item : items) {
            jdbc.sql("""
                            INSERT INTO cart_items (cart_id, line_number, product_id, name, unit_price, quantity)
                            VALUES (:cartId, :lineNumber, :productId, :name, :unitPrice, :quantity)
                            """)
                    .param("cartId", CART_ID)
                    .param("lineNumber", lineNumber)
                    .param("productId", item.product().value())
                    .param("name", item.name())
                    .param("unitPrice", item.unitPrice())
                    .param("quantity", item.quantity().value())
                    .update();
            lineNumber++;
        }

        jdbc.sql("UPDATE cart SET revision = :revision WHERE cart_id = :cartId")
                .param("revision", revision)
                .param("cartId", CART_ID)
                .update();
    }
}
