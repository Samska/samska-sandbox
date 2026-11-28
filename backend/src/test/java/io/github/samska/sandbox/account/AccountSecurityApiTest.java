package io.github.samska.sandbox.account;

import java.util.UUID;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import io.github.samska.sandbox.support.EnforcedApplication;
import io.github.samska.sandbox.support.EnforcedApplication.Client;

import static io.github.samska.sandbox.support.EnforcedApplication.ADMIN_EMAIL;
import static io.github.samska.sandbox.support.EnforcedApplication.ADMIN_PASSWORD;
import static org.assertj.core.api.Assertions.assertThat;

class AccountSecurityApiTest {

    private static EnforcedApplication app;

    @BeforeAll
    static void start() {
        app = EnforcedApplication.start();
    }

    @AfterAll
    static void stop() {
        app.close();
    }

    private static String credentials(String email, String name, String password) {
        return "{\"email\":\"" + email + "\",\"displayName\":\"" + name + "\",\"password\":\"" + password + "\"}";
    }

    private static Client customer(String email) throws Exception {
        var client = app.client();
        var reply = client.post("/api/auth/register", credentials(email, "Synthetic Person", "correct-horse"));
        assertThat(reply.status()).as(reply.body()).isEqualTo(201);
        return client;
    }

    private static Client admin() throws Exception {
        var client = app.client();
        var reply = client.post("/api/auth/login",
                "{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + ADMIN_PASSWORD + "\"}");
        assertThat(reply.status()).isEqualTo(200);
        return client;
    }

    private static String createProduct(Client admin, String name) throws Exception {
        var reply = admin.post("/api/products",
                "{\"name\":\"" + name + "\",\"description\":\"Synthetic\",\"price\":12.50}");
        assertThat(reply.status()).as(reply.body()).isEqualTo(201);
        return JsonPath.read(reply.body(), "$.id");
    }

    @Test
    void anonymousVisitorsBrowseButCannotUseCartOrOrders() throws Exception {
        var visitor = app.client();

        assertThat(visitor.get("/api/products").status()).isEqualTo(200);
        assertThat(visitor.get("/actuator/health").status()).isEqualTo(200);
        assertThat(visitor.get("/api/auth/me").status()).isEqualTo(204);
        assertThat(visitor.get("/api/cart").status()).isEqualTo(401);
        assertThat(visitor.get("/api/orders/" + UUID.randomUUID()).status()).isEqualTo(401);
        assertThat(visitor.post("/api/products", "{}").status()).isEqualTo(401);
        assertThat(visitor.get("/actuator/env").status()).isIn(401, 403, 404);
    }

    @Test
    void registrationSignsTheAccountInAndNeverReturnsOrLogsThePassword() throws Exception {
        var client = app.client();
        var reply = client.post("/api/auth/register", credentials("Ana@Example.test", "Ana", "correct-horse"));

        assertThat(reply.status()).isEqualTo(201);
        assertThat((String) JsonPath.read(reply.body(), "$.email")).isEqualTo("ana@example.test");
        assertThat((String) JsonPath.read(reply.body(), "$.role")).isEqualTo("CUSTOMER");
        assertThat(reply.body()).doesNotContain("correct-horse").doesNotContain("password");

        var me = client.get("/api/auth/me");
        assertThat(me.status()).isEqualTo(200);
        assertThat((String) JsonPath.read(me.body(), "$.displayName")).isEqualTo("Ana");

        var stored = app.context().getBean(JdbcTemplate.class)
                .queryForObject("SELECT password_hash FROM accounts WHERE email = 'ana@example.test'", String.class);
        assertThat(stored).startsWith("$2").doesNotContain("correct-horse");

        var setCookie = String.join(";", reply.raw().headers().allValues("Set-Cookie"));
        assertThat(setCookie).contains("JSESSIONID").contains("HttpOnly");
    }

    @Test
    void rejectsInvalidAndDuplicateRegistrations() throws Exception {
        customer("duplicate@example.test");
        var other = app.client();

        assertThat(other.post("/api/auth/register",
                credentials("DUPLICATE@example.test", "Again", "correct-horse")).status()).isEqualTo(409);
        assertThat(other.post("/api/auth/register", credentials("not-an-email", "X", "correct-horse")).status())
                .isEqualTo(400);
        assertThat(other.post("/api/auth/register", credentials("short@example.test", "X", "short")).status())
                .isEqualTo(400);
        assertThat(other.post("/api/auth/register", credentials("noname@example.test", " ", "correct-horse")).status())
                .isEqualTo(400);
        assertThat(other.post("/api/auth/register", "{not json").status()).isEqualTo(400);
    }

