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

    @BeforeAll
    static void start() {
        freshOrders = EnforcedApplication.start();
    }

    @AfterAll
    static void stop() {
        freshOrders.close();
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

    /** Adds the Product, approves a payment and creates the Order; returns its ID. */
    private static String order(Client client, String productId, int quantity) throws Exception {
        var cart = client.post("/api/cart/items", "{\"productId\":\"" + productId + "\",\"quantity\":" + quantity + "}");
        int revision = JsonPath.read(cart.body(), "$.revision");
        var attempt = UUID.randomUUID();
        assertThat(client.post("/api/payment-attempts", "{\"attemptId\":\"" + attempt + "\",\"cartRevision\":"
                + revision + ",\"scenario\":\"approve\"}").status()).isEqualTo(201);
        var created = client.post("/api/orders", "{\"paymentAttemptId\":\"" + attempt + "\"}");
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
        assertThat((String) JsonPath.read(history.body(), "$[0].status")).isEqualTo("PLACED");

        var shipment = client.get("/api/orders/" + second + "/shipment");
        assertThat(shipment.status()).isEqualTo(200);
        assertThat((String) JsonPath.read(shipment.body(), "$.status")).isEqualTo("PLACED");
        assertThat(shipment.body()).doesNotContain("courier").doesNotContain("trackingCode");
        assertThat((java.util.List<String>) JsonPath.read(shipment.body(), "$.steps[*].code"))
                .containsExactly("PLACED", "PACKED", "SHIPPED", "DELIVERED");
        assertThat((java.util.List<Boolean>) JsonPath.read(shipment.body(), "$.steps[*].done"))
                .containsExactly(true, false, false, false);
    }

    private static Client admin(EnforcedApplication app) throws Exception {
        var admin = app.client();
        assertThat(admin.post("/api/auth/login",
                "{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + ADMIN_PASSWORD + "\"}").status()).isEqualTo(200);
        return admin;
    }

    private static int stockOf(Client client, String productId) throws Exception {
        return JsonPath.read(client.get("/api/products/" + productId).body(), "$.stock");
    }

    private static int setStatus(Client admin, String orderId, String status) throws Exception {
        return admin.put("/api/admin/orders/" + orderId + "/status", "{\"status\":\"" + status + "\"}").status();
    }

    @Test
    void theAdministratorMovesAnOrderAndTheCustomerSeesTheRealTimeline() throws Exception {
        var product = product(freshOrders, "Moving Mug", "8.00");
        var client = customer(freshOrders, "moving@example.test");
        var id = order(client, product, 1);
        var admin = admin(freshOrders);

        assertThat(setStatus(admin, id, "PACKED")).isEqualTo(200);
        assertThat(setStatus(admin, id, "SHIPPED")).isEqualTo(200);

        var shipment = client.get("/api/orders/" + id + "/shipment");
        assertThat((String) JsonPath.read(shipment.body(), "$.status")).isEqualTo("SHIPPED");
        assertThat((java.util.List<String>) JsonPath.read(shipment.body(), "$.steps[*].code"))
                .containsExactly("PLACED", "PACKED", "SHIPPED", "DELIVERED");
        assertThat((java.util.List<Boolean>) JsonPath.read(shipment.body(), "$.steps[*].done"))
                .containsExactly(true, true, true, false);
        assertThat((Object) JsonPath.read(shipment.body(), "$.steps[3].at")).isNull();
        assertThat((String) JsonPath.read(client.get("/api/orders").body(), "$[0].status")).isEqualTo("SHIPPED");

        assertThat(setStatus(admin, id, "DELIVERED")).isEqualTo(200);
        assertThat((String) JsonPath.read(client.get("/api/orders/" + id + "/shipment").body(), "$.status"))
                .isEqualTo("DELIVERED");
    }

    @Test
    void anAdministratorCanCorrectAStatusButNotRepeatItOrChangeACancelledOrder() throws Exception {
        var product = product(freshOrders, "Corrected Mug", "8.00");
        var id = order(customer(freshOrders, "corrected@example.test"), product, 1);
        var admin = admin(freshOrders);

        assertThat(setStatus(admin, id, "SHIPPED")).isEqualTo(200);
        assertThat(setStatus(admin, id, "SHIPPED")).isEqualTo(409);
        assertThat(setStatus(admin, id, "PACKED")).isEqualTo(200);
        assertThat(setStatus(admin, id, "CANCELLED")).isEqualTo(200);
        assertThat(setStatus(admin, id, "PACKED")).isEqualTo(409);
        assertThat(setStatus(admin, id, "NOT_A_STATUS")).isEqualTo(400);
        assertThat(setStatus(admin, UUID.randomUUID().toString(), "PACKED")).isEqualTo(404);
        assertThat(admin.put("/api/admin/orders/" + id + "/status", "{}").status()).isEqualTo(400);
    }

    @Test
    void cancellingReturnsTheUnitsToStockOnce() throws Exception {
        var admin = admin(freshOrders);
        var reply = admin.post("/api/products",
                "{\"name\":\"Stocked Mug\",\"description\":\"Synthetic\",\"price\":5,\"stock\":10}");
        String product = JsonPath.read(reply.body(), "$.id");
        var buyer = customer(freshOrders, "stocked@example.test");
        var id = order(buyer, product, 3);
        assertThat(stockOf(admin, product)).isEqualTo(7);

        assertThat(setStatus(admin, id, "CANCELLED")).isEqualTo(200);
        assertThat(stockOf(admin, product)).isEqualTo(10);

        assertThat(setStatus(admin, id, "CANCELLED")).isEqualTo(409);
        assertThat(stockOf(admin, product)).isEqualTo(10);
        var customerView = buyer.get("/api/orders/" + id + "/shipment");
        assertThat((String) JsonPath.read(customerView.body(), "$.status")).isEqualTo("CANCELLED");
        assertThat((java.util.List<String>) JsonPath.read(customerView.body(), "$.steps[*].code"))
                .containsExactly("PLACED", "CANCELLED");
    }

    @Test
    void theAdministratorListsEveryOrderAndFiltersByStatus() throws Exception {
        var product = product(freshOrders, "Listed Mug", "6.00");
        var placed = order(customer(freshOrders, "listed-a@example.test"), product, 2);
        var packed = order(customer(freshOrders, "listed-b@example.test"), product, 1);
        var admin = admin(freshOrders);
        assertThat(setStatus(admin, packed, "PACKED")).isEqualTo(200);

        var all = admin.get("/api/admin/orders");
        assertThat(all.status()).isEqualTo(200);
        assertThat((java.util.List<String>) JsonPath.read(all.body(), "$[*].orderId")).contains(placed, packed);
        assertThat((java.util.List<String>) JsonPath.read(all.body(), "$[?(@.orderId=='" + placed + "')].customerEmail"))
                .containsExactly("listed-a@example.test");
        assertThat((java.util.List<Object>) JsonPath.read(all.body(), "$[?(@.orderId=='" + placed + "')].lines[0].name"))
                .containsExactly("Listed Mug");

        var onlyPacked = admin.get("/api/admin/orders?status=PACKED");
        assertThat((java.util.List<String>) JsonPath.read(onlyPacked.body(), "$[*].status")).containsOnly("PACKED");
        assertThat((java.util.List<String>) JsonPath.read(onlyPacked.body(), "$[*].orderId"))
                .contains(packed).doesNotContain(placed);
        assertThat(admin.get("/api/admin/orders?status=NOPE").status()).isEqualTo(400);
    }

    @Test
    void onlyAnAdministratorCanListOrdersOrChangeTheirStatus() throws Exception {
        var product = product(freshOrders, "Guarded Mug", "6.00");
        var owner = customer(freshOrders, "guarded@example.test");
        var id = order(owner, product, 1);

        assertThat(owner.get("/api/admin/orders").status()).isEqualTo(403);
        assertThat(setStatus(owner, id, "DELIVERED")).isEqualTo(403);
        assertThat(freshOrders.client().get("/api/admin/orders").status()).isEqualTo(401);
        assertThat((String) JsonPath.read(owner.get("/api/orders/" + id + "/shipment").body(), "$.status"))
                .isEqualTo("PLACED");
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
