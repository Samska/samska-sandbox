package io.github.samska.commerce.catalog.domain;

import java.math.BigDecimal;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductTest {

    @Test
    void createsValidProduct() {
        var id = UUID.randomUUID();
        var product = new Product(id, "Canvas Tote", "A sturdy everyday tote.", new BigDecimal("12.50"), "canvas-tote");

        assertThat(product.id()).isEqualTo(id);
        assertThat(product.name()).isEqualTo("Canvas Tote");
        assertThat(product.description()).isEqualTo("A sturdy everyday tote.");
        assertThat(product.price()).isEqualTo(new BigDecimal("12.50"));
        assertThat(product.mediaKey()).isEqualTo("canvas-tote");
    }

    @Test
    void acceptsNullMediaKey() {
        var product = new Product(UUID.randomUUID(), "Canvas Tote", "A sturdy everyday tote.", new BigDecimal("12.50"), null);

        assertThat(product.mediaKey()).isNull();
    }

    @Test
    void acceptsZeroPrice() {
        var product = new Product(UUID.randomUUID(), "Free item", "A free item.", BigDecimal.ZERO, null);

        assertThat(product.price()).isEqualTo(BigDecimal.ZERO);
    }

    @Test
    void acceptsHighScalePrice() {
        var product = new Product(UUID.randomUUID(), "Precise", "Precise price.", new BigDecimal("12.3456"), null);

        assertThat(product.price()).isEqualTo(new BigDecimal("12.3456"));
    }

    @Test
    void preservesSurroundingWhitespaceInText() {
        var product = new Product(UUID.randomUUID(), "  Canvas Tote  ", "  Description  ", new BigDecimal("1.00"), null);

        assertThat(product.name()).isEqualTo("  Canvas Tote  ");
        assertThat(product.description()).isEqualTo("  Description  ");
    }

    @Test
    void rejectsBlankName() {
        assertThatThrownBy(() -> new Product(UUID.randomUUID(), "   ", "Description", BigDecimal.ONE, null))
                .isInstanceOf(InvalidProductException.class);
    }

    @Test
    void rejectsNullName() {
        assertThatThrownBy(() -> new Product(UUID.randomUUID(), null, "Description", BigDecimal.ONE, null))
                .isInstanceOf(InvalidProductException.class);
    }

    @Test
    void rejectsBlankDescription() {
        assertThatThrownBy(() -> new Product(UUID.randomUUID(), "Name", "   ", BigDecimal.ONE, null))
                .isInstanceOf(InvalidProductException.class);
    }

    @Test
    void rejectsNullPrice() {
        assertThatThrownBy(() -> new Product(UUID.randomUUID(), "Name", "Description", null, null))
                .isInstanceOf(InvalidProductException.class);
    }

    @Test
    void rejectsNegativePrice() {
        assertThatThrownBy(() -> new Product(UUID.randomUUID(), "Name", "Description", new BigDecimal("-0.01"), null))
                .isInstanceOf(InvalidProductException.class);
    }

    @Test
    void rejectsEmptyMediaKey() {
        assertThatThrownBy(() -> new Product(UUID.randomUUID(), "Name", "Description", BigDecimal.ONE, ""))
                .isInstanceOf(InvalidProductException.class);
    }

    @Test
    void rejectsUppercaseMediaKey() {
        assertThatThrownBy(() -> new Product(UUID.randomUUID(), "Name", "Description", BigDecimal.ONE, "Canvas-Tote"))
                .isInstanceOf(InvalidProductException.class);
    }

    @Test
    void rejectsInvalidSlugMediaKey() {
        assertThatThrownBy(() -> new Product(UUID.randomUUID(), "Name", "Description", BigDecimal.ONE, "canvas_tote"))
                .isInstanceOf(InvalidProductException.class);
    }

    @Test
    void rejectsTooLongMediaKey() {
        assertThatThrownBy(() -> new Product(UUID.randomUUID(), "Name", "Description", BigDecimal.ONE, "a".repeat(41)))
                .isInstanceOf(InvalidProductException.class);
    }

    @Test
    void productsWithSameIdAreEqual() {
        var id = UUID.randomUUID();
        var first = new Product(id, "One", "First", BigDecimal.ONE, null);
        var second = new Product(id, "Two", "Second", new BigDecimal("2.00"), "key");

        assertThat(first).isEqualTo(second);
        assertThat(first.hashCode()).isEqualTo(second.hashCode());
    }

    @Test
    void productsWithDifferentIdsAreNotEqual() {
        var first = new Product(UUID.randomUUID(), "One", "First", BigDecimal.ONE, null);
        var second = new Product(UUID.randomUUID(), "One", "First", BigDecimal.ONE, null);

        assertThat(first).isNotEqualTo(second);
    }
}
