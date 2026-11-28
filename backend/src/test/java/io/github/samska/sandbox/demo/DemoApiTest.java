package io.github.samska.sandbox.demo;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.support.EnforcedApplication;

import static io.github.samska.sandbox.support.EnforcedApplication.ADMIN_EMAIL;
import static io.github.samska.sandbox.support.EnforcedApplication.ADMIN_PASSWORD;
import static org.assertj.core.api.Assertions.assertThat;

class DemoApiTest {

    @Test
    void configReportsTheDemoFlagAndNoResetEndpointExists() throws Exception {
        try (var app = EnforcedApplication.start()) {
            var config = app.client().get("/api/config");

            assertThat(config.status()).isEqualTo(200);
            assertThat((Boolean) JsonPath.read(config.body(), "$.demo")).isFalse();

            var admin = app.client();
            assertThat(admin.post("/api/auth/login",
                    "{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + ADMIN_PASSWORD + "\"}").status())
                    .isEqualTo(200);
            // The reset was removed in SS-094: not even an administrator can wipe data over HTTP.
            assertThat(admin.post("/api/admin/demo/reset", null).status()).isEqualTo(404);
        }
        try (var app = EnforcedApplication.start("--samska.demo.enabled=true")) {
            assertThat((Boolean) JsonPath.read(app.client().get("/api/config").body(), "$.demo")).isTrue();
        }
    }
}
