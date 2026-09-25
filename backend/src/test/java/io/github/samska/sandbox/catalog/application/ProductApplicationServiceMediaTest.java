package io.github.samska.sandbox.catalog.application;

import java.math.BigDecimal;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.catalog.JpegTestImages;
import io.github.samska.sandbox.catalog.Product;
import io.github.samska.sandbox.catalog.ProductId;
import io.github.samska.sandbox.catalog.storage.InMemoryProductStore;

import static org.assertj.core.api.Assertions.assertThat;

class ProductApplicationServiceMediaTest {

    private static final ProductMediaNormalizer NORMALIZER = new ProductMediaNormalizer(
            MediaLimits.MAX_INPUT_BYTES,
            MediaLimits.MAX_DIMENSION_PIXELS,
            MediaLimits.MAX_PIXELS,
            MediaLimits.MAX_OUTPUT_BYTES);

    @Test
    void uploadResponseReflectsItsOwnPublicationWhenAReplacementInterleaves() throws Exception {
        var store = new BlockingAfterPublishStore();
        var service = new ProductApplicationService(store, NORMALIZER);
        var product = createProduct(service);

        var firstResult = new AtomicReference<ProductSnapshot>();
        var firstFailure = new AtomicReference<Throwable>();
        var firstThread = new Thread(
                () -> upload(service, product.id(), JpegTestImages.jpeg(24, 24), firstResult, firstFailure));
        firstThread.start();

        assertThat(store.published.await(5, TimeUnit.SECONDS)).isTrue();
        var publishedMediaId = store.findById(product.id()).orElseThrow().uploadedMediaId();
        var secondSnapshot = service.uploadMedia(product.id(), JpegTestImages.jpeg(32, 32));
        assertThat(secondSnapshot.uploadedMediaId()).isNotEqualTo(publishedMediaId);

        store.release.countDown();
        firstThread.join(5_000);

        assertThat(firstFailure.get()).isNull();
        assertThat(firstResult.get().product().id()).isEqualTo(product.id());
        assertThat(firstResult.get().uploadedMediaId()).isEqualTo(publishedMediaId);
        assertThat(store.findById(product.id()).orElseThrow().uploadedMediaId())
                .isEqualTo(secondSnapshot.uploadedMediaId());
    }

    @Test
    void uploadResponseStillDescribesThePublicationWhenDeletionInterleaves() throws Exception {
        var store = new BlockingAfterPublishStore();
        var service = new ProductApplicationService(store, NORMALIZER);
        var product = createProduct(service);

        var firstResult = new AtomicReference<ProductSnapshot>();
        var firstFailure = new AtomicReference<Throwable>();
        var firstThread = new Thread(
                () -> upload(service, product.id(), JpegTestImages.jpeg(24, 24), firstResult, firstFailure));
        firstThread.start();

        assertThat(store.published.await(5, TimeUnit.SECONDS)).isTrue();
        var publishedMediaId = store.findById(product.id()).orElseThrow().uploadedMediaId();

        service.deleteProduct(product.id());
        assertThat(store.findById(product.id())).isEmpty();

        store.release.countDown();
        firstThread.join(5_000);

        assertThat(firstFailure.get()).isNull();
        assertThat(firstResult.get().product().id()).isEqualTo(product.id());
        assertThat(firstResult.get().uploadedMediaId()).isEqualTo(publishedMediaId);
    }

    private static Product createProduct(ProductApplicationService service) {
        return service.createProduct("Canvas Tote", "A sturdy everyday tote.", new BigDecimal("12.50"), null);
    }

    private static void upload(
            ProductApplicationService service,
            ProductId id,
            byte[] content,
            AtomicReference<ProductSnapshot> result,
            AtomicReference<Throwable> failure) {
        try {
            result.set(service.uploadMedia(id, content));
        } catch (Throwable throwable) {
            failure.set(throwable);
        }
    }

    private static final class BlockingAfterPublishStore extends InMemoryProductStore {

        private final CountDownLatch published = new CountDownLatch(1);
        private final CountDownLatch release = new CountDownLatch(1);
        private final AtomicBoolean shouldBlock = new AtomicBoolean(true);

        private BlockingAfterPublishStore() {
            super(MediaLimits.MAX_TOTAL_STORED_BYTES);
        }

        @Override
        public MediaChange replaceMedia(ProductId id, UploadedMedia media) {
            var change = super.replaceMedia(id, media);

            if (shouldBlock.compareAndSet(true, false)) {
                published.countDown();
                await(release);
            }

            return change;
        }

        private static void await(CountDownLatch latch) {
            try {
                if (!latch.await(5, TimeUnit.SECONDS)) {
                    throw new IllegalStateException("Timed out waiting for latch");
                }
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Interrupted while waiting for latch", exception);
            }
        }
    }
}
