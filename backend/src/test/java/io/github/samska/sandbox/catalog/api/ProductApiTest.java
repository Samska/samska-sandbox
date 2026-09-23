package io.github.samska.sandbox.catalog.api;

import java.util.UUID;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
                .andExpect(jsonPath("$.*", hasSize(5)))
                .andExpect(jsonPath("$.id").isString())
                .andExpect(jsonPath("$.name").value("Canvas Tote"))
                .andExpect(jsonPath("$.description").value("A sturdy everyday tote."))
                .andExpect(jsonPath("$.price").value(12.50))
                .andExpect(jsonPath("$.mediaKey").isEmpty())
                .andReturn();

        String id = JsonPath.read(creationResult.getResponse().getContentAsString(), "$.id");
        assertThatCode(() -> UUID.fromString(id)).doesNotThrowAnyException();
        assertThat(creationResult.getResponse().getHeader("Location"))
                .isEqualTo("/api/products/" + id);

        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.*", hasSize(5)))
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").value("Canvas Tote"))
                .andExpect(jsonPath("$.description").value("A sturdy everyday tote."))
                .andExpect(jsonPath("$.price").value(12.50))
                .andExpect(jsonPath("$.mediaKey").isEmpty());

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
                .andExpect(jsonPath("$.*", hasSize(5)))
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
                .andExpect(jsonPath("$.*", hasSize(5)))
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
