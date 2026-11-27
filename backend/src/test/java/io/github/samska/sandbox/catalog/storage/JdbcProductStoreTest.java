package io.github.samska.sandbox.catalog.storage;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import io.github.samska.sandbox.catalog.JpegTestImages;
import io.github.samska.sandbox.catalog.Product;
import io.github.samska.sandbox.catalog.ProductId;
import io.github.samska.sandbox.catalog.application.DuplicateProductIdException;
import io.github.samska.sandbox.catalog.application.MediaChange;
import io.github.samska.sandbox.catalog.application.MediaChangeResult;
import io.github.samska.sandbox.catalog.application.ProductStore;
import io.github.samska.sandbox.catalog.application.UploadedMedia;
import io.github.samska.sandbox.support.OrderDatabaseTestSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@TestPropertySource(properties = "catalog.media.max-total-bytes=1000")
class JdbcProductStoreTest extends OrderDatabaseTestSupport {

    @Autowired
    private ProductStore store;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void usesTheProductionJdbcStore() {
        assertThat(store).isInstanceOf(JdbcProductStore.class);
    }

    @Test
    void roundTripsAProductWithExactPriceAndCuratedMediaKeyAndRejectsADuplicate() {
        var product = product("Canvas Tote", "12.50", "canvas-market-tote");

        store.save(product);

        var loaded = store.findById(product.id()).orElseThrow().product();
        assertThat(loaded.name()).isEqualTo("Canvas Tote");
        assertThat(loaded.description()).isEqualTo("Synthetic description");
        assertThat(loaded.price()).isEqualByComparingTo("12.50");
        assertThat(loaded.mediaKey()).isEqualTo("canvas-market-tote");
        assertThatThrownBy(() -> store.save(product)).isInstanceOf(DuplicateProductIdException.class);
        assertThat(store.findAll()).hasSize(1);
    }

    @Test
    void listsProductsInInsertionOrderEvenAfterAReplace() {
        var first = product("First", "1.00", null);
        var second = product("Second", "2.00", null);
        var third = product("Third", "3.00", null);
        store.save(first);
        store.save(second);
        store.save(third);

        store.replaceProduct(new Product(first.id(), "First renamed", "Changed", new BigDecimal("9.00"), null));

        assertThat(store.findAll()).extracting(snapshot -> snapshot.product().name())
                .containsExactly("First renamed", "Second", "Third");
    }

    @Test
    void replaceKeepsTheUploadedImageAndAnUnknownProductIsEmpty() {
        var product = product("Canvas Tote", "12.50", null);
        store.save(product);
        var media = media(1);
        store.replaceMedia(product.id(), media);

        var replaced = store.replaceProduct(new Product(product.id(), "Renamed", "Changed", new BigDecimal("3.00"), null))
                .orElseThrow();

        assertThat(replaced.product().name()).isEqualTo("Renamed");
        assertThat(replaced.uploadedMediaId()).isEqualTo(media.id());
        assertThat(store.replaceProduct(product("Unknown", "1.00", null))).isEmpty();
    }

    @Test
    void storesOneImagePerProductReplacesItAndServesTheBytesOnlyForASingleProduct() {
        var product = product("Canvas Tote", "12.50", null);
        store.save(product);
        var first = media(1);
        var second = media(2);

        assertThat(store.replaceMedia(product.id(), first).result()).isEqualTo(MediaChangeResult.UPDATED);
        var replaced = store.replaceMedia(product.id(), second);

        assertThat(replaced.snapshot().uploadedMediaId()).isEqualTo(second.id());
        assertThat(store.findById(product.id()).orElseThrow().media().jpegBytes()).isEqualTo(second.jpegBytes());
        var listed = store.findAll().iterator().next();
        assertThat(listed.uploadedMediaId()).isEqualTo(second.id());
        assertThat(listed.media()).isNull();
        assertThat(count("product_media")).isEqualTo(1);
    }

