package io.github.samska.sandbox.demo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DemoController {

    public record ConfigResponse(boolean demo) {
    }

    private final boolean demo;

    public DemoController(@Value("${samska.demo.enabled:false}") boolean demo) {
        this.demo = demo;
    }

    @GetMapping("/api/config")
    ConfigResponse config() {
        return new ConfigResponse(demo);
    }
}
