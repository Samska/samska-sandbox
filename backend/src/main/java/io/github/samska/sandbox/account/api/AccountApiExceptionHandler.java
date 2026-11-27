package io.github.samska.sandbox.account.api;

import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.transaction.TransactionException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import io.github.samska.sandbox.account.application.EmailAlreadyRegisteredException;
import io.github.samska.sandbox.account.application.InvalidAccountException;
import io.github.samska.sandbox.account.application.InvalidCredentialsException;

@RestControllerAdvice(assignableTypes = AuthController.class)
public class AccountApiExceptionHandler {

    @ExceptionHandler(InvalidAccountException.class)
    public ResponseEntity<AccountErrorResponse> handleInvalid(InvalidAccountException exception) {
        return ResponseEntity.badRequest().body(new AccountErrorResponse("invalid-account", exception.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Void> handleUnreadable() {
        return ResponseEntity.badRequest().build();
    }

    @ExceptionHandler(EmailAlreadyRegisteredException.class)
    public ResponseEntity<AccountErrorResponse> handleDuplicate(EmailAlreadyRegisteredException exception) {
        return ResponseEntity.status(409)
                .body(new AccountErrorResponse("email-already-registered", exception.getMessage()));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<AccountErrorResponse> handleCredentials(InvalidCredentialsException exception) {
        return ResponseEntity.status(401)
                .body(new AccountErrorResponse("invalid-credentials", exception.getMessage()));
    }

    @ExceptionHandler({DataAccessResourceFailureException.class, TransactionException.class})
    public ResponseEntity<AccountErrorResponse> handleUnavailable() {
        return ResponseEntity.status(503).body(new AccountErrorResponse("account-store-unavailable", null));
    }
}
