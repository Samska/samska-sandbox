package io.github.samska.commerce;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import io.github.samska.commerce.catalog.api.ProductController;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class CommerceApplicationTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void contextLoadsWithCommerceController() {
        assertThat(applicationContext.getBean(ProductController.class)).isNotNull();
    }

    @Test
    void doesNotLoadLegacyApplication() {
        assertThat(applicationContext.containsBean("samskaSandboxApplication")).isFalse();
    }
}
