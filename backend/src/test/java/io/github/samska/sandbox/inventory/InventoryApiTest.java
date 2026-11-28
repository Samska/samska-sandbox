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

    private static Client customer(String email) throws Exception {
        var client = app.client();
        assertThat(client.post("/api/auth/register",
                "{\"email\":\"" + email + "\",\"displayName\":\"Synthetic\",\"password\":\"correct-horse\"}")
                .status()).isEqualTo(201);
        return client;
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

    private static int place(Client client, String productId, int quantity) throws Exception {
        var cart = client.post("/api/cart/items", "{\"productId\":\"" + productId + "\",\"quantity\":" + quantity + "}");
        assertThat(cart.status()).as(cart.body()).isEqualTo(200);
        int revision = JsonPath.read(cart.body(), "$.revision");
        return placeAtRevision(client, UUID.randomUUID(), revision).status();
    }

    private static EnforcedApplication.Reply placeAtRevision(Client client, UUID requestId, int revision)
            throws Exception {
        return client.post("/api/orders", "{\"requestId\":\"" + requestId + "\",\"cartRevision\":" + revision + "}");
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
    void placingTheOrderTakesTheUnitsAndAReplayTakesNoMore() throws Exception {
        var admin = admin();
        var id = product(admin, ",\"stock\":5");
        var shopper = customer("consumer@example.test");
        var cart = shopper.post("/api/cart/items", "{\"productId\":\"" + id + "\",\"quantity\":2}");
        int revision = JsonPath.read(cart.body(), "$.revision");
        var requestId = UUID.randomUUID();

        assertThat(stockOf(shopper, id)).isEqualTo(5);
        assertThat(placeAtRevision(shopper, requestId, revision).status()).isEqualTo(201);
        assertThat(stockOf(shopper, id)).isEqualTo(3);

        assertThat(placeAtRevision(shopper, requestId, revision).status()).isEqualTo(200);
        assertThat(stockOf(shopper, id)).isEqualTo(3);
    }

    @Test
    void theSecondOrderForTheLastUnitIsRefusedAndRecordsNothing() throws Exception {
        var admin = admin();
        var id = product(admin, ",\"stock\":1");
        var first = customer("first-unit@example.test");
        var second = customer("second-unit@example.test");
        // Both carts hold the unit before either places an Order.
        var firstCart = first.post("/api/cart/items", "{\"productId\":\"" + id + "\",\"quantity\":1}");
        var secondCart = second.post("/api/cart/items", "{\"productId\":\"" + id + "\",\"quantity\":1}");
        int firstRevision = JsonPath.read(firstCart.body(), "$.revision");
        int secondRevision = JsonPath.read(secondCart.body(), "$.revision");

        assertThat(placeAtRevision(first, UUID.randomUUID(), firstRevision).status()).isEqualTo(201);
        var refused = placeAtRevision(second, UUID.randomUUID(), secondRevision);

        assertThat(refused.status()).isEqualTo(409);
        assertThat((String) JsonPath.read(refused.body(), "$.code")).isEqualTo("out-of-stock");
        assertThat((Object) JsonPath.read(second.get("/api/orders").body(), "$")).asList().isEmpty();
        // The refused Cart is untouched, so the customer can adjust it.
        assertThat((Object) JsonPath.read(second.get("/api/cart").body(), "$.items")).asList().hasSize(1);
        assertThat(stockOf(second, id)).isZero();
    }

    @Test
    void aSoldOutProductCannotBeBoughtAgain() throws Exception {
        var admin = admin();
        var id = product(admin, ",\"stock\":1");
        var shopper = customer("last-unit@example.test");

        assertThat(place(shopper, id, 1)).isEqualTo(201);

        assertThat(add(shopper, id, 1)).isEqualTo(409);
        assertThat(stockOf(shopper, id)).isZero();
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
