package io.github.samska.sandbox.catalog.api;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import io.github.samska.sandbox.catalog.InvalidProductException;
import io.github.samska.sandbox.catalog.application.InvalidMediaException;
import io.github.samska.sandbox.catalog.application.MediaCapacityExceededException;
import io.github.samska.sandbox.catalog.application.MediaNotFoundException;
import io.github.samska.sandbox.catalog.application.MediaTooLargeException;
import io.github.samska.sandbox.catalog.application.ProductNotFoundException;
import io.github.samska.sandbox.catalog.application.UnsupportedMediaTypeException;
import io.github.samska.sandbox.coordination.ProductInCurrentCartException;

@RestControllerAdvice(assignableTypes = ProductController.class)
public class ProductApiExceptionHandler {

    @ExceptionHandler({
            InvalidProductException.class,
            InvalidMediaException.class,
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestPartException.class,
            MissingServletRequestParameterException.class,
            MultipartException.class
    })
    public ResponseEntity<Void> handleBadRequest() {
        return ResponseEntity.badRequest().build();
    }

    @ExceptionHandler({ ProductNotFoundException.class, MediaNotFoundException.class })
    public ResponseEntity<Void> handleNotFound() {
        return ResponseEntity.notFound().build();
    }

    @ExceptionHandler(ProductInCurrentCartException.class)
    public ResponseEntity<Void> handleConflict() {
        return ResponseEntity.status(409).build();
    }

    @ExceptionHandler({ MediaTooLargeException.class, MaxUploadSizeExceededException.class })
    public ResponseEntity<MediaErrorResponse> handlePayloadTooLarge() {
        return ResponseEntity.status(413).body(MediaErrorResponse.limitExceeded());
    }

    @ExceptionHandler(MediaCapacityExceededException.class)
    public ResponseEntity<MediaErrorResponse> handleMediaCapacityExceeded() {
        return ResponseEntity.status(413).body(MediaErrorResponse.storageCapacityExceeded());
    }

    @ExceptionHandler(UnsupportedMediaTypeException.class)
    public ResponseEntity<Void> handleUnsupportedMediaType() {
        return ResponseEntity.status(415).build();
    }
}
