package io.github.samska.sandbox.payment.storage;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.server.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;

import io.github.samska.sandbox.SamskaSandboxApplication;
import io.github.samska.sandbox.support.PostgresTestDatabase;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentPersistenceRestartTest {

    private static final UUID APPROVED = UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111");
    private static final UUID DECLINED = UUID.fromString("bbbbbbbb-2222-2222-2222-222222222222");
    private static final UUID OTHER = UUID.fromString("cccccccc-3333-3333-3333-333333333333");
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Test
    void servesTheSameAttemptsAndKeepsTheApprovalRuleAfterAnApplicationRestart() throws Exception {
        String toteId;
        String mugId;
        String approved;

        try (var first = startApplication()) {
            var jdbc = first.getBean(JdbcTemplate.class);
            jdbc.execute("TRUNCATE TABLE order_items, order_status_events, orders");
            jdbc.execute("TRUNCATE TABLE payment_attempt_items, payment_attempts");
            jdbc.execute("TRUNCATE TABLE cart_items, cart CASCADE");
            jdbc.execute("TRUNCATE TABLE product_media, products CASCADE");
            var base = baseUri(first);

            toteId = JsonPath.read(send(base, "POST", "/api/products", productBody("Canvas Tote", "12.50"), 201), "$.id");
            mugId = JsonPath.read(send(base, "POST", "/api/products", productBody("Enamel Mug", "8.25"), 201), "$.id");
            send(base, "POST", "/api/cart/items", item(toteId, 2), 200);
            send(base, "POST", "/api/cart/items", item(mugId, 3), 200);

            send(base, "POST", "/api/payment-attempts", attempt(DECLINED, 2, "decline"), 201);
            approved = send(base, "POST", "/api/payment-attempts", attempt(APPROVED, 2, "approve"), 201);
            assertAttempt(approved, "approved", toteId, mugId);
        }

        try (var second = startApplication()) {
            var base = baseUri(second);

            // Products, the Cart and attempts are all durable.
            send(base, "GET", "/api/products/" + toteId, null, 200);
            var reloaded = send(base, "GET", "/api/payment-attempts/" + APPROVED, null, 200);
            assertThat(reloaded).isEqualTo(approved);
            assertAttempt(send(base, "GET", "/api/payment-attempts/" + DECLINED, null, 200), "declined", toteId, mugId);

            // Replay returns 200 with the stored decision; a changed scenario is still a conflict.
            assertThat(send(base, "POST", "/api/payment-attempts", attempt(APPROVED, 2, "approve"), 200))
                    .isEqualTo(approved);
            send(base, "POST", "/api/payment-attempts", attempt(APPROVED, 2, "decline"), 409);

            // The one-approval-per-revision rule survives the restart because the Cart revision does.
            var duplicate = send(base, "POST", "/api/payment-attempts", attempt(OTHER, 2, "approve"), 409);
            assertThat((String) JsonPath.read(duplicate, "$.code")).isEqualTo("already-approved");
            assertThat((String) JsonPath.read(duplicate, "$.attemptId")).isEqualTo(APPROVED.toString());

            // A new Cart revision can be approved, and the approved attempt still creates an Order.
            send(base, "PATCH", "/api/cart/items/" + toteId, "{\"quantity\":1}", 200);
            send(base, "POST", "/api/payment-attempts", attempt(OTHER, 3, "approve"), 201);
            send(base, "POST", "/api/orders", "{\"paymentAttemptId\":\"" + APPROVED + "\"}", 201);

            var jdbc = second.getBean(JdbcTemplate.class);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM payment_attempts", Long.class)).isEqualTo(3);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM payment_attempt_items", Long.class)).isEqualTo(6);
        }
    }

    private static void assertAttempt(String body, String status, String toteId, String mugId) {
        assertThat((String) JsonPath.read(body, "$.status")).isEqualTo(status);
        assertThat(((Number) JsonPath.read(body, "$.cartRevision")).longValue()).isEqualTo(2);
        assertThat(new BigDecimal(JsonPath.read(body, "$.total").toString())).isEqualByComparingTo("49.75");
        List<Map<String, Object>> items = JsonPath.read(body, "$.items");
        assertThat(items).hasSize(2);
        assertThat(items.get(0).get("productId")).isEqualTo(toteId);
        assertThat(items.get(1).get("productId")).isEqualTo(mugId);
        assertThat(new BigDecimal(items.get(1).get("lineSubtotal").toString())).isEqualByComparingTo("24.75");
    }

    private static String attempt(UUID attemptId, long cartRevision, String scenario) {
        return "{\"attemptId\":\"" + attemptId + "\",\"cartRevision\":" + cartRevision
                + ",\"scenario\":\"" + scenario + "\"}";
    }

    private static String item(String productId, int quantity) {
        return "{\"productId\":\"" + productId + "\",\"quantity\":" + quantity + "}";
    }

    private static String productBody(String name, String price) {
        return "{\"name\":\"" + name + "\",\"description\":\"Synthetic test product\",\"price\":" + price + "}";
    }

    private static String send(URI base, String method, String path, String body, int expectedStatus)
            throws Exception {
        var request = HttpRequest.newBuilder(base.resolve(path))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json")
                .method(method, body == null
                        ? HttpRequest.BodyPublishers.noBody()
                        : HttpRequest.BodyPublishers.ofString(body))
                .build();
        var response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode())
                .as("%s %s returned %s: %s", method, path, response.statusCode(), response.body())
                .isEqualTo(expectedStatus);
        return response.body();
    }

    private static URI baseUri(ConfigurableApplicationContext context) {
        var port = ((ServletWebServerApplicationContext) context).getWebServer().getPort();
        return URI.create("http://127.0.0.1:" + port);
    }

    private static ConfigurableApplicationContext startApplication() {
        var container = PostgresTestDatabase.container();

        return new SpringApplicationBuilder(SamskaSandboxApplication.class)
                .web(WebApplicationType.SERVLET)
                .run(
                        "--server.port=0",
                        "--spring.datasource.url=" + container.getJdbcUrl(),
                        "--spring.datasource.username=" + container.getUsername(),
                        "--spring.datasource.password=" + container.getPassword(),
                        "--spring.datasource.hikari.connection-timeout=5000",
                        "--spring.main.banner-mode=off");
    }
}
