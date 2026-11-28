package io.github.samska.sandbox.demo;

import java.util.UUID;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.support.EnforcedApplication;
import io.github.samska.sandbox.support.EnforcedApplication.Client;

import static io.github.samska.sandbox.support.EnforcedApplication.ADMIN_EMAIL;
import static io.github.samska.sandbox.support.EnforcedApplication.ADMIN_PASSWORD;
import static org.assertj.core.api.Assertions.assertThat;

class DemoApiTest {

    private static Client admin(EnforcedApplication app) throws Exception {
        var client = app.client();
        assertThat(client.post("/api/auth/login",
                "{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + ADMIN_PASSWORD + "\"}").status()).isEqualTo(200);
        return client;
    }

    private static Client customer(EnforcedApplication app, String email) throws Exception {
        var client = app.client();
        assertThat(client.post("/api/auth/register",
                "{\"email\":\"" + email + "\",\"displayName\":\"Synthetic\",\"password\":\"correct-horse\"}")
                .status()).isEqualTo(201);
        return client;
    }

    @Test
    void demoModeIsOffByDefaultAndTheResetDoesNotExist() throws Exception {
        try (var app = EnforcedApplication.start()) {
            var config = app.client().get("/api/config");

            assertThat(config.status()).isEqualTo(200);
            assertThat((Boolean) JsonPath.read(config.body(), "$.demo")).isFalse();
            assertThat(admin(app).post("/api/admin/demo/reset", null).status()).isEqualTo(404);
        }
    }

    @Test
    void anAdministratorResetsSyntheticDataAndOthersAreSignedOut() throws Exception {
        try (var app = EnforcedApplication.start("--samska.demo.enabled=true")) {
            var admin = admin(app);
            assertThat((Boolean) JsonPath.read(app.client().get("/api/config").body(), "$.demo")).isTrue();
            var created = admin.post("/api/products",
                    "{\"name\":\"Demo " + UUID.randomUUID() + "\",\"description\":\"Synthetic\",\"price\":5,\"stock\":7}");
            String product = JsonPath.read(created.body(), "$.id");
            var shopper = customer(app, "demo-shopper@samska.test");
            var cart = shopper.post("/api/cart/items", "{\"productId\":\"" + product + "\",\"quantity\":2}");
            int revision = JsonPath.read(cart.body(), "$.revision");
            assertThat(shopper.post("/api/orders", "{\"requestId\":\"" + UUID.randomUUID()
                    + "\",\"cartRevision\":" + revision + "}").status()).isEqualTo(201);
            assertThat((int) JsonPath.read(admin.get("/api/products/" + product).body(), "$.stock")).isEqualTo(5);

            assertThat(customer(app, "other@samska.test").post("/api/admin/demo/reset", null).status())
                    .isEqualTo(403);
            assertThat(admin.post("/api/admin/demo/reset", null).status()).isEqualTo(204);

            // The shopper's session is gone and the account no longer exists.
            assertThat(shopper.get("/api/orders").status()).isEqualTo(401);
            assertThat(app.client().post("/api/auth/login",
                    "{\"email\":\"demo-shopper@samska.test\",\"password\":\"correct-horse\"}").status())
                    .isEqualTo(401);
            // The administrator stays signed in, the catalog stays, stock returns to the default.
            var after = admin.get("/api/products/" + product);
            assertThat(after.status()).isEqualTo(200);
            assertThat((int) JsonPath.read(after.body(), "$.stock")).isEqualTo(25);
            assertThat((int) JsonPath.read(admin.get("/api/admin/operations").body(), "$.ordersLast24Hours"))
                    .isZero();
        }
    }
}