    @Test
    void signInFailuresAreIndistinguishableAndSignOutEndsTheSession() throws Exception {
        customer("signin@example.test");
        var client = app.client();

        var wrongPassword = client.post("/api/auth/login",
                "{\"email\":\"signin@example.test\",\"password\":\"wrong-password\"}");
        var unknownEmail = client.post("/api/auth/login",
                "{\"email\":\"nobody@example.test\",\"password\":\"wrong-password\"}");
        assertThat(wrongPassword.status()).isEqualTo(401);
        assertThat(unknownEmail.status()).isEqualTo(401);
        assertThat(wrongPassword.body()).isEqualTo(unknownEmail.body());

        var ok = client.post("/api/auth/login",
                "{\"email\":\"SignIn@example.test\",\"password\":\"correct-horse\"}");
        assertThat(ok.status()).isEqualTo(200);
        assertThat(client.get("/api/cart").status()).isEqualTo(200);

        assertThat(client.post("/api/auth/logout", null).status()).isEqualTo(204);
        assertThat(client.get("/api/cart").status()).isEqualTo(401);
        assertThat(client.get("/api/auth/me").status()).isEqualTo(204);
    }

    @Test
    void stateChangingRequestsWithoutTheCsrfTokenAreRefused() throws Exception {
        var client = customer("csrf@example.test");
        var product = createProduct(admin(), "Csrf Mug");

        var forged = client.postWithoutCsrf("/api/cart/items",
                "{\"productId\":\"" + product + "\",\"quantity\":1}");
        assertThat(forged.status()).isEqualTo(403);
        assertThat(client.post("/api/cart/items",
                "{\"productId\":\"" + product + "\",\"quantity\":1}").status()).isEqualTo(200);
        assertThat(app.client().postWithoutCsrf("/api/auth/login",
                "{\"email\":\"csrf@example.test\",\"password\":\"correct-horse\"}").status()).isEqualTo(403);
    }

    @Test
    void onlyTheAdministratorChangesTheCatalog() throws Exception {
        var shopper = customer("shopper@example.test");

        assertThat(shopper.post("/api/products",
                "{\"name\":\"Nope\",\"description\":\"x\",\"price\":1}").status()).isEqualTo(403);
        var id = createProduct(admin(), "Admin Mug");
        assertThat(shopper.put("/api/products/" + id,
                "{\"name\":\"Hacked\",\"description\":\"x\",\"price\":1}").status()).isEqualTo(403);
        assertThat(shopper.delete("/api/products/" + id).status()).isEqualTo(403);
        assertThat(shopper.delete("/api/products/" + id + "/media").status()).isEqualTo(403);
        assertThat(shopper.get("/api/products/" + id).status()).isEqualTo(200);
    }

    @Test
    void eachAccountOwnsItsCartAndOrders() throws Exception {
        var product = createProduct(admin(), "Shared Mug");
        var first = customer("first@example.test");
        var second = customer("second@example.test");

        var added = first.post("/api/cart/items", "{\"productId\":\"" + product + "\",\"quantity\":2}");
        assertThat(added.status()).isEqualTo(200);
        int revision = JsonPath.read(added.body(), "$.revision");
        assertThat((Object) JsonPath.read(second.get("/api/cart").body(), "$.items")).asList().isEmpty();

        var requestId = UUID.randomUUID();
        // Another account cannot place an Order from a Cart that is not its own.
        assertThat(second.post("/api/orders", "{\"requestId\":\"" + requestId + "\",\"cartRevision\":" + revision + "}")
                .status()).isIn(400, 409);

        var order = first.post("/api/orders", "{\"requestId\":\"" + requestId + "\",\"cartRevision\":" + revision + "}");
        assertThat(order.status()).isEqualTo(201);
        String orderId = JsonPath.read(order.body(), "$.orderId");
        assertThat(first.get("/api/orders/" + orderId).status()).isEqualTo(200);
        assertThat(second.get("/api/orders/" + orderId).status()).isEqualTo(404);
        // Nor can it take over the first account's request id: it is refused without confirming it exists.
        second.post("/api/cart/items", "{\"productId\":\"" + product + "\",\"quantity\":1}");
        assertThat(second.post("/api/orders", "{\"requestId\":\"" + requestId + "\",\"cartRevision\":1}").status())
                .isEqualTo(400);
        assertThat(admin().get("/api/orders/" + orderId).status()).isEqualTo(404);
    }

    @Test
    void thePasswordNeverAppearsInAccountToString() {
        var account = new Account(UUID.randomUUID(), "a@b.test", "A", "$2a$hash", Role.CUSTOMER);
        assertThat(account.toString()).doesNotContain("$2a$hash").doesNotContain("a@b.test");
    }
}
