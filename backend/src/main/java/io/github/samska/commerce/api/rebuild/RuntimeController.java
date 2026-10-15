package io.github.samska.commerce.api.rebuild;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rebuild")
public class RuntimeController {

    @GetMapping("/runtime")
    public ResponseEntity<Map<String, String>> runtime() {
        return ResponseEntity.ok(Map.of("runtime", "rebuild-r1"));
    }
}
