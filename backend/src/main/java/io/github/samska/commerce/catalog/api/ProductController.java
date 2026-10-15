package io.github.samska.commerce.catalog.api;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.samska.commerce.catalog.application.ProductService;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@RequestBody CreateProductRequest request) {
        var product = productService.createProduct(
                request.name(), request.description(), request.price(), request.mediaKey());
        var response = ProductResponse.from(product);
        var location = URI.create("/api/products/" + response.id());

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    public List<ProductResponse> listProducts() {
        return productService.listProducts().stream()
                .map(ProductResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public ProductResponse getProduct(@PathVariable("id") UUID id) {
        return ProductResponse.from(productService.getProduct(id));
    }
}
