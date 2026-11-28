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
            assertThat((String) JsonPath.read(products.body(), "$[0].mediaKey")).isEqualTo("canvas-market-tote");
            assertThat((int) JsonPath.read(products.body(), "$[0].stock")).isEqualTo(25);

            var admin = app.client();
            assertThat(admin.post("/api/auth/login",
                    "{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + ADMIN_PASSWORD + "\"}").status())
                    .isEqualTo(200);
            assertThat(admin.post("/api/admin/demo/reset", null).status()).isEqualTo(204);

            assertThat((int) JsonPath.read(app.client().get("/api/products").body(), "$.length()")).isEqualTo(6);
        }
    }
}
