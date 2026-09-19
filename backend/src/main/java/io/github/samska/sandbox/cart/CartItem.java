package io.github.samska.sandbox.cart;

import java.math.BigDecimal;

public record CartItem(ProductReference product, String name, BigDecimal unitPrice, Quantity quantity) {

    public CartItem {
        if (product == null) {
            throw new InvalidCartException("Cart Product reference must not be null");
        }
        if (name == null || name.isBlank()) {
            throw new InvalidCartException("Cart Product name must not be blank");
        }
        if (unitPrice == null || unitPrice.signum() < 0) {
            throw new InvalidCartException("Cart unit price must not be negative or null");
        }
        if (quantity == null) {
            throw new InvalidCartException("Cart quantity must not be null");
        }
    }

    public CartItem withQuantity(Quantity newQuantity) {
        return new CartItem(product, name, unitPrice, newQuantity);
    }

    public CartItem addQuantity(Quantity additionalQuantity) {
        return withQuantity(quantity.add(additionalQuantity));
    }

    public BigDecimal lineSubtotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity.value()));
    }
}
