package io.github.samska.sandbox.cart.application;

import java.util.UUID;

import org.springframework.stereotype.Service;

import io.github.samska.sandbox.cart.Cart;
import io.github.samska.sandbox.cart.InvalidCartException;
import io.github.samska.sandbox.cart.ProductReference;
import io.github.samska.sandbox.cart.Quantity;
import io.github.samska.sandbox.catalog.application.ProductCatalog;

@Service
public class CartApplicationService {

    private final CartStore cartStore;
    private final ProductCatalog productCatalog;

    public CartApplicationService(CartStore cartStore, ProductCatalog productCatalog) {
        this.cartStore = cartStore;
        this.productCatalog = productCatalog;
    }

    public Cart currentCart() {
        return cartStore.current();
    }

    public Cart addItem(UUID productId, Integer quantity) {
        var validatedQuantity = quantity(quantity);
        var product = productCatalog.findById(productId)
                .orElseThrow(() -> new ProductUnavailableException(productId));
        var cart = cartStore.current();
        cart.addItem(new ProductReference(product.id()), product.name(), product.price(), validatedQuantity);
        return cart;
    }

    public Cart updateQuantity(UUID productId, Integer quantity) {
        var validatedQuantity = quantity(quantity);
        var productReference = new ProductReference(productId);
        var cart = cartStore.current();
        if (!cart.hasItem(productReference)) {
            throw new CartItemNotFoundException(productId);
        }
        cart.updateQuantity(productReference, validatedQuantity);
        return cart;
    }

    public Cart removeItem(UUID productId) {
        var productReference = new ProductReference(productId);
        var cart = cartStore.current();
        if (!cart.hasItem(productReference)) {
            throw new CartItemNotFoundException(productId);
        }
        cart.removeItem(productReference);
        return cart;
    }

    private static Quantity quantity(Integer value) {
        if (value == null) {
            throw new InvalidCartException("Quantity must not be null");
        }
        return new Quantity(value);
    }
}
