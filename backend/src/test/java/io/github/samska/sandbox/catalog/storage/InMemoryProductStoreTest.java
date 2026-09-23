package io.github.samska.sandbox.catalog.storage;

import java.math.BigDecimal;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.catalog.Product;
import io.github.samska.sandbox.catalog.ProductId;

import static org.assertj.core.api.Assertions.assertThat;

class InMemoryProductStoreTest {

    private static final ProductId PRODUCT_ID =
            new ProductId(UUID.fromString("11111111-1111-1111-1111-111111111111"));

    private final InMemoryProductStore store = new InMemoryProductStore();

    @Test
    void replacesExistingProduct() {
        store.save(new Product(PRODUCT_ID, "First name", "First description", new BigDecimal("12.50")));

        var replacement = new Product(
                PRODUCT_ID, "Second name", "Second description", new BigDecimal("18.75"), "canvas-market-tote");

        assertThat(store.replace(replacement)).isTrue();
        assertThat(store.findById(PRODUCT_ID)).get().isSameAs(replacement);
    }

    @Test
    void refusesToReplaceAbsentProduct() {
        var product = new Product(PRODUCT_ID, "Sample", "A sample product", new BigDecimal("12.50"));

        assertThat(store.replace(product)).isFalse();
        assertThat(store.findById(PRODUCT_ID)).isEmpty();
    }

    @Test
    void deletesExistingProduct() {
        store.save(new Product(PRODUCT_ID, "Sample", "A sample product", new BigDecimal("12.50")));

        assertThat(store.deleteById(PRODUCT_ID)).isTrue();
        assertThat(store.findById(PRODUCT_ID)).isEmpty();
        assertThat(store.findAll()).isEmpty();
    }

    @Test
    void refusesToDeleteAbsentProduct() {
        assertThat(store.deleteById(PRODUCT_ID)).isFalse();
    }
}
