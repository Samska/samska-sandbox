package io.github.samska.sandbox.demo;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.support.EnforcedApplication;

import static io.github.samska.sandbox.support.EnforcedApplication.ADMIN_EMAIL;
import static io.github.samska.sandbox.support.EnforcedApplication.ADMIN_PASSWORD;
import static org.assertj.core.api.Assertions.assertThat;

class SampleCatalogSeedTest {

    @Test
    void seedsAnEmptyCatalogOnceAndTheDemoResetKeepsTheProducts() throws Exception {
        try (var app = EnforcedApplication.start("--samska.demo.enabled=true", "--samska.demo.seed-products=true")) {
            var seed = app.context().getBean(SampleCatalogSeed.class);

            assertThat(seed.seedIfEmpty()).isEqualTo(6);
            assertThat(seed.seedIfEmpty()).as("a catalog with Products is left alone").isZero();

            var products = app.client().get("/api/products");
            assertThat((int) JsonPath.read(products.body(), "$.length()")).isEqualTo(6);
            assertThat((String) JsonPath.read(products.body(), "$[0].mediaKey")).isEqualTo("art-tote");
            assertThat((int) JsonPath.read(products.body(), "$[0].stock")).isEqualTo(25);

            var admin = app.client();
            assertThat(admin.post("/api/auth/login",
                    "{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + ADMIN_PASSWORD + "\"}").status())
                    .isEqualTo(200);
            assertThat(admin.post("/api/admin/demo/reset", null).status()).isEqualTo(204);

            assertThat((int) JsonPath.read(app.client().get("/api/products").body(), "$.length()")).isEqualTo(6);
        }
    }

    @Test
    void movesSamplesFromEarlierImagesToIllustrationsButNeverTouchesEditedProducts() throws Exception {
        try (var app = EnforcedApplication.start("--samska.demo.seed-products=true")) {
            var seed = app.context().getBean(SampleCatalogSeed.class);
            var admin = app.client();
            assertThat(admin.post("/api/auth/login",
                    "{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + ADMIN_PASSWORD + "\"}").status())
                    .isEqualTo(200);
            // As the first version left them: the Tote with its photo key, an edited Mug, and an untouched Board.
            var tote = admin.post("/api/products", "{\"name\":\"Canvas Market Tote\",\"description\":\"Sturdy cotton canvas "
                    + "tote with reinforced handles, sized for a week of market shopping.\",\"price\":29.90,"
                    + "\"mediaKey\":\"canvas-market-tote\"}");
            admin.post("/api/products", "{\"name\":\"Enamel Camp Mug\",\"description\":\"Edited by the administrator\","
                    + "\"price\":12.00}");
            admin.post("/api/products", "{\"name\":\"Walnut Serving Board\",\"description\":\"Oiled walnut board with a "
                    + "juice groove, large enough for a shared meal.\",\"price\":58.00}");

            assertThat(seed.refreshIllustrations()).isEqualTo(2);
            assertThat(seed.refreshIllustrations()).as("a second run has nothing left to move").isZero();

            String toteId = JsonPath.read(tote.body(), "$.id");
            assertThat((String) JsonPath.read(app.client().get("/api/products/" + toteId).body(), "$.mediaKey"))
                    .isEqualTo("art-tote");
            var all = app.client().get("/api/products").body();
            assertThat(JsonPath.<java.util.List<String>>read(all, "$[?(@.name=='Walnut Serving Board')].mediaKey"))
                    .containsExactly("art-serving-board");
            assertThat(JsonPath.<java.util.List<String>>read(all, "$[?(@.name=='Enamel Camp Mug')].mediaKey"))
                    .containsExactly((String) null);
        }
    }
}
