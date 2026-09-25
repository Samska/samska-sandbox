package io.github.samska.sandbox.catalog.api;

import java.util.UUID;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.web.context.WebApplicationContext;

import io.github.samska.sandbox.catalog.JpegTestImages;
import io.github.samska.sandbox.catalog.application.MediaLimits;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class ProductApiTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp(@Autowired WebApplicationContext applicationContext) {
        mockMvc = MockMvcBuilders.webAppContextSetup(applicationContext).build();
    }

    @Test
    void createsAndRetrievesProduct() throws Exception {
        var creationResult = mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Canvas Tote",
                                  "description": "A sturdy everyday tote.",
                                  "price": 12.50
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.*", hasSize(6)))
                .andExpect(jsonPath("$.id").isString())
                .andExpect(jsonPath("$.name").value("Canvas Tote"))
                .andExpect(jsonPath("$.description").value("A sturdy everyday tote."))
                .andExpect(jsonPath("$.price").value(12.50))
                .andExpect(jsonPath("$.mediaKey").isEmpty())
                .andExpect(jsonPath("$.uploadedMediaId").isEmpty())
                .andReturn();

        String id = JsonPath.read(creationResult.getResponse().getContentAsString(), "$.id");
        assertThatCode(() -> UUID.fromString(id)).doesNotThrowAnyException();
        assertThat(creationResult.getResponse().getHeader("Location"))
                .isEqualTo("/api/products/" + id);

        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.*", hasSize(6)))
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").value("Canvas Tote"))
                .andExpect(jsonPath("$.description").value("A sturdy everyday tote."))
                .andExpect(jsonPath("$.price").value(12.50))
                .andExpect(jsonPath("$.mediaKey").isEmpty())
                .andExpect(jsonPath("$.uploadedMediaId").isEmpty());

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[*].name", hasItems("Canvas Tote")))
                .andExpect(jsonPath("$[*].description", hasItems("A sturdy everyday tote.")));
    }

    @Test
    void createsProductWithMediaKey() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Canvas Tote",
                                  "description": "A sturdy everyday tote.",
                                  "price": 12.50,
                                  "mediaKey": "canvas-market-tote"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.*", hasSize(6)))
                .andExpect(jsonPath("$.mediaKey").value("canvas-market-tote"));
    }

    @Test
    void acceptsWellFormedMediaKeyWithoutLocalAsset() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Canvas Tote",
                                  "description": "A sturdy everyday tote.",
                                  "price": 12.50,
                                  "mediaKey": "well-formed-but-unmapped"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mediaKey").value("well-formed-but-unmapped"));
    }

    @Test
    void rejectsMalformedMediaKey() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Canvas Tote",
                                  "description": "A sturdy everyday tote.",
                                  "price": 12.50,
                                  "mediaKey": "Canvas_Tote"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
    void returnsEmptyProductCollection() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void rejectsProductThatViolatesDomainInvariant() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "   ",
                                  "description": "A sample product",
                                  "price": 12.50
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsProductWithBlankDescription() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Canvas Tote",
                                  "description": "   ",
                                  "price": 12.50
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsMalformedJson() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsMalformedProductId() throws Exception {
        mockMvc.perform(get("/api/products/not-a-uuid"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void reportsMissingProduct() throws Exception {
        mockMvc.perform(get("/api/products/{id}", "00000000-0000-0000-0000-000000000000"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updatesProductInPlace() throws Exception {
        String id = createProduct("Canvas Tote", "A sturdy everyday tote.", 12.50, null);

        mockMvc.perform(put("/api/products/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Canvas Market Tote",
                                  "description": "A roomier everyday tote.",
                                  "price": 15.25,
                                  "mediaKey": "canvas-market-tote"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.*", hasSize(6)))
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").value("Canvas Market Tote"))
                .andExpect(jsonPath("$.description").value("A roomier everyday tote."))
                .andExpect(jsonPath("$.price").value(15.25))
                .andExpect(jsonPath("$.mediaKey").value("canvas-market-tote"));

        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").value("Canvas Market Tote"))
                .andExpect(jsonPath("$.description").value("A roomier everyday tote."))
                .andExpect(jsonPath("$.price").value(15.25))
                .andExpect(jsonPath("$.mediaKey").value("canvas-market-tote"));
    }

    @Test
    void clearsOptionalMediaKeyOnUpdate() throws Exception {
        String id = createProduct("Canvas Tote", "A sturdy everyday tote.", 12.50, "canvas-market-tote");

        mockMvc.perform(put("/api/products/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Canvas Tote",
                                  "description": "A sturdy everyday tote.",
                                  "price": 12.50
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mediaKey").isEmpty());
    }

    @Test
    void rejectsInvalidUpdateWithoutMutatingProduct() throws Exception {
        String id = createProduct("Canvas Tote", "A sturdy everyday tote.", 12.50, null);

        mockMvc.perform(put("/api/products/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Canvas Tote",
                                  "description": "A sturdy everyday tote.",
                                  "price": -0.01
                                }
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/products/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "   ",
                                  "description": "A sturdy everyday tote.",
                                  "price": 12.50
                                }
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/products/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Canvas Tote",
                                  "description": "   ",
                                  "price": 12.50
                                }
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/products/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Canvas Tote",
                                  "description": "A sturdy everyday tote.",
                                  "price": 12.50,
                                  "mediaKey": "Canvas_Tote"
                                }
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Canvas Tote"))
                .andExpect(jsonPath("$.description").value("A sturdy everyday tote."))
                .andExpect(jsonPath("$.price").value(12.50))
                .andExpect(jsonPath("$.mediaKey").isEmpty());
    }

    @Test
    void reportsMissingProductOnUpdate() throws Exception {
        mockMvc.perform(put("/api/products/{id}", "00000000-0000-0000-0000-000000000000")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Canvas Tote",
                                  "description": "A sturdy everyday tote.",
                                  "price": 12.50
                                }
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void rejectsMalformedUpdateIdAndBody() throws Exception {
        mockMvc.perform(put("/api/products/{id}", "not-a-uuid")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Canvas Tote",
                                  "description": "A sturdy everyday tote.",
                                  "price": 12.50
                                }
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/products/{id}", "11111111-1111-1111-1111-111111111111")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deletesProductThatIsNotInTheCart() throws Exception {
        String id = createProduct("Canvas Tote", "A sturdy everyday tote.", 12.50, null);

        mockMvc.perform(delete("/api/products/{id}", id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", not(hasItems(id))));
    }

    @Test
    void reportsMissingProductOnDelete() throws Exception {
        mockMvc.perform(delete("/api/products/{id}", "00000000-0000-0000-0000-000000000000"))
                .andExpect(status().isNotFound());
    }

    @Test
    void rejectsMalformedDeleteId() throws Exception {
        mockMvc.perform(delete("/api/products/{id}", "not-a-uuid"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void refusesDeletionWhileProductIsInTheCart() throws Exception {
        String id = createProduct("Canvas Tote", "A sturdy everyday tote.", 12.50, null);

        mockMvc.perform(post("/api/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + id + "\",\"quantity\":2}"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/products/{id}", id))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Canvas Tote"))
                .andExpect(jsonPath("$.price").value(12.50));

        mockMvc.perform(get("/api/cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].productId").value(id))
                .andExpect(jsonPath("$.items[0].name").value("Canvas Tote"))
                .andExpect(jsonPath("$.items[0].quantity").value(2))
                .andExpect(jsonPath("$.items[0].unitPrice").value(12.50))
                .andExpect(jsonPath("$.total").value(25.00));

        mockMvc.perform(delete("/api/cart/items/{productId}", id))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/products/{id}", id))
                .andExpect(status().isNoContent());
    }

    @Test
    void reportsUnavailableProductWhenAddingAfterDeletion() throws Exception {
        String id = createProduct("Canvas Tote", "A sturdy everyday tote.", 12.50, null);

        mockMvc.perform(delete("/api/products/{id}", id))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + id + "\",\"quantity\":1}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void uploadsMediaAndServesOnlyTheCurrentMediaId() throws Exception {
        String id = createProduct("Canvas Tote", "A sturdy everyday tote.", 12.50, null);
        String mediaId = uploadMedia(id, JpegTestImages.jpeg(320, 200));

        byte[] image = mockMvc.perform(get("/api/products/{id}/media/{mediaId}", id, mediaId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_JPEG))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Cache-Control", "no-store"))
                .andReturn()
                .getResponse()
                .getContentAsByteArray();

        assertThat(image.length).isGreaterThan(0);
        assertThat(image[0] & 0xFF).isEqualTo(0xFF);
        assertThat(image[1] & 0xFF).isEqualTo(0xD8);

        mockMvc.perform(get("/api/products/{id}/media/{mediaId}", id, UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    void replacesMediaAndStopsServingThePreviousId() throws Exception {
        String id = createProduct("Canvas Tote", "A sturdy everyday tote.", 12.50, null);
        String firstMediaId = uploadMedia(id, JpegTestImages.jpeg(320, 200));
        String secondMediaId = uploadMedia(id, JpegTestImages.jpeg(64, 64));

        assertThat(secondMediaId).isNotEqualTo(firstMediaId);

        mockMvc.perform(get("/api/products/{id}/media/{mediaId}", id, firstMediaId))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/products/{id}/media/{mediaId}", id, secondMediaId))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.uploadedMediaId").value(secondMediaId));
    }

    @Test
    void preservesUploadedMediaThroughFullProductUpdate() throws Exception {
        String id = createProduct("Canvas Tote", "A sturdy everyday tote.", 12.50, "canvas-market-tote");
        String mediaId = uploadMedia(id, JpegTestImages.jpeg(320, 200));

        mockMvc.perform(put("/api/products/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Canvas Market Tote",
                                  "description": "A roomier everyday tote.",
                                  "price": 15.25,
                                  "mediaKey": "canvas-market-tote"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Canvas Market Tote"))
                .andExpect(jsonPath("$.mediaKey").value("canvas-market-tote"))
                .andExpect(jsonPath("$.uploadedMediaId").value(mediaId));

        mockMvc.perform(get("/api/products/{id}/media/{mediaId}", id, mediaId))
                .andExpect(status().isOk());
    }

    @Test
    void removesUploadedMediaAndReportsAbsence() throws Exception {
        String id = createProduct("Canvas Tote", "A sturdy everyday tote.", 12.50, "canvas-market-tote");
        String mediaId = uploadMedia(id, JpegTestImages.jpeg(320, 200));

        mockMvc.perform(delete("/api/products/{id}/media", id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mediaKey").value("canvas-market-tote"))
                .andExpect(jsonPath("$.uploadedMediaId").isEmpty());
        mockMvc.perform(get("/api/products/{id}/media/{mediaId}", id, mediaId))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/products/{id}/media", id))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/products/{id}/media", UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    void rejectsNonJpegMediaWithoutChangingTheCurrentImage() throws Exception {
        String id = createProduct("Canvas Tote", "A sturdy everyday tote.", 12.50, null);
        String mediaId = uploadMedia(id, JpegTestImages.jpeg(320, 200));

        mockMvc.perform(mediaUpload(id, "note.txt", "text/plain", "not an image".getBytes()))
                .andExpect(status().isUnsupportedMediaType());

        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.uploadedMediaId").value(mediaId));
        mockMvc.perform(get("/api/products/{id}/media/{mediaId}", id, mediaId))
                .andExpect(status().isOk());
    }

    @Test
    void rejectsMalformedJpeg() throws Exception {
        String id = createProduct("Canvas Tote", "A sturdy everyday tote.", 12.50, null);

        mockMvc.perform(mediaUpload(id, "broken.jpg", "image/jpeg",
                        new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x01, 0x02, 0x03}))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsOversizedInputFile() throws Exception {
        String id = createProduct("Canvas Tote", "A sturdy everyday tote.", 12.50, null);
        byte[] oversized = new byte[(int) MediaLimits.MAX_INPUT_BYTES + 1];
        oversized[0] = (byte) 0xFF;
        oversized[1] = (byte) 0xD8;
        oversized[2] = (byte) 0xFF;

        mockMvc.perform(mediaUpload(id, "large.jpg", "image/jpeg", oversized))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(content().json("{\"code\":\"media-limit-exceeded\"}"));
    }

    @Test
    void rejectsExcessiveDimensionsAndPixels() throws Exception {
        String id = createProduct("Canvas Tote", "A sturdy everyday tote.", 12.50, null);

        mockMvc.perform(mediaUpload(id, "wide.jpg", "image/jpeg", JpegTestImages.jpeg(2049, 1)))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(content().json("{\"code\":\"media-limit-exceeded\"}"));
        mockMvc.perform(mediaUpload(id, "huge.jpg", "image/jpeg", JpegTestImages.jpeg(2048, 2048)))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(content().json("{\"code\":\"media-limit-exceeded\"}"));

        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.uploadedMediaId").isEmpty());
    }

    @Test
    void rejectsMissingOrEmptyFilePart() throws Exception {
        String id = createProduct("Canvas Tote", "A sturdy everyday tote.", 12.50, null);

        mockMvc.perform(multipart("/api/products/{id}/media", id)
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isBadRequest());

        mockMvc.perform(mediaUpload(id, "empty.jpg", "image/jpeg", new byte[0]))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void reportsMissingProductAndMalformedIdsForMediaOperations() throws Exception {
        mockMvc.perform(mediaUpload(UUID.randomUUID().toString(), "photo.jpg", "image/jpeg",
                        JpegTestImages.jpeg(16, 16)))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/products/{id}/media/{mediaId}", "not-a-uuid", UUID.randomUUID()))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/products/{id}/media/{mediaId}", UUID.randomUUID(), "not-a-uuid"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void refusesDeletionWhileProductWithMediaIsInTheCartAndReleasesMediaAfterDeletion() throws Exception {
        String id = createProduct("Canvas Tote", "A sturdy everyday tote.", 12.50, null);
        String mediaId = uploadMedia(id, JpegTestImages.jpeg(320, 200));

        mockMvc.perform(post("/api/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + id + "\",\"quantity\":1}"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/products/{id}", id))
                .andExpect(status().isConflict());
        mockMvc.perform(get("/api/products/{id}/media/{mediaId}", id, mediaId))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/cart/items/{productId}", id))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/products/{id}", id))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/products/{id}/media/{mediaId}", id, mediaId))
                .andExpect(status().isNotFound());
    }

    private static MockMultipartHttpServletRequestBuilder mediaUpload(
            String id, String fileName, String contentType, byte[] content) {
        return multipart("/api/products/{id}/media", id)
                .file(new MockMultipartFile("file", fileName, contentType, content))
                .with(request -> {
                    request.setMethod("PUT");
                    return request;
                });
    }

    private String uploadMedia(String productId, byte[] jpeg) throws Exception {
        var result = mockMvc.perform(mediaUpload(productId, "photo.jpg", "image/jpeg", jpeg))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.*", hasSize(6)))
                .andExpect(jsonPath("$.uploadedMediaId").isString())
                .andReturn();

        return JsonPath.read(result.getResponse().getContentAsString(), "$.uploadedMediaId");
    }

    private String createProduct(String name, String description, double price, String mediaKey) throws Exception {
        var mediaField = mediaKey == null ? "" : ", \"mediaKey\": \"" + mediaKey + "\"";
        var result = mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"description\":\"" + description + "\",\"price\":" + price + mediaField + "}"))
                .andExpect(status().isCreated())
                .andReturn();

        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }
}
