package io.github.samska.commerce.catalog.application;

import java.math.BigDecimal;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import io.github.samska.commerce.catalog.domain.Product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InMemoryProductStoreTest {

    private InMemoryProductStore store;

    @BeforeEach
    void setUp() {
        store = new InMemoryProductStore();
    }

    @Test
    void storesProduct() {
        var product = product("First");
        store.save(product);

        assertThat(store.findById(product.id())).hasValue(product);
    }

    @Test
    void rejectsDuplicateId() {
        var product = product("First");
        store.save(product);

        assertThatThrownBy(() -> store.save(product))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void returnsEmptyForUnknownId() {
        assertThat(store.findById(UUID.randomUUID())).isEmpty();
    }

    @Test
    void listsProductsInInsertionOrder() {
        var first = product("First");
        var second = product("Second");
        var third = product("Third");

        store.save(first);
        store.save(second);
        store.save(third);

        assertThat(store.findAll())
                .containsExactly(first, second, third);
    }

    @Test
    void returnedCollectionIsIndependentSnapshot() {
        var product = product("First");
        store.save(product);

        var firstList = store.findAll();
        store.save(product("Second"));
        var secondList = store.findAll();

        assertThat(firstList).hasSize(1);
        assertThat(secondList).hasSize(2);
    }

    private static Product product(String name) {
        return new Product(UUID.randomUUID(), name, "Description for " + name, BigDecimal.ONE, null);
    }
}
