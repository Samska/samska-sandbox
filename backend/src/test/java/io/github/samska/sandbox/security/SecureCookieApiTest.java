package io.github.samska.sandbox.security;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.support.EnforcedApplication;

import static org.assertj.core.api.Assertions.assertThat;

class SecureCookieApiTest {

    private static EnforcedApplication app;

    @BeforeAll
    static void start() {
        app = EnforcedApplication.start("--samska.security.secure-cookies=true");
    }

    @AfterAll
    static void stop() {
        app.close();
    }

    @Test
    void theXsrfCookieIsMarkedSecureWhenSecureCookiesAreOn() throws Exception {
        var raw = app.client().get("/api/auth/me").raw();

        assertThat(raw.headers().allValues("Set-Cookie")).anySatisfy(cookie -> {
            assertThat(cookie).startsWith("XSRF-TOKEN=");
            assertThat(cookie).contains("Secure");
        });
    }
}
