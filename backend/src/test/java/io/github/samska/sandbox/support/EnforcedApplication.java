package io.github.samska.sandbox.support;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.server.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;

import io.github.samska.sandbox.SamskaSandboxApplication;
import io.github.samska.sandbox.account.Role;
import io.github.samska.sandbox.account.application.AccountService;

/** Starts the real application on PostgreSQL with sign-in enforced, and offers cookie-aware clients. */
public final class EnforcedApplication implements AutoCloseable {

    public static final String ADMIN_EMAIL = "admin@samska.test";
    public static final String CUSTOMER_PASSWORD = "correct-horse";
    public static final String ADMIN_PASSWORD = "synthetic-admin-pass";

    private final ConfigurableApplicationContext context;
    private final URI base;

    private EnforcedApplication(ConfigurableApplicationContext context) {
        this.context = context;
        this.base = URI.create("http://127.0.0.1:"
                + ((ServletWebServerApplicationContext) context).getWebServer().getPort());
    }

    public static EnforcedApplication start(String... extraArguments) {
        var container = PostgresTestDatabase.container();
        var arguments = new ArrayList<>(List.of(
                "--server.port=0",
                "--spring.datasource.url=" + container.getJdbcUrl(),
                "--spring.datasource.username=" + container.getUsername(),
                "--spring.datasource.password=" + container.getPassword(),
                "--spring.main.banner-mode=off",
                "--samska.security.enforced=true",
                "--samska.admin.email=" + ADMIN_EMAIL,
                "--samska.admin.password=" + ADMIN_PASSWORD));
        arguments.addAll(Arrays.asList(extraArguments));
        var context = new SpringApplicationBuilder(SamskaSandboxApplication.class)
                .web(WebApplicationType.SERVLET)
                .run(arguments.toArray(String[]::new));
        var app = new EnforcedApplication(context);
        var jdbc = context.getBean(JdbcTemplate.class);
        jdbc.execute("TRUNCATE TABLE order_items, order_status_events, orders");
        jdbc.execute("TRUNCATE TABLE payment_attempt_items, payment_attempts");
        jdbc.execute("TRUNCATE TABLE cart_items, cart CASCADE");
        jdbc.execute("TRUNCATE TABLE product_media, products CASCADE");
        jdbc.execute("DELETE FROM accounts WHERE email <> '" + ADMIN_EMAIL + "'");
        return app;
    }

    public ConfigurableApplicationContext context() {
        return context;
    }

    public Client client() {
        return new Client(base);
    }

    /**
     * A signed-in customer. The application has no sign-up, so the account is created through the service
     * (as an administrator would provision it) and the client then signs in through the real endpoint.
     */
    public Client customer(String email) throws Exception {
        context.getBean(AccountService.class).register(email, "Synthetic", CUSTOMER_PASSWORD, Role.CUSTOMER);
        var client = client();
        var reply = client.post("/api/auth/login",
                "{\"email\":\"" + email + "\",\"password\":\"" + CUSTOMER_PASSWORD + "\"}");
        if (reply.status() != 200) {
            throw new IllegalStateException("Customer sign-in failed: " + reply.status());
        }
        return client;
    }

    @Override
    public void close() {
        context.close();
    }

    public record Reply(int status, String body, HttpResponse<String> raw) {
    }

    /** One browser: its own cookie jar, echoing the XSRF cookie like the single-page application. */
    public static final class Client {

        private final URI base;
        private final CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        private final HttpClient http;

        private Client(URI base) {
            this.base = base;
            this.http = HttpClient.newBuilder().cookieHandler(cookies).connectTimeout(Duration.ofSeconds(5)).build();
        }

        public Reply get(String path) throws Exception {
            return send("GET", path, null, true);
        }

        public Reply post(String path, String json) throws Exception {
            return send("POST", path, json, true);
        }

        public Reply put(String path, String json) throws Exception {
            return send("PUT", path, json, true);
        }

        public Reply delete(String path) throws Exception {
            return send("DELETE", path, null, true);
        }

        public Reply send(String method, String path, String json) throws Exception {
            return send(method, path, json, true);
        }

        /** A state-changing request without the XSRF header, as a forged cross-site request would be. */
        public Reply postWithoutCsrf(String path, String json) throws Exception {
            return send("POST", path, json, false);
        }

        public String cookie(String name) {
            return cookies.getCookieStore().getCookies().stream()
                    .filter(cookie -> cookie.getName().equals(name)).map(java.net.HttpCookie::getValue)
                    .findFirst().orElse(null);
        }

        private Reply send(String method, String path, String json, boolean withCsrf) throws Exception {
            if (cookie("XSRF-TOKEN") == null && !path.equals("/actuator/health")) {
                // Every response carries the cookie; one harmless read primes the jar.
                raw("GET", "/api/auth/me", null, false);
            }
            return raw(method, path, json, withCsrf);
        }

        private Reply raw(String method, String path, String json, boolean withCsrf) throws Exception {
            var builder = HttpRequest.newBuilder(base.resolve(path)).timeout(Duration.ofSeconds(10));
            if (json != null) {
                builder.header("Content-Type", "application/json");
            }
            var token = cookie("XSRF-TOKEN");
            if (withCsrf && token != null) {
                builder.header("X-XSRF-TOKEN", token);
            }
            builder.method(method, json == null
                    ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(json));
            var response = http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            return new Reply(response.statusCode(), response.body(), response);
        }
    }
}
