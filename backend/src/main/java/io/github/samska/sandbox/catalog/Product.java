package io.github.samska.sandbox.catalog;

import java.math.BigDecimal;

public final class Product {

    private final ProductId id;
    private String name;
    private String description;
    private BigDecimal price;

    public Product(ProductId id, String name, String description, BigDecimal price) {
        if (id == null) {
            throw new InvalidProductException("Product ID must not be null");
        }

        this.id = id;
        this.name = validatedName(name);
        this.description = validatedDescription(description);
        this.price = validatedPrice(price);
    }

    public ProductId id() {
        return id;
    }

    public String name() {
        return name;
    }

    public String description() {
        return description;
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

    private static String validatedDescription(String description) {
        if (description == null || description.isBlank()) {
            throw new InvalidProductException("Product description must not be blank");
        }
        return description;
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
