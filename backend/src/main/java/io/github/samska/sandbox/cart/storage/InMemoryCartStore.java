package io.github.samska.sandbox.cart.storage;

import org.springframework.stereotype.Component;

import io.github.samska.sandbox.cart.Cart;
import io.github.samska.sandbox.cart.application.CartStore;

@Component
public class InMemoryCartStore implements CartStore {

    private final Cart currentCart = new Cart();

    @Override
    public Cart current() {
        return currentCart;
    }
}
