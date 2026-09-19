package io.github.samska.sandbox.cart.api;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class CartApiTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp(@Autowired WebApplicationContext applicationContext) {
        mockMvc = MockMvcBuilders.webAppContextSetup(applicationContext).build();
    }

    @Test
    void returnsEmptyCartWithoutAnIdentityField() throws Exception {
        mockMvc.perform(get("/api/cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty())
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void addsUpdatesAndRemovesKnownProduct() throws Exception {
        String productId = createProduct();

        mockMvc.perform(post("/api/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + productId + "\",\"quantity\":2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].productId").value(productId))
                .andExpect(jsonPath("$.items[0].quantity").value(2))
                .andExpect(jsonPath("$.items[0].unitPrice").value(12.50))
                .andExpect(jsonPath("$.items[0].lineSubtotal").value(25.00))
                .andExpect(jsonPath("$.total").value(25.00));

        mockMvc.perform(post("/api/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + productId + "\",\"quantity\":3}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].quantity").value(5))
                .andExpect(jsonPath("$.total").value(62.50));

        mockMvc.perform(patch("/api/cart/items/{productId}", productId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].quantity").value(4))
                .andExpect(jsonPath("$.total").value(50.00));

        mockMvc.perform(delete("/api/cart/items/{productId}", productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty())
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void rejectsInvalidQuantityAndUnavailableProduct() throws Exception {
        String productId = "11111111-1111-1111-1111-111111111111";

        mockMvc.perform(post("/api/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + productId + "\",\"quantity\":0}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + productId + "\",\"quantity\":1}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void reportsMalformedProductIdAndMissingCartItem() throws Exception {
        mockMvc.perform(patch("/api/cart/items/{productId}", "not-a-uuid")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":1}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(delete("/api/cart/items/{productId}", "11111111-1111-1111-1111-111111111111"))
                .andExpect(status().isNotFound());
    }

    private String createProduct() throws Exception {
        var result = mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Canvas Tote\",\"price\":12.50}"))
                .andExpect(status().isCreated())
                .andReturn();

        String id = JsonPath.read(result.getResponse().getContentAsString(), "$.id");
        assertThat(id).isNotBlank();
        return id;
    }
}
