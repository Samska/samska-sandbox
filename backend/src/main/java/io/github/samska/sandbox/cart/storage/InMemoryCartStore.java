package io.github.samska.sandbox.cart.storage;

import java.util.function.Consumer;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import io.github.samska.sandbox.cart.Cart;
import io.github.samska.sandbox.cart.application.CartStore;

/** Process-local Cart used by the {@code no-database} test profile and pure unit tests. */
@Component
@Profile("no-database")
public class InMemoryCartStore implements CartStore {

    private final Cart currentCart = new Cart();

    @Override
    public Cart current() {
        return currentCart;
    }

    @Override
    public synchronized Cart update(Consumer<Cart> change) {
        change.accept(currentCart);
        return currentCart;
    }
}
