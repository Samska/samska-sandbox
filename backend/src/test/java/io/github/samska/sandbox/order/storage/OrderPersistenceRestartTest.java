package io.github.samska.sandbox.order.storage;

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

class OrderPersistenceRestartTest {

    private static final UUID ATTEMPT = UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111");
    private static final UUID UNORDERED_ATTEMPT = UUID.fromString("bbbbbbbb-2222-2222-2222-222222222222");
    private static final long CART_REVISION = 2;
    private static final String TOTAL = "49.75";
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Test
    void servesTheSameMultiItemOrderThroughHttpAfterACompleteApplicationRestart() throws Exception {
        String orderId;
        String firstProductId;
        String secondProductId;
        String created;

        try (var first = startApplication()) {
            first.getBean(JdbcTemplate.class).execute("TRUNCATE TABLE order_items, orders");
            var base = baseUri(first);

            firstProductId = id(post(base, "/api/products", productBody("Canvas Tote", "12.50"), 201));
            secondProductId = id(post(base, "/api/products", productBody("Enamel Mug", "8.25"), 201));

            assertThat(addToCart(base, firstProductId, 2)).isEqualTo(1);
            assertThat(addToCart(base, secondProductId, 3)).isEqualTo(CART_REVISION);

            post(base, "/api/payment-attempts", attemptBody(ATTEMPT, CART_REVISION, "approve"), 201);

            created = post(base, "/api/orders", orderBody(ATTEMPT), 201);
            orderId = read(created, "$.orderId");
            assertOrder(created, orderId, firstProductId, secondProductId);

            // Bump the revision so the second attempt is approved and deliberately left unordered.
            assertThat(addToCart(base, firstProductId, 1)).isEqualTo(CART_REVISION + 1);
            post(base, "/api/payment-attempts", attemptBody(UNORDERED_ATTEMPT, CART_REVISION + 1, "approve"), 201);
        }

        try (var second = startApplication()) {
            var base = baseUri(second);

            // Products, Cart and Payments are process-local and now gone; only the stored Order can answer.
            var byId = get(base, "/api/orders/" + orderId, 200);
            var byAttempt = get(base, "/api/orders/payment-attempts/" + ATTEMPT, 200);
            assertThat(byAttempt).isEqualTo(byId);
            assertOrder(byId, orderId, firstProductId, secondProductId);

            // Replay is served from the stored Order, so it returns 200 and inserts nothing.
            var replay = post(base, "/api/orders", orderBody(ATTEMPT), 200);
            assertThat(read(replay, "$.orderId")).isEqualTo(orderId);
            assertOrder(replay, orderId, firstProductId, secondProductId);

            // This attempt was approved before restart but never ordered: it must stay unknown.
            post(base, "/api/orders", orderBody(UNORDERED_ATTEMPT), 404);
            get(base, "/api/orders/payment-attempts/" + UNORDERED_ATTEMPT, 404);

            var jdbc = second.getBean(JdbcTemplate.class);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM orders", Long.class)).isEqualTo(1);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM order_items", Long.class)).isEqualTo(2);
        }
    }

    private static void assertOrder(
            String body, String orderId, String firstProductId, String secondProductId) {
        assertThat(read(body, "$.orderId")).isEqualTo(orderId);
        assertThat(read(body, "$.paymentAttemptId")).isEqualTo(ATTEMPT.toString());
        assertThat(((Number) JsonPath.read(body, "$.cartRevision")).longValue()).isEqualTo(CART_REVISION);
        assertDecimal(JsonPath.read(body, "$.total"), TOTAL);

        List<Map<String, Object>> items = JsonPath.read(body, "$.items");
        assertThat(items).hasSize(2);
        assertItem(items.get(0), firstProductId, "Canvas Tote", "12.50", 2, "25.00");
        assertItem(items.get(1), secondProductId, "Enamel Mug", "8.25", 3, "24.75");
    }

    private static void assertItem(
            Map<String, Object> item, String productId, String name, String unitPrice,
            int quantity, String lineSubtotal) {
        assertThat(item.get("productId")).isEqualTo(productId);
        assertThat(item.get("name")).isEqualTo(name);
        assertDecimal(item.get("unitPrice"), unitPrice);
        assertThat(((Number) item.get("quantity")).intValue()).isEqualTo(quantity);
        assertDecimal(item.get("lineSubtotal"), lineSubtotal);
    }

    private static void assertDecimal(Object value, String expected) {
        assertThat(new BigDecimal(value.toString())).isEqualByComparingTo(expected);
    }

    private static String id(String body) {
        return read(body, "$.id");
    }

    private static String read(String body, String path) {
        return JsonPath.read(body, path);
    }

    private static long addToCart(URI base, String productId, int quantity) throws Exception {
        var body = post(base, "/api/cart/items",
                "{\"productId\":\"" + productId + "\",\"quantity\":" + quantity + "}", 200);
        return ((Number) JsonPath.read(body, "$.revision")).longValue();
    }

    private static String productBody(String name, String price) {
        return "{\"name\":\"" + name + "\",\"description\":\"Synthetic test product\",\"price\":" + price + "}";
    }

    private static String attemptBody(UUID attemptId, long cartRevision, String scenario) {
        return "{\"attemptId\":\"" + attemptId + "\",\"cartRevision\":" + cartRevision
                + ",\"scenario\":\"" + scenario + "\"}";
    }

    private static String orderBody(UUID attemptId) {
        return "{\"paymentAttemptId\":\"" + attemptId + "\"}";
    }

    private static String post(URI base, String path, String body, int expectedStatus) throws Exception {
        return exchange(base, "POST", path, body, expectedStatus);
    }

    private static String get(URI base, String path, int expectedStatus) throws Exception {
        return exchange(base, "GET", path, null, expectedStatus);
    }

    private static String exchange(URI base, String method, String path, String body, int expectedStatus)
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
