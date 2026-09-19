package io.github.samska.sandbox.cart.api;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import io.github.samska.sandbox.cart.InvalidCartException;
import io.github.samska.sandbox.cart.application.CartItemNotFoundException;
import io.github.samska.sandbox.cart.application.ProductUnavailableException;

@RestControllerAdvice(assignableTypes = CartController.class)
public class CartApiExceptionHandler {

    @ExceptionHandler({
            InvalidCartException.class,
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class
    })
    public ResponseEntity<Void> handleBadRequest() {
        return ResponseEntity.badRequest().build();
    }

    @ExceptionHandler({ProductUnavailableException.class, CartItemNotFoundException.class})
    public ResponseEntity<Void> handleNotFound() {
        return ResponseEntity.notFound().build();
    }
}
