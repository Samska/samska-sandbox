package io.github.samska.sandbox.order.api;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.samska.sandbox.order.application.OrderApplicationService;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderApplicationService orders;

    public OrderController(OrderApplicationService orders) {
        this.orders = orders;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> create(@RequestBody CreateOrderRequest request) {
        var result = orders.create(request.paymentAttemptId());
        return ResponseEntity.status(result.created() ? HttpStatus.CREATED : HttpStatus.OK)
                .body(OrderResponse.from(result.order()));
    }

    @GetMapping("/payment-attempts/{paymentAttemptId}")
    public OrderResponse byAttempt(@PathVariable UUID paymentAttemptId) {
        return OrderResponse.from(orders.getByPaymentAttemptId(paymentAttemptId));
    }

    @GetMapping("/{orderId}")
    public OrderResponse byId(@PathVariable UUID orderId) {
        return OrderResponse.from(orders.getById(orderId));
    }
}
