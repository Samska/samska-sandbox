package io.github.samska.sandbox.cart;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class Cart {

    private final Map<ProductReference, CartItem> items = new LinkedHashMap<>();

    public synchronized void addItem(
            ProductReference product,
            String name,
            BigDecimal unitPrice,
            Quantity quantity) {
        var existingItem = items.get(product);
        items.put(product, existingItem == null
                ? new CartItem(product, name, unitPrice, quantity)
                : existingItem.addQuantity(quantity));
    }

    public synchronized boolean hasItem(ProductReference product) {
        return items.containsKey(product);
    }

    public synchronized void updateQuantity(ProductReference product, Quantity quantity) {
        var existingItem = items.get(product);
        if (existingItem == null) {
            throw new InvalidCartException("Cart item was not found");
        }
        items.put(product, existingItem.withQuantity(quantity));
    }

    public synchronized void removeItem(ProductReference product) {
        if (items.remove(product) == null) {
            throw new InvalidCartException("Cart item was not found");
        }
    }

    public synchronized List<CartItem> items() {
        return List.copyOf(items.values());
    }

    public synchronized CartSnapshot snapshot() {
        return new CartSnapshot(List.copyOf(items.values()), total());
    }

    public synchronized BigDecimal total() {
        return items.values().stream()
                .map(CartItem::lineSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
