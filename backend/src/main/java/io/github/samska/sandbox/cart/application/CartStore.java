package io.github.samska.sandbox.cart.application;

import java.util.function.Consumer;

import io.github.samska.sandbox.cart.Cart;

public interface CartStore {

    /** Returns the current Cart. Callers that change it must go through {@link #update}. */
    Cart current();

    /**
     * Applies one change to the current Cart atomically and returns the resulting Cart. If the change
     * throws, nothing is stored and the exception propagates.
     */
    Cart update(Consumer<Cart> change);
}
