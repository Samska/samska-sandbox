package io.github.samska.sandbox.payment.api;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.samska.sandbox.payment.application.PaymentApplicationService;

@RestController
@RequestMapping("/api/payment-attempts")
public class PaymentController {

    private final PaymentApplicationService paymentApplicationService;

    public PaymentController(PaymentApplicationService paymentApplicationService) {
        this.paymentApplicationService = paymentApplicationService;
    }

    @PostMapping
    public ResponseEntity<PaymentAttemptResponse> initiateAttempt(
            @RequestBody InitiatePaymentAttemptRequest request) {
        var result = paymentApplicationService.initiateAttempt(
                request.attemptId(), request.cartRevision(), request.scenario());

        return ResponseEntity
                .status(result.created() ? HttpStatus.CREATED : HttpStatus.OK)
                .body(PaymentAttemptResponse.from(result.attempt()));
    }

    @GetMapping("/{attemptId}")
    public PaymentAttemptResponse getAttempt(@PathVariable UUID attemptId) {
        return PaymentAttemptResponse.from(paymentApplicationService.getAttempt(attemptId));
    }
}
