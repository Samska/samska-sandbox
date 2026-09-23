package io.github.samska.sandbox.catalog.api;

import java.net.URI;
import java.util.UUID;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.samska.sandbox.catalog.ProductId;
import io.github.samska.sandbox.catalog.application.ProductApplicationService;
import io.github.samska.sandbox.coordination.CatalogCartCoordinator;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductApplicationService productApplicationService;
    private final CatalogCartCoordinator catalogCartCoordinator;

    public ProductController(
            ProductApplicationService productApplicationService,
            CatalogCartCoordinator catalogCartCoordinator) {
        this.productApplicationService = productApplicationService;
        this.catalogCartCoordinator = catalogCartCoordinator;
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@RequestBody CreateProductRequest request) {
        var product = productApplicationService.createProduct(
                request.name(), request.description(), request.price(), request.mediaKey());
        var response = ProductResponse.from(product);
        var location = URI.create("/api/products/" + response.id());

        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{id}")
    public ProductResponse updateProduct(
            @PathVariable("id") UUID id,
            @RequestBody UpdateProductRequest request) {
        var product = productApplicationService.updateProduct(
                new ProductId(id), request.name(), request.description(), request.price(), request.mediaKey());

        return ProductResponse.from(product);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable("id") UUID id) {
        catalogCartCoordinator.deleteProduct(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ProductResponse getProduct(@PathVariable("id") UUID id) {
        return ProductResponse.from(productApplicationService.getProduct(new ProductId(id)));
    }

    @GetMapping
    public List<ProductResponse> listProducts() {
        return productApplicationService.listProducts().stream()
                .map(ProductResponse::from)
                .toList();
    }
}
