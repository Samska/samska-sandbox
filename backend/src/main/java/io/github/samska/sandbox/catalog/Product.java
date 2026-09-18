package io.github.samska.sandbox.catalog;

import java.math.BigDecimal;

public final class Product {

    private final ProductId id;
    private String name;
    private BigDecimal price;

    public Product(ProductId id, String name, BigDecimal price) {
        if (id == null) {
            throw new InvalidProductException("Product ID must not be null");
        }

        this.id = id;
        this.name = validatedName(name);
        this.price = validatedPrice(price);
    }

    public ProductId id() {
        return id;
    }

    public String name() {
        return name;
    }

    public BigDecimal price() {
        return price;
    }

    public void rename(String name) {
        this.name = validatedName(name);
    }

    public void changePrice(BigDecimal price) {
        this.price = validatedPrice(price);
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof Product product)) {
            return false;
        }
        return id.equals(product.id);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }

    private static String validatedName(String name) {
        if (name == null || name.isBlank()) {
            throw new InvalidProductException("Product name must not be blank");
        }
        return name;
    }

    private static BigDecimal validatedPrice(BigDecimal price) {
        if (price == null) {
            throw new InvalidProductException("Product price must not be null");
        }
        if (price.signum() < 0) {
            throw new InvalidProductException("Product price must not be negative");
        }
        return price;
    }
}
