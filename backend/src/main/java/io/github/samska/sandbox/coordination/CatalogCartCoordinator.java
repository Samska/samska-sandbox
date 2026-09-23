package io.github.samska.sandbox.coordination;

import java.util.UUID;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.stereotype.Service;

import io.github.samska.sandbox.cart.Cart;
import io.github.samska.sandbox.cart.application.CartApplicationService;
import io.github.samska.sandbox.catalog.ProductId;
import io.github.samska.sandbox.catalog.application.ProductApplicationService;

@Service
public class CatalogCartCoordinator {

    private final CartApplicationService cartApplicationService;
    private final ProductApplicationService productApplicationService;
    private final ReentrantLock lock = new ReentrantLock();

    public CatalogCartCoordinator(
            CartApplicationService cartApplicationService,
            ProductApplicationService productApplicationService) {
        this.cartApplicationService = cartApplicationService;
        this.productApplicationService = productApplicationService;
    }

    public Cart addItem(UUID productId, Integer quantity) {
        lock.lock();
        try {
            return cartApplicationService.addItem(productId, quantity);
        } finally {
            lock.unlock();
        }
    }

    public void deleteProduct(UUID productId) {
        lock.lock();
        try {
            var catalogProductId = new ProductId(productId);
            productApplicationService.getProduct(catalogProductId);
            if (cartApplicationService.currentCartContainsProduct(productId)) {
                throw new ProductInCurrentCartException(productId);
            }
            productApplicationService.deleteProduct(catalogProductId);
        } finally {
            lock.unlock();
        }
    }
}
