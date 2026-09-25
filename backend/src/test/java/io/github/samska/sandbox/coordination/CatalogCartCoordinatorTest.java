package io.github.samska.sandbox.coordination;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.cart.ProductReference;
import io.github.samska.sandbox.cart.application.CartApplicationService;
import io.github.samska.sandbox.cart.application.ProductUnavailableException;
import io.github.samska.sandbox.cart.storage.InMemoryCartStore;
import io.github.samska.sandbox.catalog.Product;
import io.github.samska.sandbox.catalog.ProductId;
import io.github.samska.sandbox.catalog.application.MediaLimits;
import io.github.samska.sandbox.catalog.application.ProductApplicationService;
import io.github.samska.sandbox.catalog.application.ProductCatalog;
import io.github.samska.sandbox.catalog.application.ProductMediaNormalizer;
import io.github.samska.sandbox.catalog.application.ProductNotFoundException;
import io.github.samska.sandbox.catalog.storage.InMemoryProductStore;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class CatalogCartCoordinatorTest {

    private static final ProductMediaNormalizer MEDIA_NORMALIZER = new ProductMediaNormalizer(
            MediaLimits.MAX_INPUT_BYTES,
            MediaLimits.MAX_DIMENSION_PIXELS,
            MediaLimits.MAX_PIXELS,
            MediaLimits.MAX_OUTPUT_BYTES);

    private final InMemoryProductStore productStore = new InMemoryProductStore(MediaLimits.MAX_TOTAL_STORED_BYTES);
    private final InMemoryCartStore cartStore = new InMemoryCartStore();
    private final ProductApplicationService productApplicationService =
            new ProductApplicationService(productStore, MEDIA_NORMALIZER);
    private final CartApplicationService cartApplicationService =
            new CartApplicationService(cartStore, productApplicationService);
    private final CatalogCartCoordinator coordinator =
            new CatalogCartCoordinator(cartApplicationService, productApplicationService);

    @Test
    void deletesProductThatIsNotInTheCart() {
        var product = createProduct();

        coordinator.deleteProduct(product.id().value());

        assertThat(productStore.findById(product.id())).isEmpty();
    }

    @Test
    void reportsMissingProductOnDelete() {
        assertThatExceptionOfType(ProductNotFoundException.class)
                .isThrownBy(() -> coordinator.deleteProduct(UUID.randomUUID()));
    }

    @Test
    void refusesDeletionAfterTheProductIsAddedToTheCart() {
        var product = createProduct();

        coordinator.addItem(product.id().value(), 1);

        assertThatExceptionOfType(ProductInCurrentCartException.class)
                .isThrownBy(() -> coordinator.deleteProduct(product.id().value()));
        assertThat(productStore.findById(product.id())).isPresent();
        assertThat(cartStore.current().hasItem(new ProductReference(product.id().value()))).isTrue();
    }

    @Test
    void reportsUnavailableProductWhenAddingAfterDeletion() {
        var product = createProduct();

        coordinator.deleteProduct(product.id().value());

        assertThatExceptionOfType(ProductUnavailableException.class)
                .isThrownBy(() -> coordinator.addItem(product.id().value(), 1));
        assertThat(productStore.findById(product.id())).isEmpty();
        assertThat(cartStore.current().items()).isEmpty();
    }

    @Test
    void deletionWaitsForAnInFlightAdditionAndThenConflicts() throws Exception {
        var product = createProduct();
        var lookupStarted = new CountDownLatch(1);
        var releaseLookup = new CountDownLatch(1);
        ProductCatalog blockingCatalog = productId -> {
            lookupStarted.countDown();
            await(releaseLookup);
            return productApplicationService.findById(productId);
        };
        var coordinatorWithBlockingAdd = new CatalogCartCoordinator(
                new CartApplicationService(cartStore, blockingCatalog), productApplicationService);

        var additionResult = new AtomicReference<Throwable>();
        var deletionResult = new AtomicReference<Throwable>();
        var deletionFinished = new CountDownLatch(1);

        var additionThread = new Thread(() -> {
            try {
                coordinatorWithBlockingAdd.addItem(product.id().value(), 1);
            } catch (Throwable throwable) {
                additionResult.set(throwable);
            }
        });
        var deletionThread = new Thread(() -> {
            try {
                coordinatorWithBlockingAdd.deleteProduct(product.id().value());
            } catch (Throwable throwable) {
                deletionResult.set(throwable);
            } finally {
                deletionFinished.countDown();
            }
        });

        additionThread.start();
        assertThat(lookupStarted.await(5, TimeUnit.SECONDS)).isTrue();

        deletionThread.start();
        assertThat(deletionFinished.await(200, TimeUnit.MILLISECONDS)).isFalse();

        releaseLookup.countDown();
        additionThread.join(5_000);
        deletionThread.join(5_000);

        assertThat(additionResult.get()).isNull();
        assertThat(deletionResult.get()).isInstanceOf(ProductInCurrentCartException.class);
        assertThat(productStore.findById(product.id())).isPresent();
        assertThat(cartStore.current().hasItem(new ProductReference(product.id().value()))).isTrue();
    }

    @Test
    void additionWaitsForAnInFlightDeletionAndThenFindsNoProduct() throws Exception {
        var product = createProduct();
        var deletionStarted = new CountDownLatch(1);
        var releaseDeletion = new CountDownLatch(1);
        var blockingProductService = new ProductApplicationService(productStore, MEDIA_NORMALIZER) {
            @Override
            public void deleteProduct(ProductId id) {
                deletionStarted.countDown();
                await(releaseDeletion);
                super.deleteProduct(id);
            }
        };
        var coordinatorWithBlockingDelete = new CatalogCartCoordinator(
                new CartApplicationService(cartStore, blockingProductService), blockingProductService);

        var additionResult = new AtomicReference<Throwable>();
        var deletionResult = new AtomicReference<Throwable>();
        var additionFinished = new CountDownLatch(1);

        var deletionThread = new Thread(() -> {
            try {
                coordinatorWithBlockingDelete.deleteProduct(product.id().value());
            } catch (Throwable throwable) {
                deletionResult.set(throwable);
            }
        });
        var additionThread = new Thread(() -> {
            try {
                coordinatorWithBlockingDelete.addItem(product.id().value(), 1);
            } catch (Throwable throwable) {
                additionResult.set(throwable);
            } finally {
                additionFinished.countDown();
            }
        });

        deletionThread.start();
        assertThat(deletionStarted.await(5, TimeUnit.SECONDS)).isTrue();

        additionThread.start();
        assertThat(additionFinished.await(200, TimeUnit.MILLISECONDS)).isFalse();

        releaseDeletion.countDown();
        deletionThread.join(5_000);
        additionThread.join(5_000);

        assertThat(deletionResult.get()).isNull();
        assertThat(additionResult.get()).isInstanceOf(ProductUnavailableException.class);
        assertThat(productStore.findById(product.id())).isEmpty();
        assertThat(cartStore.current().items()).isEmpty();
    }

    private Product createProduct() {
        return productApplicationService.createProduct(
                "Canvas Tote", "A sturdy everyday tote.", new BigDecimal("12.50"), null);
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
