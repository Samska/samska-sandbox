package io.github.samska.sandbox.operations;

import java.util.UUID;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.support.EnforcedApplication;
import io.github.samska.sandbox.support.EnforcedApplication.Client;

import static io.github.samska.sandbox.support.EnforcedApplication.ADMIN_EMAIL;
import static io.github.samska.sandbox.support.EnforcedApplication.ADMIN_PASSWORD;
import static org.assertj.core.api.Assertions.assertThat;

class OperationsApiTest {

    private static EnforcedApplication app;

    @BeforeAll
    static void start() {
        app = EnforcedApplication.start();
    }

    @AfterAll
    static void stop() {
        app.close();
    }

    private static Client admin() throws Exception {
        var client = app.client();
        assertThat(client.post("/api/auth/login",
                "{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + ADMIN_PASSWORD + "\"}").status()).isEqualTo(200);
        return client;
    }

    private static Client customer() throws Exception {
        return app.customer("ops-" + UUID.randomUUID() + "@samska.test");
    }

    private static void shop(Client client, String productId) throws Exception {
        var cart = client.post("/api/cart/items", "{\"productId\":\"" + productId + "\",\"quantity\":1}");
        int revision = JsonPath.read(cart.body(), "$.revision");
        var reply = client.post("/api/orders", "{\"requestId\":\"" + UUID.randomUUID()
                + "\",\"cartRevision\":" + revision + "}");
        assertThat(reply.status()).as(reply.body()).isEqualTo(201);
    }

    @Test
    void onlyAdministratorsMayReadOperations() throws Exception {
        assertThat(app.client().get("/api/admin/operations").status()).isEqualTo(401);
        assertThat(customer().get("/api/admin/operations").status()).isEqualTo(403);
        assertThat(admin().get("/api/admin/operations").status()).isEqualTo(200);
    }

    @Test
    void figuresFollowRealOrders() throws Exception {
        var admin = admin();
        var created = admin.post("/api/products",
                "{\"name\":\"Ops " + UUID.randomUUID() + "\",\"description\":\"Synthetic\",\"price\":5,\"stock\":50}");
        String product = JsonPath.read(created.body(), "$.id");
        var before = admin.get("/api/admin/operations").body();
        int ordersBefore = JsonPath.read(before, "$.ordersLastHour");

        var shopper = customer();
        shop(shopper, product);
        var other = customer();
        shop(other, product);

        var after = admin.get("/api/admin/operations").body();
        assertThat((int) JsonPath.read(after, "$.ordersLastHour")).isEqualTo(ordersBefore + 2);
        assertThat((int) JsonPath.read(after, "$.ordersLast24Hours")).isGreaterThanOrEqualTo(ordersBefore + 2);
        assertThat((int) JsonPath.read(after, "$.checkoutSamples")).isGreaterThanOrEqualTo(2);
        assertThat((double) JsonPath.read(after, "$.checkoutP95Millis")).isGreaterThan(0.0);
        assertThat((int) JsonPath.read(after, "$.requests")).isGreaterThan(0);
        double errorRate = JsonPath.read(after, "$.errorRate");
        assertThat(errorRate).isBetween(0.0, 1.0);
        assertThat((Boolean) ((net.minidev.json.JSONArray) JsonPath.read(after,
                "$.services[?(@.name=='Database')].healthy")).get(0)).isTrue();
    }

    @Test
    void everyApiResponseCarriesACorrelationIdAndSafeIncomingIdsAreKept() throws Exception {
        var client = app.client();

        var generated = client.get("/api/products").raw().headers().firstValue("X-Request-Id").orElseThrow();
        assertThat(UUID.fromString(generated)).isNotNull();

        var kept = java.net.http.HttpRequest.newBuilder(
                        java.net.URI.create(baseUri(client) + "/api/products"))
                .header("X-Request-Id", "trace-12345678").GET().build();
        var response = java.net.http.HttpClient.newHttpClient().send(kept, java.net.http.HttpResponse.BodyHandlers.ofString());
        assertThat(response.headers().firstValue("X-Request-Id")).contains("trace-12345678");

        var unsafe = java.net.http.HttpRequest.newBuilder(
                        java.net.URI.create(baseUri(client) + "/api/products"))
                .header("X-Request-Id", "bad id\twith spaces").GET().build();
        var replaced = java.net.http.HttpClient.newHttpClient().send(unsafe, java.net.http.HttpResponse.BodyHandlers.ofString());
        assertThat(replaced.headers().firstValue("X-Request-Id").orElseThrow()).isNotEqualTo("bad id\twith spaces");
    }

    private static String baseUri(Client client) throws Exception {
        var raw = client.get("/api/products").raw();
        var uri = raw.uri();
        return uri.getScheme() + "://" + uri.getAuthority();
    }
}