    @Test
    void removesMediaAndReportsTheOutcomes() {
        var product = product("Canvas Tote", "12.50", null);
        store.save(product);
        store.replaceMedia(product.id(), media(1));

        assertThat(store.removeMedia(product.id())).isEqualTo(MediaChangeResult.REMOVED);
        assertThat(store.removeMedia(product.id())).isEqualTo(MediaChangeResult.NO_MEDIA);
        assertThat(store.removeMedia(ProductId.generate())).isEqualTo(MediaChangeResult.PRODUCT_NOT_FOUND);
        assertThat(store.findById(product.id()).orElseThrow().uploadedMediaId()).isNull();
    }

    @Test
    void deletingAProductAlsoDeletesItsMediaAndFreesTheBudget() {
        var product = product("Canvas Tote", "12.50", null);
        store.save(product);
        store.replaceMedia(product.id(), media(1));

        assertThat(store.deleteById(product.id())).isTrue();
        assertThat(store.deleteById(product.id())).isFalse();

        assertThat(count("product_media")).isZero();
        assertThat(store.findById(product.id())).isEmpty();
    }

    @Test
    void enforcesTheAggregateMediaBudgetAndAReplacementReusesItsOwnShare() {
        var first = product("First", "1.00", null);
        var second = product("Second", "2.00", null);
        store.save(first);
        store.save(second);
        int size = media(1).byteLength();
        assertThat(size).isLessThan(1000).isGreaterThan(500);

        assertThat(store.replaceMedia(first.id(), media(1)).result()).isEqualTo(MediaChangeResult.UPDATED);
        assertThat(store.replaceMedia(second.id(), media(2)).result()).isEqualTo(MediaChangeResult.CAPACITY_EXCEEDED);
        assertThat(store.replaceMedia(first.id(), media(3)).result()).isEqualTo(MediaChangeResult.UPDATED);
        assertThat(store.replaceMedia(ProductId.generate(), media(4)).result())
                .isEqualTo(MediaChangeResult.PRODUCT_NOT_FOUND);
        assertThat(count("product_media")).isEqualTo(1);
    }

    @Test
    void concurrentUploadsNeverExceedTheMediaBudget() throws Exception {
        var products = new ArrayList<Product>();
        for (int i = 0; i < 4; i++) {
            var product = product("Product " + i, "1.00", null);
            store.save(product);
            products.add(product);
        }
        var barrier = new CyclicBarrier(products.size());
        var executor = Executors.newFixedThreadPool(products.size());
        try {
            List<Callable<MediaChange>> tasks = new ArrayList<>();
            for (int i = 0; i < products.size(); i++) {
                var product = products.get(i);
                var media = media(i + 1);
                tasks.add(() -> {
                    barrier.await(10, TimeUnit.SECONDS);
                    return store.replaceMedia(product.id(), media);
                });
            }

            var results = new ArrayList<MediaChangeResult>();
            for (var future : executor.invokeAll(tasks, 30, TimeUnit.SECONDS)) {
                results.add(future.get().result());
            }

            assertThat(results).containsOnly(MediaChangeResult.UPDATED, MediaChangeResult.CAPACITY_EXCEEDED);
            assertThat(results.stream().filter(MediaChangeResult.UPDATED::equals)).hasSize(1);
            assertThat(jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(byte_length), 0) FROM product_media", Long.class)).isLessThanOrEqualTo(1000);
        } finally {
            executor.shutdownNow();
        }
    }

    private static Product product(String name, String price, String mediaKey) {
        return new Product(ProductId.generate(), name, "Synthetic description", new BigDecimal(price), mediaKey);
    }

    private static UploadedMedia media(int seed) {
        return new UploadedMedia(UUID.randomUUID(), JpegTestImages.jpeg(30 + seed, 30));
    }

    private long count(String table) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM " + table, Long.class);
    }
}
