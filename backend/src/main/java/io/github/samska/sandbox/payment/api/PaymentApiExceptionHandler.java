package io.github.samska.sandbox.payment.api;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import io.github.samska.sandbox.cart.CartRevisionMismatchException;
import io.github.samska.sandbox.payment.InvalidPaymentAttemptException;
import io.github.samska.sandbox.payment.application.PaymentAlreadyApprovedException;
import io.github.samska.sandbox.payment.application.PaymentAttemptConflictException;
import io.github.samska.sandbox.payment.application.PaymentAttemptNotFoundException;
import io.github.samska.sandbox.payment.application.PaymentCapacityExceededException;

@RestControllerAdvice(assignableTypes = PaymentController.class)
public class PaymentApiExceptionHandler {

    @ExceptionHandler({
            InvalidPaymentAttemptException.class,
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class
    })
    public ResponseEntity<Void> handleBadRequest() {
        return ResponseEntity.badRequest().build();
    }

    @ExceptionHandler(PaymentAttemptNotFoundException.class)
    public ResponseEntity<Void> handleNotFound() {
        return ResponseEntity.notFound().build();
    }

    @ExceptionHandler(CartRevisionMismatchException.class)
    public ResponseEntity<PaymentErrorResponse> handleCartRevisionMismatch() {
        return ResponseEntity.status(409).body(PaymentErrorResponse.cartChanged());
    }

    @ExceptionHandler(PaymentAttemptConflictException.class)
    public ResponseEntity<PaymentErrorResponse> handleAttemptConflict() {
        return ResponseEntity.status(409).body(PaymentErrorResponse.attemptIdConflict());
    }

    @ExceptionHandler(PaymentAlreadyApprovedException.class)
    public ResponseEntity<PaymentErrorResponse> handleAlreadyApproved(PaymentAlreadyApprovedException exception) {
        return ResponseEntity.status(409).body(PaymentErrorResponse.alreadyApproved(exception.existingAttemptId()));
    }

    @ExceptionHandler(PaymentCapacityExceededException.class)
    public ResponseEntity<PaymentErrorResponse> handleCapacityExceeded() {
        return ResponseEntity.status(503).body(PaymentErrorResponse.capacityExceeded());
    }
}
