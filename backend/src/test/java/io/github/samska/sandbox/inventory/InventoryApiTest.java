package io.github.samska.sandbox.inventory;

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

class InventoryApiTest {

    private static EnforcedApplication app;

    @BeforeAll
    static void start() {
        // A short hold, so expiry can be observed in real time.
        app = EnforcedApplication.start("--samska.inventory.reservation-ttl=PT2S");
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

    private static Client customer(String email) throws Exception {
        return app.customer(email);
    }

    private static String product(Client admin, String stockJson) throws Exception {
        var reply = admin.post("/api/products", "{\"name\":\"Stock " + UUID.randomUUID()
                + "\",\"description\":\"Synthetic\",\"price\":10" + stockJson + "}");
        assertThat(reply.status()).as(reply.body()).isEqualTo(201);
        return JsonPath.read(reply.body(), "$.id");
    }

    private static int stockOf(Client client, String id) throws Exception {
        return JsonPath.read(client.get("/api/products/" + id).body(), "$.stock");
    }

    private static int add(Client client, String id, int quantity) throws Exception {
        return client.post("/api/cart/items", "{\"productId\":\"" + id + "\",\"quantity\":" + quantity + "}").status();
    }

    private static UUID approve(Client client, String productId, int quantity) throws Exception {
        var cart = client.post("/api/cart/items", "{\"productId\":\"" + productId + "\",\"quantity\":" + quantity + "}");
        assertThat(cart.status()).as(cart.body()).isEqualTo(200);
        int revision = JsonPath.read(cart.body(), "$.revision");
        var attempt = UUID.randomUUID();
        var reply = client.post("/api/payment-attempts", "{\"attemptId\":\"" + attempt + "\",\"cartRevision\":"
                + revision + ",\"scenario\":\"approve\"}");
        assertThat(reply.status()).as(reply.body()).isEqualTo(201);
        return attempt;
    }

    @Test
    void newProductsStartWithTwentyFiveUnitsUnlessAnotherStockIsGiven() throws Exception {
        var admin = admin();

        assertThat(stockOf(admin, product(admin, ""))).isEqualTo(25);
        assertThat(stockOf(admin, product(admin, ",\"stock\":4"))).isEqualTo(4);
        assertThat(stockOf(admin, product(admin, ",\"stock\":0"))).isZero();
    }

    @Test
    void theAdministratorChangesAndValidatesStock() throws Exception {
        var admin = admin();
        var id = product(admin, ",\"stock\":3");

        var updated = admin.put("/api/products/" + id,
                "{\"name\":\"Renamed\",\"description\":\"x\",\"price\":10,\"stock\":9}");
        assertThat(updated.status()).isEqualTo(200);
        assertThat((Integer) JsonPath.read(updated.body(), "$.stock")).isEqualTo(9);

        var untouched = admin.put("/api/products/" + id, "{\"name\":\"Again\",\"description\":\"x\",\"price\":10}");
        assertThat((Integer) JsonPath.read(untouched.body(), "$.stock")).isEqualTo(9);

        assertThat(admin.put("/api/products/" + id,
                "{\"name\":\"Bad\",\"description\":\"x\",\"price\":10,\"stock\":-1}").status()).isEqualTo(400);
        assertThat(admin.post("/api/products",
                "{\"name\":\"Bad\",\"description\":\"x\",\"price\":10,\"stock\":1000000}").status()).isEqualTo(400);
        assertThat(stockOf(admin, id)).isEqualTo(9);
    }

    @Test
    void listingCarriesTheAvailableUnitsOfEveryProduct() throws Exception {
        var admin = admin();
        var id = product(admin, ",\"stock\":6");

        var list = admin.get("/api/products");

        assertThat((java.util.List<Integer>) JsonPath.read(list.body(), "$[?(@.id=='" + id + "')].stock"))
                .containsExactly(6);
    }

    @Test
    void theCartRefusesMoreThanIsAvailableAndSoldOutProducts() throws Exception {
        var admin = admin();
        var scarce = product(admin, ",\"stock\":2");
        var soldOut = product(admin, ",\"stock\":0");
        var shopper = customer("cart-stock@example.test");

        assertThat(add(shopper, scarce, 3)).isEqualTo(409);
        var refused = shopper.post("/api/cart/items", "{\"productId\":\"" + scarce + "\",\"quantity\":3}");
        assertThat((String) JsonPath.read(refused.body(), "$.code")).isEqualTo("out-of-stock");
        assertThat((Integer) JsonPath.read(refused.body(), "$.available")).isEqualTo(2);
        assertThat(add(shopper, soldOut, 1)).isEqualTo(409);

        assertThat(add(shopper, scarce, 2)).isEqualTo(200);
        assertThat(add(shopper, scarce, 1)).isEqualTo(409);
        assertThat(shopper.send("PATCH", "/api/cart/items/" + scarce, "{\"quantity\":3}").status()).isEqualTo(409);
        assertThat(shopper.send("PATCH", "/api/cart/items/" + scarce, "{\"quantity\":1}").status()).isEqualTo(200);
    }

    @Test
    void anApprovedPaymentHoldsTheUnitsFromOtherCustomersUntilTheHoldExpires() throws Exception {
        var admin = admin();
        var id = product(admin, ",\"stock\":1");
        var first = customer("holder@example.test");
        var second = customer("waiting@example.test");

        approve(first, id, 1);

        assertThat(stockOf(second, id)).isZero();
        assertThat(add(second, id, 1)).isEqualTo(409);

        Thread.sleep(2500);
        assertThat(stockOf(second, id)).isEqualTo(1);
        assertThat(add(second, id, 1)).isEqualTo(200);
    }

    @Test
    void creatingTheOrderConsumesTheUnits() throws Exception {
        var admin = admin();
        var id = product(admin, ",\"stock\":5");
        var shopper = customer("consumer@example.test");
        var attempt = approve(shopper, id, 2);

        assertThat(stockOf(shopper, id)).isEqualTo(3);
        assertThat(shopper.post("/api/orders", "{\"paymentAttemptId\":\"" + attempt + "\"}").status()).isEqualTo(201);

        assertThat(stockOf(shopper, id)).isEqualTo(3);
        // Replaying the request does not take more units.
        assertThat(shopper.post("/api/orders", "{\"paymentAttemptId\":\"" + attempt + "\"}").status()).isEqualTo(200);
        assertThat(stockOf(shopper, id)).isEqualTo(3);
        Thread.sleep(2500);
        assertThat(stockOf(shopper, id)).isEqualTo(3);
    }

    @Test
    void aSecondApprovalForTheLastUnitIsRefusedAndRecordsNothing() throws Exception {
        var admin = admin();
        var id = product(admin, ",\"stock\":1");
        var first = customer("first-unit@example.test");
        var second = customer("second-unit@example.test");
        // Both carts hold the unit before either pays.
        var firstCart = first.post("/api/cart/items", "{\"productId\":\"" + id + "\",\"quantity\":1}");
        var secondCart = second.post("/api/cart/items", "{\"productId\":\"" + id + "\",\"quantity\":1}");
        int firstRevision = JsonPath.read(firstCart.body(), "$.revision");
        int secondRevision = JsonPath.read(secondCart.body(), "$.revision");

        var winner = UUID.randomUUID();
        var loser = UUID.randomUUID();
        assertThat(first.post("/api/payment-attempts", "{\"attemptId\":\"" + winner + "\",\"cartRevision\":"
                + firstRevision + ",\"scenario\":\"approve\"}").status()).isEqualTo(201);
        var refused = second.post("/api/payment-attempts", "{\"attemptId\":\"" + loser + "\",\"cartRevision\":"
                + secondRevision + ",\"scenario\":\"approve\"}");

        assertThat(refused.status()).isEqualTo(409);
        assertThat((String) JsonPath.read(refused.body(), "$.code")).isEqualTo("out-of-stock");
        assertThat(second.get("/api/payment-attempts/" + loser).status()).isEqualTo(404);
        // A decline needs no units and is still recorded.
        assertThat(second.post("/api/payment-attempts", "{\"attemptId\":\"" + UUID.randomUUID()
                + "\",\"cartRevision\":" + secondRevision + ",\"scenario\":\"decline\"}").status()).isEqualTo(201);
    }

    @Test
    void anExpiredHoldWhoseUnitsWereSoldCannotBecomeAnOrder() throws Exception {
        var admin = admin();
        var id = product(admin, ",\"stock\":1");
        var slow = customer("slow@example.test");
        var quick = customer("quick@example.test");

        var slowAttempt = approve(slow, id, 1);
        Thread.sleep(2500);
        var quickAttempt = approve(quick, id, 1);
        assertThat(quick.post("/api/orders", "{\"paymentAttemptId\":\"" + quickAttempt + "\"}").status())
                .isEqualTo(201);

        var late = slow.post("/api/orders", "{\"paymentAttemptId\":\"" + slowAttempt + "\"}");

        assertThat(late.status()).isEqualTo(409);
        assertThat((String) JsonPath.read(late.body(), "$.code")).isEqualTo("out-of-stock");
        assertThat(stockOf(slow, id)).isZero();
    }

    @Test
    void anExpiredHoldIsStillHonouredWhileTheUnitsAreFree() throws Exception {
        var admin = admin();
        var id = product(admin, ",\"stock\":1");
        var patient = customer("patient@example.test");
        var attempt = approve(patient, id, 1);
        Thread.sleep(2500);

        assertThat(patient.post("/api/orders", "{\"paymentAttemptId\":\"" + attempt + "\"}").status()).isEqualTo(201);
        assertThat(stockOf(patient, id)).isZero();
    }

    @Test
    void deletingAProductForgetsItsStock() throws Exception {
        var admin = admin();
        var id = product(admin, ",\"stock\":4");

        assertThat(admin.delete("/api/products/" + id).status()).isEqualTo(204);

        var recreated = admin.get("/api/products/" + id);
        assertThat(recreated.status()).isEqualTo(404);
    }
}
