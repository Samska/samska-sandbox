package io.github.samska.sandbox.catalog.api;

import java.io.IOException;
import java.net.URI;
import java.util.UUID;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import io.github.samska.sandbox.catalog.ProductId;
import io.github.samska.sandbox.catalog.application.InvalidMediaException;
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
        var response = ProductResponse.from(product, null);
        var location = URI.create("/api/products/" + response.id());

        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{id}")
    public ProductResponse updateProduct(
            @PathVariable("id") UUID id,
            @RequestBody UpdateProductRequest request) {
        var snapshot = productApplicationService.updateProduct(
                new ProductId(id), request.name(), request.description(), request.price(), request.mediaKey());

        return ProductResponse.from(snapshot.product(), snapshot.uploadedMediaId());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable("id") UUID id) {
        catalogCartCoordinator.deleteProduct(id);

        return ResponseEntity.noContent().build();
    }

    @PutMapping(path = "/{id}/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProductResponse uploadProductMedia(
            @PathVariable("id") UUID id,
            @RequestParam("file") MultipartFile file) {
        var snapshot = productApplicationService.uploadMedia(new ProductId(id), readBytes(file));

        return ProductResponse.from(snapshot.product(), snapshot.uploadedMediaId());
    }

    @DeleteMapping("/{id}/media")
    public ResponseEntity<Void> removeProductMedia(@PathVariable("id") UUID id) {
        productApplicationService.removeMedia(new ProductId(id));

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/media/{mediaId}")
    public ResponseEntity<byte[]> getProductMedia(
            @PathVariable("id") UUID id,
            @PathVariable("mediaId") UUID mediaId) {
        var media = productApplicationService.getMedia(new ProductId(id), mediaId);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(media.jpegBytes());
    }

    @GetMapping("/{id}")
    public ProductResponse getProduct(@PathVariable("id") UUID id) {
        var snapshot = productApplicationService.getSnapshot(new ProductId(id));

        return ProductResponse.from(snapshot.product(), snapshot.uploadedMediaId());
    }

    @GetMapping
    public List<ProductResponse> listProducts() {
        return productApplicationService.listProducts().stream()
                .map(snapshot -> ProductResponse.from(snapshot.product(), snapshot.uploadedMediaId()))
                .toList();
    }

    private static byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException exception) {
            throw new InvalidMediaException();
        }
    }
}
