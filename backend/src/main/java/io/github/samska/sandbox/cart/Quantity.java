package io.github.samska.sandbox.cart;

public record Quantity(int value) {

    public Quantity {
        if (value < 1) {
            throw new InvalidCartException("Quantity must be at least one");
        }
    }

    public Quantity add(Quantity other) {
        try {
            return new Quantity(Math.addExact(value, other.value));
        } catch (ArithmeticException exception) {
            throw new InvalidCartException("Quantity is too large");
        }
    }
}
