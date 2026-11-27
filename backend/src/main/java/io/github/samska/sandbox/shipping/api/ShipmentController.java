package io.github.samska.sandbox.shipping.api;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.transaction.TransactionException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import io.github.samska.sandbox.order.application.OrderNotFoundException;
import io.github.samska.sandbox.shipping.application.ShipmentService;

@RestController
@RequestMapping("/api/orders")
public class ShipmentController {

    private final ShipmentService shipments;

    public ShipmentController(ShipmentService shipments) {
        this.shipments = shipments;
    }

    @GetMapping
    public List<OrderHistoryResponse> history() {
        return shipments.history().stream().map(OrderHistoryResponse::from).toList();
    }

    @GetMapping("/{orderId}/shipment")
    public ShipmentResponse shipment(@PathVariable UUID orderId) {
        return ShipmentResponse.from(shipments.track(orderId));
    }

    @ExceptionHandler(OrderNotFoundException.class)
    ResponseEntity<Void> notFound() {
        return ResponseEntity.notFound().build();
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<Void> badRequest() {
        return ResponseEntity.badRequest().build();
    }

    @ExceptionHandler({DataAccessResourceFailureException.class, TransactionException.class})
    ResponseEntity<Void> unavailable() {
        return ResponseEntity.status(503).build();
    }
}
