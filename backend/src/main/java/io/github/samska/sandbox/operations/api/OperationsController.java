package io.github.samska.sandbox.operations.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.samska.sandbox.operations.OperationsSnapshot;
import io.github.samska.sandbox.operations.application.OperationsService;

@RestController
@RequestMapping("/api/admin/operations")
public class OperationsController {

    private final OperationsService service;

    public OperationsController(OperationsService service) {
        this.service = service;
    }

    @GetMapping
    OperationsSnapshot operations() {
        return service.snapshot();
    }
}
