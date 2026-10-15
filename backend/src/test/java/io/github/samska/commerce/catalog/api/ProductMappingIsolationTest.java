package io.github.samska.commerce.catalog.api;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import io.github.samska.commerce.CommerceApplication;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = CommerceApplication.class)
class ProductMappingIsolationTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void productMappingsAreExclusiveAndComplete() {
        var handlerMapping = applicationContext.getBean("requestMappingHandlerMapping", RequestMappingHandlerMapping.class);
        var patterns = handlerMapping.getHandlerMethods().keySet().stream()
                .flatMap(info -> info.getPatternValues().stream())
                .filter(path -> path.startsWith("/api/products") || path.startsWith("/api/rebuild"))
                .distinct()
                .sorted()
                .toList();

        assertThat(patterns).containsExactlyInAnyOrder(
                "/api/products",
                "/api/products/{id}",
                "/api/rebuild/runtime");
    }

    @Test
    void onlyOneProductControllerExists() {
        var controllers = List.of(
                applicationContext.getBeanNamesForType(ProductController.class));

        assertThat(controllers).hasSize(1);
    }
}
