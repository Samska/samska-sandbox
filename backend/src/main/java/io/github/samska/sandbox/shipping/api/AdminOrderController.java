package io.github.samska.sandbox.shipping.api;

import java.util.List;
import java.util.UUID;

import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.TransactionException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import io.github.samska.sandbox.order.application.OrderNotFoundException;
import io.github.samska.sandbox.shipping.OrderStatus;
import io.github.samska.sandbox.shipping.application.InvalidStatusChangeException;
import io.github.samska.sandbox.shipping.application.ShipmentService;

/** Administrator only: {@code /api/admin/**} requires the ADMIN role. */
@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    public record ChangeStatusRequest(OrderStatus status) {
    }

    private final ShipmentService shipments;

    public AdminOrderController(ShipmentService shipments) {
        this.shipments = shipments;
    }

    @GetMapping
    public List<AdminOrderResponse> list(@RequestParam(required = false) OrderStatus status) {
        return shipments.listAll(status).stream().map(AdminOrderResponse::from).toList();
    }

    @PutMapping("/{orderId}/status")
    public AdminOrderResponse change(@PathVariable UUID orderId, @RequestBody ChangeStatusRequest request) {
        return AdminOrderResponse.from(shipments.changeStatus(orderId, request == null ? null : request.status()));
    }

    @ExceptionHandler(OrderNotFoundException.class)
    ResponseEntity<Void> notFound() {
        return ResponseEntity.notFound().build();
    }

    @ExceptionHandler(InvalidStatusChangeException.class)
    ResponseEntity<Void> conflict() {
        return ResponseEntity.status(409).build();
    }

    @ExceptionHandler({IllegalArgumentException.class, MethodArgumentTypeMismatchException.class,
            org.springframework.http.converter.HttpMessageNotReadableException.class})
    ResponseEntity<Void> badRequest() {
        return ResponseEntity.badRequest().build();
    }

    @ExceptionHandler({DataAccessResourceFailureException.class, TransactionException.class})
    ResponseEntity<Void> unavailable() {
        return ResponseEntity.status(503).build();
    }
}
