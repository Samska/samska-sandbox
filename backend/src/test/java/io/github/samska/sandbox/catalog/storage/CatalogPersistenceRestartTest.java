package io.github.samska.sandbox.catalog.storage;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
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
import io.github.samska.sandbox.catalog.JpegTestImages;
import io.github.samska.sandbox.support.PostgresTestDatabase;

import static org.assertj.core.api.Assertions.assertThat;

class CatalogPersistenceRestartTest {

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Test
    void servesTheSameProductsOrderMediaAndEditsAfterAnApplicationRestart() throws Exception {
        String toteId;
        String mugId;
        String mediaId;
        byte[] servedBytes;

        try (var first = startApplication()) {
            var jdbc = first.getBean(JdbcTemplate.class);
            jdbc.execute("TRUNCATE TABLE order_items, orders");
            jdbc.execute("TRUNCATE TABLE payment_attempt_items, payment_attempts");
            jdbc.execute("TRUNCATE TABLE cart_items, cart CASCADE");
            jdbc.execute("TRUNCATE TABLE product_media, products CASCADE");
            var base = baseUri(first);

            toteId = id(json(base, "POST", "/api/products",
                    "{\"name\":\"Canvas Tote\",\"description\":\"Synthetic\",\"price\":12.50,"
                            + "\"mediaKey\":\"canvas-market-tote\"}", 201));
            mugId = id(json(base, "POST", "/api/products",
                    "{\"name\":\"Enamel Mug\",\"description\":\"Synthetic\",\"price\":8.25}", 201));
            json(base, "PUT", "/api/products/" + mugId,
                    "{\"name\":\"Enamel Mug XL\",\"description\":\"Edited\",\"price\":9.00}", 200);

            var uploaded = upload(base, toteId, JpegTestImages.jpeg(64, 48));
            mediaId = JsonPath.read(uploaded, "$.uploadedMediaId");
            servedBytes = bytes(base, "/api/products/" + toteId + "/media/" + mediaId, 200);
            assertThat(servedBytes).isNotEmpty();
        }

        try (var second = startApplication()) {
            var base = baseUri(second);

            List<Map<String, Object>> products = JsonPath.read(json(base, "GET", "/api/products", null, 200), "$");
            assertThat(products).extracting(product -> product.get("id")).containsExactly(toteId, mugId);
            assertThat(products.get(0).get("mediaKey")).isEqualTo("canvas-market-tote");
            assertThat(products.get(0).get("uploadedMediaId")).isEqualTo(mediaId);
            assertThat(products.get(1).get("name")).isEqualTo("Enamel Mug XL");
            assertThat(products.get(1).get("uploadedMediaId")).isNull();

            assertThat(bytes(base, "/api/products/" + toteId + "/media/" + mediaId, 200)).isEqualTo(servedBytes);

            send(base, "DELETE", "/api/products/" + toteId + "/media", null, null, 204);
            bytes(base, "/api/products/" + toteId + "/media/" + mediaId, 404);
            send(base, "DELETE", "/api/products/" + mugId, null, null, 204);
        }

        try (var third = startApplication()) {
            List<Map<String, Object>> products = JsonPath.read(
                    json(baseUri(third), "GET", "/api/products", null, 200), "$");
            assertThat(products).extracting(product -> product.get("id")).containsExactly(toteId);
            assertThat(products.getFirst().get("uploadedMediaId")).isNull();
        }
    }

    private static String id(String body) {
        return JsonPath.read(body, "$.id");
    }

    private static String upload(URI base, String productId, byte[] jpeg) throws Exception {
        var boundary = "----ss067";
        var body = new ByteArrayOutputStream();
        body.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"a.jpg\"\r\n"
                + "Content-Type: image/jpeg\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        body.write(jpeg);
        body.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        var request = HttpRequest.newBuilder(base.resolve("/api/products/" + productId + "/media"))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .PUT(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray()))
                .build();
        var response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).as(response.body()).isEqualTo(200);
        return response.body();
    }

    private static String json(URI base, String method, String path, String body, int status) throws Exception {
        return new String(send(base, method, path, "application/json", body, status), StandardCharsets.UTF_8);
    }

    private static byte[] bytes(URI base, String path, int status) throws Exception {
        return send(base, "GET", path, null, null, status);
    }

    private static byte[] send(URI base, String method, String path, String contentType, String body, int status)
            throws Exception {
        var builder = HttpRequest.newBuilder(base.resolve(path)).timeout(Duration.ofSeconds(10));
        if (contentType != null) {
            builder.header("Content-Type", contentType);
        }
        var request = builder.method(method, body == null
                ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(body)).build();
        var response = HTTP.send(request, HttpResponse.BodyHandlers.ofByteArray());
        assertThat(response.statusCode())
                .as("%s %s returned %s", method, path, response.statusCode())
                .isEqualTo(status);
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
