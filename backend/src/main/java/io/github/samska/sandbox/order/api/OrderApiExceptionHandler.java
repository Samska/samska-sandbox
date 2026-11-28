package io.github.samska.sandbox.order.api;

import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.transaction.TransactionException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import io.github.samska.sandbox.cart.CartRevisionMismatchException;
import io.github.samska.sandbox.order.application.OrderNotFoundException;
import io.github.samska.sandbox.order.application.OrderOutOfStockException;

@RestControllerAdvice(assignableTypes = OrderController.class)
public class OrderApiExceptionHandler {

    @ExceptionHandler({IllegalArgumentException.class, HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Void> badRequest() {
        return ResponseEntity.badRequest().build();
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<Void> notFound() {
        return ResponseEntity.notFound().build();
    }

    @ExceptionHandler(CartRevisionMismatchException.class)
    public ResponseEntity<ErrorResponse> cartChanged() {
        return ResponseEntity.status(409).body(new ErrorResponse("cart-changed"));
    }

    @ExceptionHandler(OrderOutOfStockException.class)
    public ResponseEntity<ErrorResponse> outOfStock() {
        return ResponseEntity.status(409).body(new ErrorResponse("out-of-stock"));
    }

    @ExceptionHandler({DataAccessResourceFailureException.class, TransactionException.class})
    public ResponseEntity<ErrorResponse> unavailable() {
        return ResponseEntity.status(503).body(new ErrorResponse("order-store-unavailable"));
    }

    public record ErrorResponse(String code) {
    }
}
