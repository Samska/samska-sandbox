package io.github.samska.sandbox.cart.storage;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

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

class CartPersistenceRestartTest {

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Test
    void servesTheSameCartThroughHttpAfterACompleteApplicationRestart() throws Exception {
        String toteId;
        String mugId;

        try (var first = startApplication()) {
            var jdbc = first.getBean(JdbcTemplate.class);
            jdbc.execute("TRUNCATE TABLE order_items, order_status_events, orders");
            jdbc.execute("TRUNCATE TABLE cart_items, cart CASCADE");
            jdbc.execute("TRUNCATE TABLE product_media, products CASCADE");
            var base = baseUri(first);

            toteId = JsonPath.read(send(base, "POST", "/api/products", productBody("Canvas Tote", "12.50"), 201), "$.id");
            mugId = JsonPath.read(send(base, "POST", "/api/products", productBody("Enamel Mug", "8.25"), 201), "$.id");

            send(base, "POST", "/api/cart/items", item(toteId, 2), 200);
            send(base, "POST", "/api/cart/items", item(mugId, 3), 200);
            send(base, "PATCH", "/api/cart/items/" + mugId, "{\"quantity\":4}", 200);
            assertCart(send(base, "GET", "/api/cart", null, 200), toteId, mugId, 3, "58.00");
        }

        try (var second = startApplication()) {
            var base = baseUri(second);

            // Products are durable too, and the Cart line keeps its own name and price snapshot.
            send(base, "GET", "/api/products/" + toteId, null, 200);
            assertCart(send(base, "GET", "/api/cart", null, 200), toteId, mugId, 3, "58.00");

            // The restored revision continues instead of restarting at zero.
            var afterRemoval = send(base, "DELETE", "/api/cart/items/" + toteId, null, 200);
            assertThat(((Number) JsonPath.read(afterRemoval, "$.revision")).longValue()).isEqualTo(4);
            // A Product that is no longer in the Cart can be deleted again.
            send(base, "DELETE", "/api/products/" + toteId, null, 204);
            send(base, "POST", "/api/cart/items", item(toteId, 1), 404);

            var jdbc = second.getBean(JdbcTemplate.class);
            assertThat(jdbc.queryForObject("SELECT revision FROM cart", Long.class)).isEqualTo(4);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM cart_items", Long.class)).isEqualTo(1);
        }

        try (var third = startApplication()) {
            var cart = send(baseUri(third), "GET", "/api/cart", null, 200);
            assertThat(((Number) JsonPath.read(cart, "$.revision")).longValue()).isEqualTo(4);
            List<Map<String, Object>> items = JsonPath.read(cart, "$.items");
            assertThat(items).hasSize(1);
            assertThat(items.getFirst().get("productId")).isEqualTo(mugId);
        }
    }

    private static void assertCart(String body, String toteId, String mugId, long revision, String total) {
        assertThat(((Number) JsonPath.read(body, "$.revision")).longValue()).isEqualTo(revision);
        assertThat(new BigDecimal(JsonPath.read(body, "$.total").toString())).isEqualByComparingTo(total);
        List<Map<String, Object>> items = JsonPath.read(body, "$.items");
        assertThat(items).hasSize(2);
        assertThat(items.get(0).get("productId")).isEqualTo(toteId);
        assertThat(items.get(0).get("name")).isEqualTo("Canvas Tote");
        assertThat(((Number) items.get(0).get("quantity")).intValue()).isEqualTo(2);
        assertThat(new BigDecimal(items.get(0).get("unitPrice").toString())).isEqualByComparingTo("12.50");
        assertThat(items.get(1).get("productId")).isEqualTo(mugId);
        assertThat(((Number) items.get(1).get("quantity")).intValue()).isEqualTo(4);
        assertThat(new BigDecimal(items.get(1).get("lineSubtotal").toString())).isEqualByComparingTo("33.00");
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
