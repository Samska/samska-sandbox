package io.github.samska.sandbox.catalog.api;

import java.net.URI;
import java.util.UUID;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.samska.sandbox.catalog.ProductId;
import io.github.samska.sandbox.catalog.application.ProductApplicationService;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductApplicationService productApplicationService;

    public ProductController(ProductApplicationService productApplicationService) {
        this.productApplicationService = productApplicationService;
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@RequestBody CreateProductRequest request) {
        var product = productApplicationService.createProduct(request.name(), request.price());
        var response = ProductResponse.from(product);
        var location = URI.create("/api/products/" + response.id());

        return ResponseEntity.created(location).body(response);
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
