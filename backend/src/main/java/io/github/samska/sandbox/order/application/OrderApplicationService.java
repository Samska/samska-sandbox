package io.github.samska.sandbox.order.application;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import io.github.samska.sandbox.cart.application.CartApplicationService;

import io.github.samska.sandbox.order.Order;
import io.github.samska.sandbox.order.OrderSummary;

@Service
public class OrderApplicationService {

    private static final Logger LOG = LoggerFactory.getLogger(OrderApplicationService.class);

    private final OrderStore store;
    private final CartApplicationService carts;

    public OrderApplicationService(OrderStore store, CartApplicationService carts) {
        this.store = store;
        this.carts = carts;
    }

    public OrderResult create(UUID paymentAttemptId) {
        if (paymentAttemptId == null) {
            throw new IllegalArgumentException("Payment attempt ID is required");
        }
        var result = store.create(paymentAttemptId);
        if (result.created()) {
            emptyCart();
        }
        return result;
    }

    /** The Order is already stored; a failure here must not undo or hide it. */
    private void emptyCart() {
        try {
            carts.clear();
        } catch (RuntimeException failure) {
            LOG.warn("Order created but the Cart could not be emptied", failure);
        }
    }

    public Order getById(UUID orderId) {
        return store.findById(orderId).orElseThrow(OrderNotFoundException::new);
    }

    public Order getByPaymentAttemptId(UUID attemptId) {
        return store.findByPaymentAttemptId(attemptId).orElseThrow(OrderNotFoundException::new);
    }

    public List<OrderSummary> history() {
        return store.listForCurrentAccount();
    }

    public OrderSummary summary(UUID orderId) {
        return store.findSummary(orderId).orElseThrow(OrderNotFoundException::new);
    }
}
