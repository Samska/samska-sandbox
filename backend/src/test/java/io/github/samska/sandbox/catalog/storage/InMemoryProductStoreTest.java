package io.github.samska.sandbox.catalog.storage;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.catalog.Product;
import io.github.samska.sandbox.catalog.ProductId;
import io.github.samska.sandbox.catalog.application.DuplicateProductIdException;
import io.github.samska.sandbox.catalog.application.MediaChangeResult;
import io.github.samska.sandbox.catalog.application.MediaLimits;
import io.github.samska.sandbox.catalog.application.UploadedMedia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class InMemoryProductStoreTest {

    private static final ProductId PRODUCT_ID =
            new ProductId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
    private static final ProductId SECOND_PRODUCT_ID =
            new ProductId(UUID.fromString("22222222-2222-2222-2222-222222222222"));

    private final InMemoryProductStore store = new InMemoryProductStore(MediaLimits.MAX_TOTAL_STORED_BYTES);

    @Test
    void savesAndFindsProduct() {
        var product = product(PRODUCT_ID, "Sample");

        store.save(product);

        assertThat(store.findById(PRODUCT_ID)).get().satisfies(snapshot -> {
            assertThat(snapshot.product()).isSameAs(product);
            assertThat(snapshot.media()).isNull();
            assertThat(snapshot.uploadedMediaId()).isNull();
        });
    }

    @Test
    void replacesExistingProductAndPreservesMedia() {
        store.save(product(PRODUCT_ID, "First name"));
        var media = media(64);
        assertThat(store.replaceMedia(PRODUCT_ID, media).result()).isEqualTo(MediaChangeResult.UPDATED);

        var replacement = product(PRODUCT_ID, "Second name");
        var snapshot = store.replaceProduct(replacement);

        assertThat(snapshot).isPresent();
        assertThat(snapshot.get().product()).isSameAs(replacement);
        assertThat(snapshot.get().media()).isSameAs(media);
        assertThat(store.trackedMediaBytes()).isEqualTo(media.byteLength());
    }

    @Test
    void refusesDuplicateSaveWithoutReplacingTheExistingProductOrItsMedia() {
        store.save(product(PRODUCT_ID, "Original name"));
        var media = media(120);
        assertThat(store.replaceMedia(PRODUCT_ID, media).result()).isEqualTo(MediaChangeResult.UPDATED);
        assertThat(store.trackedMediaBytes()).isEqualTo(120);

        assertThatExceptionOfType(DuplicateProductIdException.class)
                .isThrownBy(() -> store.save(product(PRODUCT_ID, "Duplicate name")));

        var snapshot = store.findById(PRODUCT_ID).orElseThrow();
        assertThat(snapshot.product().name()).isEqualTo("Original name");
        assertThat(snapshot.media()).isNotNull();
        assertThat(snapshot.media().id()).isEqualTo(media.id());
        assertThat(store.trackedMediaBytes()).isEqualTo(120);
    }

    @Test
    void refusesToReplaceAbsentProduct() {
        assertThat(store.replaceProduct(product(PRODUCT_ID, "Sample"))).isEmpty();
        assertThat(store.findById(PRODUCT_ID)).isEmpty();
    }

    @Test
    void deletesExistingProductAndReleasesMedia() {
        store.save(product(PRODUCT_ID, "Sample"));
        assertThat(store.replaceMedia(PRODUCT_ID, media(128)).result()).isEqualTo(MediaChangeResult.UPDATED);

        assertThat(store.deleteById(PRODUCT_ID)).isTrue();
        assertThat(store.findById(PRODUCT_ID)).isEmpty();
        assertThat(store.findAll()).isEmpty();
        assertThat(store.trackedMediaBytes()).isZero();
    }

    @Test
    void refusesToDeleteAbsentProduct() {
        assertThat(store.deleteById(PRODUCT_ID)).isFalse();
    }

    @Test
    void replacesMediaAndAccountsForBytes() {
        store.save(product(PRODUCT_ID, "Sample"));
        var first = media(100);
        var second = media(40);

        var firstChange = store.replaceMedia(PRODUCT_ID, first);
        assertThat(firstChange.result()).isEqualTo(MediaChangeResult.UPDATED);
        assertThat(firstChange.snapshot().uploadedMediaId()).isEqualTo(first.id());
        assertThat(store.trackedMediaBytes()).isEqualTo(100);

        var secondChange = store.replaceMedia(PRODUCT_ID, second);
        assertThat(secondChange.result()).isEqualTo(MediaChangeResult.UPDATED);
        assertThat(secondChange.snapshot().uploadedMediaId()).isEqualTo(second.id());
        assertThat(store.trackedMediaBytes()).isEqualTo(40);

        var snapshot = store.findById(PRODUCT_ID).orElseThrow();
        assertThat(snapshot.media()).isNotNull();
        assertThat(snapshot.media().id()).isEqualTo(second.id());
    }

    @Test
    void reportsMissingProductWhenReplacingMedia() {
        assertThat(store.replaceMedia(PRODUCT_ID, media(10)).result())
                .isEqualTo(MediaChangeResult.PRODUCT_NOT_FOUND);
        assertThat(store.trackedMediaBytes()).isZero();
    }

    @Test
    void removesMediaAndReportsAbsence() {
        store.save(product(PRODUCT_ID, "Sample"));
        assertThat(store.replaceMedia(PRODUCT_ID, media(80)).result()).isEqualTo(MediaChangeResult.UPDATED);

        assertThat(store.removeMedia(PRODUCT_ID)).isEqualTo(MediaChangeResult.REMOVED);
        assertThat(store.trackedMediaBytes()).isZero();
        assertThat(store.findById(PRODUCT_ID)).get().satisfies(snapshot -> assertThat(snapshot.media()).isNull());
        assertThat(store.removeMedia(PRODUCT_ID)).isEqualTo(MediaChangeResult.NO_MEDIA);
        assertThat(store.removeMedia(SECOND_PRODUCT_ID)).isEqualTo(MediaChangeResult.PRODUCT_NOT_FOUND);
    }

    @Test
    void enforcesTheAggregateMediaBudget() {
        var constrained = new InMemoryProductStore(150);
        constrained.save(product(PRODUCT_ID, "First"));
        constrained.save(product(SECOND_PRODUCT_ID, "Second"));

        assertThat(constrained.replaceMedia(PRODUCT_ID, media(100)).result())
                .isEqualTo(MediaChangeResult.UPDATED);
        assertThat(constrained.replaceMedia(SECOND_PRODUCT_ID, media(100)).result())
                .isEqualTo(MediaChangeResult.CAPACITY_EXCEEDED);
        assertThat(constrained.trackedMediaBytes()).isEqualTo(100);

        assertThat(constrained.replaceMedia(SECOND_PRODUCT_ID, media(50)).result())
                .isEqualTo(MediaChangeResult.UPDATED);
        assertThat(constrained.trackedMediaBytes()).isEqualTo(150);
    }

    @Test
    void accountsForBytesUnderConcurrentReplacement() throws Exception {
        store.save(product(PRODUCT_ID, "Sample"));
        int threadCount = 8;
        var start = new CountDownLatch(1);
        var finished = new CountDownLatch(threadCount);

        for (int index = 0; index < threadCount; index++) {
            var media = media(16 + index);
            var thread = new Thread(() -> {
                try {
                    if (!start.await(5, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("Timed out waiting to start");
                    }
                    store.replaceMedia(PRODUCT_ID, media);
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                } finally {
                    finished.countDown();
                }
            });
            thread.start();
        }

        start.countDown();
        assertThat(finished.await(10, TimeUnit.SECONDS)).isTrue();

        var snapshot = store.findById(PRODUCT_ID).orElseThrow();
        assertThat(snapshot.media()).isNotNull();
        assertThat(store.trackedMediaBytes()).isEqualTo(snapshot.media().byteLength());
    }

    private static Product product(ProductId id, String name) {
        return new Product(id, name, "A sample product", new BigDecimal("12.50"));
    }

    private static UploadedMedia media(int byteLength) {
        return new UploadedMedia(UUID.randomUUID(), new byte[byteLength]);
    }
}
