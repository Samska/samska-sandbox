package io.github.samska.sandbox.catalog;

import java.math.BigDecimal;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class ProductTest {

    private static final ProductId FIRST_ID = new ProductId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
    private static final ProductId SECOND_ID = new ProductId(UUID.fromString("22222222-2222-2222-2222-222222222222"));

    @Test
    void createsProductWithValidState() {
        var price = new BigDecimal("12.50");

        var product = new Product(FIRST_ID, "  Canvas Tote  ", price);

        assertThat(product.id()).isEqualTo(FIRST_ID);
        assertThat(product.name()).isEqualTo("  Canvas Tote  ");
        assertThat(product.price()).isSameAs(price);
    }

    @Test
    void acceptsZeroPrice() {
        var product = new Product(FIRST_ID, "Sample", new BigDecimal("0"));

        assertThat(product.price()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void rejectsNullProductId() {
        assertThatExceptionOfType(InvalidProductException.class)
                .isThrownBy(() -> new Product(null, "Sample", new BigDecimal("12.50")));
    }

    @Test
    void rejectsNullUuidInProductId() {
        assertThatExceptionOfType(InvalidProductException.class)
                .isThrownBy(() -> new ProductId(null));
    }

    @Test
    void rejectsNullName() {
        assertThatExceptionOfType(InvalidProductException.class)
                .isThrownBy(() -> new Product(FIRST_ID, null, new BigDecimal("12.50")));
    }

    @Test
    void rejectsEmptyName() {
        assertThatExceptionOfType(InvalidProductException.class)
                .isThrownBy(() -> new Product(FIRST_ID, "", new BigDecimal("12.50")));
    }

    @Test
    void rejectsWhitespaceOnlyName() {
        assertThatExceptionOfType(InvalidProductException.class)
                .isThrownBy(() -> new Product(FIRST_ID, " \t\n", new BigDecimal("12.50")));
    }

    @Test
    void rejectsNullPrice() {
        assertThatExceptionOfType(InvalidProductException.class)
                .isThrownBy(() -> new Product(FIRST_ID, "Sample", null));
    }

    @Test
    void rejectsNegativePrice() {
        assertThatExceptionOfType(InvalidProductException.class)
                .isThrownBy(() -> new Product(FIRST_ID, "Sample", new BigDecimal("-0.01")));
    }

    @Test
    void renamesProduct() {
        var product = new Product(FIRST_ID, "Sample", new BigDecimal("12.50"));

        product.rename("Renamed sample");

        assertThat(product.name()).isEqualTo("Renamed sample");
    }

    @Test
    void rejectsInvalidRenameAndPreservesName() {
        var product = new Product(FIRST_ID, "Sample", new BigDecimal("12.50"));

        assertThatExceptionOfType(InvalidProductException.class)
                .isThrownBy(() -> product.rename("   "));

        assertThat(product.name()).isEqualTo("Sample");
    }

    @Test
    void changesProductPrice() {
        var product = new Product(FIRST_ID, "Sample", new BigDecimal("12.50"));
        var newPrice = new BigDecimal("18.750");

        product.changePrice(newPrice);

        assertThat(product.price()).isSameAs(newPrice);
    }

    @Test
    void rejectsInvalidPriceChangeAndPreservesPrice() {
        var originalPrice = new BigDecimal("12.50");
        var product = new Product(FIRST_ID, "Sample", originalPrice);

        assertThatExceptionOfType(InvalidProductException.class)
                .isThrownBy(() -> product.changePrice(new BigDecimal("-0.01")));

        assertThat(product.price()).isSameAs(originalPrice);
    }

    @Test
    void productsWithSameIdAreEqualDespiteDifferentMutableState() {
        var firstProduct = new Product(FIRST_ID, "First name", new BigDecimal("12.50"));
        var secondProduct = new Product(FIRST_ID, "Second name", new BigDecimal("18.75"));

        assertThat(firstProduct).isEqualTo(secondProduct);
    }

    @Test
    void equalProductsHaveEqualHashCodes() {
        var firstProduct = new Product(FIRST_ID, "First name", new BigDecimal("12.50"));
        var secondProduct = new Product(FIRST_ID, "Second name", new BigDecimal("18.75"));

        assertThat(firstProduct).hasSameHashCodeAs(secondProduct);
    }

    @Test
    void productsWithDifferentIdsAreNotEqual() {
        var firstProduct = new Product(FIRST_ID, "Sample", new BigDecimal("12.50"));
        var secondProduct = new Product(SECOND_ID, "Sample", new BigDecimal("12.50"));

        assertThat(firstProduct).isNotEqualTo(secondProduct);
    }
}
