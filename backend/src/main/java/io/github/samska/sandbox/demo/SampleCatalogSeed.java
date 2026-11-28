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
 * Gives a hosted demo a fixed example catalog of synthetic Products. It runs only when
 * {@code samska.demo.seed-products} is true and never changes a Product that already exists. The demo reset does
 * not touch Products, so the catalog is permanent.
 */
@Component
class SampleCatalogSeed implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(SampleCatalogSeed.class);

    private record Sample(String name, String description, String price, String mediaKey, String earlierMediaKey,
            int stock) {
    }

    private static final List<Sample> SAMPLES = List.of(
            new Sample("Canvas Market Tote",
                    "Sturdy cotton canvas tote with reinforced handles, sized for a week of market shopping.",
                    "29.90", "art-tote", "canvas-market-tote", 25),
            new Sample("Stoneware Pour-Over Set",
                    "Hand-glazed stoneware dripper and server for a slow, careful cup of coffee.",
                    "64.00", "art-pour-over", "stoneware-pour-over-set", 25),
            new Sample("Workshop Workbench",
                    "Solid beech workbench with a vise and tool shelf, built for a small home workshop.",
                    "489.00", "art-workbench", "workshop-workbench", 10),
            new Sample("Linen Apron",
                    "Washed linen apron with two deep pockets and an adjustable neck strap.",
                    "34.50", "art-linen-apron", null, 25),
            new Sample("Enamel Camp Mug",
                    "Lightweight enamel mug with a rolled rim that stays cool to hold.",
                    "12.00", "art-camp-mug", null, 40),
            new Sample("Walnut Serving Board",
                    "Oiled walnut board with a juice groove, large enough for a shared meal.",
                    "58.00", "art-serving-board", null, 15),
            new Sample("Arc Table Lamp",
                    "Slim steel arc that throws warm light over a desk or reading chair, with a cloth cord.",
                    "129.00", "art-arc-lamp", null, 12),
            new Sample("Terra Vessel",
                    "Hand-glazed stoneware vessel for stems, brushes or nothing at all.",
                    "68.00", "art-terra-vessel", null, 8),
            new Sample("Linen Throw",
                    "Stonewashed linen blanket that gets softer with every wash.",
                    "54.50", "art-linen-throw", null, 18),
            new Sample("Desk Clock",
                    "Round desk clock with a quiet movement and a signal-orange second hand.",
                    "46.00", "art-desk-clock", null, 20),
            new Sample("Beech Hand Plane",
                    "Beech-bodied smoothing plane with an adjustable steel blade and a rounded front knob.",
                    "84.00", "art-hand-plane", null, 9),
            new Sample("Steel Tape Measure",
                    "Five-metre steel tape in a shock-proof case with a locking slide.",
                    "18.00", "art-tape-measure", null, 60),
            new Sample("Bound Journal",
                    "Cloth-bound journal with 192 dotted pages and an elastic band.",
                    "22.00", "art-journal", null, 45),
            new Sample("Canvas Rucksack",
                    "Waxed canvas rucksack with a flap top, a front pocket and a padded back.",
                    "96.00", "art-rucksack", null, 14),
            new Sample("Clay Planter",
                    "Terracotta planter with a drainage hole, sized for a herb or a small seedling.",
                    "26.00", "art-planter", null, 30),
            new Sample("Oak Wall Shelf",
                    "Oak wall shelf with steel brackets for books and small plants.",
                    "72.00", "art-wall-shelf", null, 11),
            new Sample("Enamel Kettle",
                    "Stovetop enamel kettle with a whistle and a heat-proof knob.",
                    "48.00", "art-kettle", null, 16),
            new Sample("Round Stool",
                    "Solid oak stool with a dished seat and splayed legs.",
                    "88.00", "art-stool", null, 7));

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
            refreshIllustrations();
            seedMissing();
        }
    }

    /**
     * Moves sample Products created by an earlier version to the current illustrations. A Product is touched only
     * while it still has the sample's name, description and price and its earlier media key, so nothing the
     * administrator changed is overwritten.
     *
     * @return the number of Products updated
     */
    int refreshIllustrations() {
        var updated = 0;
        for (var snapshot : products.listProducts()) {
            var product = snapshot.product();
            for (var sample : SAMPLES) {
                if (product.name().equals(sample.name())
                        && product.description().equals(sample.description())
                        && product.price().compareTo(new BigDecimal(sample.price())) == 0
                        && java.util.Objects.equals(product.mediaKey(), sample.earlierMediaKey())) {
                    products.updateProduct(product.id(), product.name(), product.description(), product.price(),
                            sample.mediaKey());
                    updated++;
                }
            }
        }
        if (updated > 0) {
            LOG.info("Moved {} sample Products to the current illustrations", updated);
        }
        return updated;
    }

    /**
     * Creates every sample Product that is not in the catalog yet, matched by name, so an existing catalog is
     * completed without duplicates and nothing already there is changed. A sample the administrator deleted comes
     * back at the next start-up; turning {@code samska.demo.seed-products} off stops that.
     *
     * @return the number of Products created
     */
    int seedMissing() {
        var existing = new java.util.HashSet<String>();
        for (var snapshot : products.listProducts()) {
            existing.add(snapshot.product().name());
        }
        var created = 0;
        for (var sample : SAMPLES) {
            if (existing.contains(sample.name())) {
                continue;
            }
            var product = products.createProduct(
                    sample.name(), sample.description(), new BigDecimal(sample.price()), sample.mediaKey());
            inventory.setOnHand(product.id().value(), sample.stock());
            created++;
        }
        if (created > 0) {
            LOG.info("Created {} sample Products", created);
        }
        return created;
    }
}
