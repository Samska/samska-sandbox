package io.github.samska.sandbox.demo;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DemoController {

    public record ConfigResponse(boolean demo) {
    }

    private final DemoService demo;

    public DemoController(DemoService demo) {
        this.demo = demo;
    }

    @GetMapping("/api/config")
    ConfigResponse config() {
        return new ConfigResponse(demo.enabled());
    }

    /** Administrators only (see the security rules); not found unless demo mode is on. */
    @PostMapping("/api/admin/demo/reset")
    ResponseEntity<Void> reset(HttpServletRequest request) {
        if (!demo.enabled()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        var session = request.getSession(false);
        demo.reset(session == null ? null : session.getId());
        return ResponseEntity.noContent().build();
    }
}
