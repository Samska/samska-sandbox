package io.github.samska.sandbox.security;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.support.EnforcedApplication;

import static org.assertj.core.api.Assertions.assertThat;

class HardeningApiTest {

    private static EnforcedApplication app;

    @BeforeAll
    static void start() {
        app = EnforcedApplication.start(
                "--samska.ratelimit.enabled=true",
                "--samska.ratelimit.auth-per-minute=3",
                "--samska.ratelimit.requests-per-minute=40");
    }

    @AfterAll
    static void stop() {
        app.close();
    }

    private static final String WRONG = "{\"email\":\"nobody@samska.test\",\"password\":\"wrong-password\"}";

    @Test
    void signInIsThrottledPerClientAndAnswersWithRetryAfter() throws Exception {
        var client = app.client();

        for (int i = 0; i < 3; i++) {
            assertThat(client.post("/api/auth/login", WRONG).status()).isEqualTo(401);
        }
        var refused = client.post("/api/auth/login", WRONG);

        assertThat(refused.status()).isEqualTo(429);
        assertThat(refused.body()).contains("rate-limited");
        assertThat(Long.parseLong(refused.raw().headers().firstValue("Retry-After").orElseThrow()))
                .isBetween(1L, 60L);
        // Reads elsewhere are unaffected.
        assertThat(client.get("/api/products").status()).isEqualTo(200);
    }

    @Test
    void theRestOfTheApiHasAGenerousLimitThatStillStopsFlooding() throws Exception {
        var client = app.client();
        int refused = 0;

        for (int i = 0; i < 80; i++) {
            if (client.get("/api/products").status() == 429) {
                refused++;
            }
        }

        assertThat(refused).isPositive();
    }

    @Test
    void apiResponsesCarryHardeningHeaders() throws Exception {
        var raw = app.client().get("/api/auth/me").raw();

        assertThat(raw.headers().firstValue("Content-Security-Policy"))
                .contains("default-src 'none'; frame-ancestors 'none'");
        assertThat(raw.headers().firstValue("X-Content-Type-Options")).contains("nosniff");
        assertThat(raw.headers().firstValue("Referrer-Policy")).contains("no-referrer");
        assertThat(raw.headers().firstValue("Permissions-Policy")).isPresent();
        assertThat(raw.headers().firstValue("X-Frame-Options")).isPresent();
    }
}
