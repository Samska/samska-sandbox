package io.github.samska.sandbox.shipping;

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

class OrderTrackingApiTest {

    private static EnforcedApplication freshOrders;
    private static EnforcedApplication delivered;

    @BeforeAll
    static void start() {
        freshOrders = EnforcedApplication.start();
        // Every step at once and no delay: an Order is delivered the moment it exists.
        delivered = EnforcedApplication.start(
                "--samska.shipping.packed-after=PT0S", "--samska.shipping.left-warehouse-after=PT0S",
                "--samska.shipping.out-for-delivery-after=PT0S", "--samska.shipping.delivered-after=PT0S",
                "--samska.shipping.delay=PT0S");
    }

    @AfterAll
    static void stop() {
        freshOrders.close();
        delivered.close();
    }

    private static Client customer(EnforcedApplication app, String email) throws Exception {
        return app.customer(email);
    }

    private static String product(EnforcedApplication app, String name, String price) throws Exception {
        var admin = app.client();
        assertThat(admin.post("/api/auth/login",
                "{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + ADMIN_PASSWORD + "\"}").status()).isEqualTo(200);
        var reply = admin.post("/api/products",
                "{\"name\":\"" + name + "\",\"description\":\"Synthetic\",\"price\":" + price + "}");
        return JsonPath.read(reply.body(), "$.id");
    }

    /** Adds the Product and places the Order; returns its ID. */
    private static String order(Client client, String productId, int quantity) throws Exception {
        var cart = client.post("/api/cart/items", "{\"productId\":\"" + productId + "\",\"quantity\":" + quantity + "}");
        int revision = JsonPath.read(cart.body(), "$.revision");
        var created = client.post("/api/orders", "{\"requestId\":\"" + UUID.randomUUID()
                + "\",\"cartRevision\":" + revision + "}");
        assertThat(created.status()).isEqualTo(201);
        return JsonPath.read(created.body(), "$.orderId");
    }

    @Test
    void anAccountWithNoOrdersHasAnEmptyHistory() throws Exception {
        var client = customer(freshOrders, "empty-history@example.test");

        var reply = client.get("/api/orders");

        assertThat(reply.status()).isEqualTo(200);
        assertThat(reply.body()).isEqualTo("[]");
    }

    @Test
    void listsOwnOrdersNewestFirstAndTracksANewShipment() throws Exception {
        var product = product(freshOrders, "Tracked Mug", "10.00");
        var client = customer(freshOrders, "history@example.test");
        var first = order(client, product, 1);
        client.delete("/api/cart/items/" + product);
        var second = order(client, product, 3);

        var history = client.get("/api/orders");
        assertThat(history.status()).isEqualTo(200);
        assertThat((java.util.List<String>) JsonPath.read(history.body(), "$[*].orderId"))
                .containsExactly(second, first);
        assertThat((Integer) JsonPath.read(history.body(), "$[0].itemCount")).isEqualTo(1);
        assertThat(((Number) JsonPath.read(history.body(), "$[0].total")).doubleValue()).isEqualTo(30.0);
        assertThat((String) JsonPath.read(history.body(), "$[0].orderNumber")).matches("SK-\\d{6}");
        assertThat((String) JsonPath.read(history.body(), "$[0].status")).isEqualTo("PROCESSING");

        var shipment = client.get("/api/orders/" + second + "/shipment");
        assertThat(shipment.status()).isEqualTo(200);
        assertThat((String) JsonPath.read(shipment.body(), "$.status")).isEqualTo("PROCESSING");
        assertThat((String) JsonPath.read(shipment.body(), "$.courier")).isEqualTo("Simulated Express");
        assertThat((String) JsonPath.read(shipment.body(), "$.trackingCode")).startsWith("SK-");
        assertThat((java.util.List<String>) JsonPath.read(shipment.body(), "$.steps[*].code")).containsExactly(
                "ORDER_CREATED", "PACKED", "LEFT_WAREHOUSE", "OUT_FOR_DELIVERY", "DELIVERED");
        assertThat((Boolean) JsonPath.read(shipment.body(), "$.steps[0].done")).isTrue();
        assertThat((Boolean) JsonPath.read(shipment.body(), "$.steps[4].done")).isFalse();
    }

    @Test
    void reportsDeliveredWhenEveryStepHasPassed() throws Exception {
        var product = product(delivered, "Delivered Mug", "5.00");
        var client = customer(delivered, "delivered@example.test");
        var id = order(client, product, 2);

        var shipment = client.get("/api/orders/" + id + "/shipment");

        assertThat((String) JsonPath.read(shipment.body(), "$.status")).isEqualTo("DELIVERED");
        assertThat((java.util.List<Boolean>) JsonPath.read(shipment.body(), "$.steps[*].done"))
                .containsOnly(true);
        assertThat((String) JsonPath.read(client.get("/api/orders").body(), "$[0].status")).isEqualTo("DELIVERED");
    }

    @Test
    void otherAccountsAndVisitorsCannotSeeAnOrderOrItsShipment() throws Exception {
        var product = product(freshOrders, "Private Mug", "4.00");
        var owner = customer(freshOrders, "owner@example.test");
        var id = order(owner, product, 1);
        var stranger = customer(freshOrders, "stranger@example.test");

        assertThat(stranger.get("/api/orders/" + id + "/shipment").status()).isEqualTo(404);
        assertThat(stranger.get("/api/orders").body()).isEqualTo("[]");
        assertThat(freshOrders.client().get("/api/orders").status()).isEqualTo(401);
        assertThat(freshOrders.client().get("/api/orders/" + id + "/shipment").status()).isEqualTo(401);
        assertThat(owner.get("/api/orders/" + UUID.randomUUID() + "/shipment").status()).isEqualTo(404);
        assertThat(owner.get("/api/orders/not-a-uuid/shipment").status()).isEqualTo(400);
    }
}
