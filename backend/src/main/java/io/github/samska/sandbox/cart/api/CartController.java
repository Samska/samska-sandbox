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

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartApplicationService cartApplicationService;

    public CartController(CartApplicationService cartApplicationService) {
        this.cartApplicationService = cartApplicationService;
    }

    @GetMapping
    public CartResponse getCart() {
        return CartResponse.from(cartApplicationService.currentCart());
    }

    @PostMapping("/items")
    public CartResponse addItem(@RequestBody AddCartItemRequest request) {
        return CartResponse.from(cartApplicationService.addItem(request.productId(), request.quantity()));
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
