package io.github.samska.sandbox.demo;

import java.math.BigDecimal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import io.github.samska.sandbox.catalog.application.ProductApplicationService;
import io.github.samska.sandbox.inventory.application.Inventory;

/**
 * Gives a hosted demo a few synthetic Products so that the store is not empty. It runs only when
 * {@code samska.demo.seed-products} is true and only while the catalog has no Product, so Products added or
 * removed later by the administrator are never overwritten. The daily demo reset does not touch Products.
 */
@Component
class SampleCatalogSeed implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(SampleCatalogSeed.class);

    private record Sample(String name, String description, String price, String mediaKey, int stock) {
    }

    private static final List<Sample> SAMPLES = List.of(
            new Sample("Canvas Market Tote",
                    "Sturdy cotton canvas tote with reinforced handles, sized for a week of market shopping.",
                    "29.90", "canvas-market-tote", 25),
            new Sample("Stoneware Pour-Over Set",
                    "Hand-glazed stoneware dripper and server for a slow, careful cup of coffee.",
                    "64.00", "stoneware-pour-over-set", 25),
            new Sample("Workshop Workbench",
                    "Solid beech workbench with a vise and tool shelf, built for a small home workshop.",
                    "489.00", "workshop-workbench", 10),
            new Sample("Linen Apron",
                    "Washed linen apron with two deep pockets and an adjustable neck strap.",
                    "34.50", null, 25),
            new Sample("Enamel Camp Mug",
                    "Lightweight enamel mug with a rolled rim that stays cool to hold.",
                    "12.00", null, 40),
            new Sample("Walnut Serving Board",
                    "Oiled walnut board with a juice groove, large enough for a shared meal.",
                    "58.00", null, 15));

    private final ProductApplicationService products;
    private final Inventory inventory;
    private final boolean enabled;

    SampleCatalogSeed(ProductApplicationService products, Inventory inventory,
            @Value("${samska.demo.seed-products:false}") boolean enabled) {
        this.products = products;
        this.inventory = inventory;
        this.enabled = enabled;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (enabled) {
            seedIfEmpty();
        }
    }

    /** @return the number of Products created, zero when the catalog already has Products */
    int seedIfEmpty() {
        if (!products.listProducts().isEmpty()) {
            return 0;
        }
        for (var sample : SAMPLES) {
            var product = products.createProduct(
                    sample.name(), sample.description(), new BigDecimal(sample.price()), sample.mediaKey());
            inventory.setOnHand(product.id().value(), sample.stock());
        }
        LOG.info("Created {} sample Products", SAMPLES.size());
        return SAMPLES.size();
    }
}
