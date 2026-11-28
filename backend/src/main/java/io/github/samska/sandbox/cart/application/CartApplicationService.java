package io.github.samska.sandbox.cart.application;

import java.util.UUID;

import org.springframework.stereotype.Service;

import io.github.samska.sandbox.cart.Cart;
import io.github.samska.sandbox.cart.CartSnapshot;
import io.github.samska.sandbox.cart.InvalidCartException;
import io.github.samska.sandbox.cart.ProductReference;
import io.github.samska.sandbox.cart.Quantity;
import io.github.samska.sandbox.catalog.application.ProductCatalog;
import io.github.samska.sandbox.inventory.application.Inventory;

@Service
public class CartApplicationService {

    private final CartStore cartStore;
    private final ProductCatalog productCatalog;
    private final Inventory inventory;

    public CartApplicationService(CartStore cartStore, ProductCatalog productCatalog, Inventory inventory) {
        this.cartStore = cartStore;
        this.productCatalog = productCatalog;
        this.inventory = inventory;
    }

    public Cart currentCart() {
        return cartStore.current();
    }

    public CartSnapshot captureSnapshot(long expectedRevision) {
        return cartStore.current().snapshotForRevision(expectedRevision);
    }

    public boolean currentCartContainsProduct(UUID productId) {
        return cartStore.current().hasItem(new ProductReference(productId));
    }

    public Cart addItem(UUID productId, Integer quantity) {
        var validatedQuantity = quantity(quantity);
        var product = productCatalog.findById(productId)
                .orElseThrow(() -> new ProductUnavailableException(productId));
        var reference = new ProductReference(product.id());
        return cartStore.update(cart -> {
            cart.addItem(reference, product.name(), product.price(), validatedQuantity);
            requireStock(cart, reference);
        });
    }

    public Cart updateQuantity(UUID productId, Integer quantity) {
        var validatedQuantity = quantity(quantity);
        var productReference = new ProductReference(productId);
        return cartStore.update(cart -> {
            if (!cart.hasItem(productReference)) {
                throw new CartItemNotFoundException(productId);
            }
            cart.updateQuantity(productReference, validatedQuantity);
            requireStock(cart, productReference);
        });
    }

    public Cart removeItem(UUID productId) {
        var productReference = new ProductReference(productId);
        return cartStore.update(cart -> {
            if (!cart.hasItem(productReference)) {
                throw new CartItemNotFoundException(productId);
            }
            cart.removeItem(productReference);
        });
    }

    public Cart clear() {
        return cartStore.update(Cart::clear);
    }

    /** Runs inside the Cart update, so a refusal stores nothing. */
    private void requireStock(Cart cart, ProductReference product) {
        var wanted = cart.snapshot().items().stream()
                .filter(item -> item.product().equals(product))
                .mapToInt(item -> item.quantity().value())
                .sum();
        var available = inventory.available(product.value());
        if (wanted > available) {
            throw new OutOfStockException(product.value(), available);
        }
    }

    private static Quantity quantity(Integer value) {
        if (value == null) {
            throw new InvalidCartException("Quantity must not be null");
        }
        return new Quantity(value);
    }
}
