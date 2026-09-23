package io.github.samska.sandbox.cart.api;

import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.samska.sandbox.cart.application.CartApplicationService;
import io.github.samska.sandbox.coordination.CatalogCartCoordinator;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartApplicationService cartApplicationService;
    private final CatalogCartCoordinator catalogCartCoordinator;

    public CartController(
            CartApplicationService cartApplicationService,
            CatalogCartCoordinator catalogCartCoordinator) {
        this.cartApplicationService = cartApplicationService;
        this.catalogCartCoordinator = catalogCartCoordinator;
    }

    @GetMapping
    public CartResponse getCart() {
        return CartResponse.from(cartApplicationService.currentCart());
    }

    @PostMapping("/items")
    public CartResponse addItem(@RequestBody AddCartItemRequest request) {
        return CartResponse.from(catalogCartCoordinator.addItem(request.productId(), request.quantity()));
    }

    @PatchMapping("/items/{productId}")
    public CartResponse updateQuantity(
            @PathVariable UUID productId,
            @RequestBody UpdateCartItemRequest request) {
        return CartResponse.from(cartApplicationService.updateQuantity(productId, request.quantity()));
    }

    @DeleteMapping("/items/{productId}")
    public CartResponse removeItem(@PathVariable UUID productId) {
        return CartResponse.from(cartApplicationService.removeItem(productId));
    }
}
