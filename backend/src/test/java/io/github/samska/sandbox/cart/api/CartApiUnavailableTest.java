package io.github.samska.sandbox.cart.api;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.context.WebApplicationContext;

import io.github.samska.sandbox.cart.application.CartStore;
import io.github.samska.sandbox.support.NoDatabaseTest;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@NoDatabaseTest
class CartApiUnavailableTest {

    private static final String PRODUCT_BODY =
            "{\"name\":\"Canvas Tote\",\"description\":\"Synthetic test product\",\"price\":12.50}";

    @Autowired
    private WebApplicationContext context;

    @MockitoBean
    private CartStore cartStore;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
        when(cartStore.current()).thenThrow(new DataAccessResourceFailureException("database unavailable"));
        when(cartStore.update(any())).thenThrow(new CannotCreateTransactionException("database unavailable"));
    }

    @Test
    void cartEndpointsReturnTheStableUnavailableCode() throws Exception {
        var productId = createProduct();

        mvc.perform(get("/api/cart"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("cart-store-unavailable"));
        mvc.perform(post("/api/cart/items").contentType("application/json")
                        .content("{\"productId\":\"" + productId + "\",\"quantity\":1}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("cart-store-unavailable"));
        mvc.perform(patch("/api/cart/items/{id}", productId).contentType("application/json")
                        .content("{\"quantity\":2}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("cart-store-unavailable"));
        mvc.perform(delete("/api/cart/items/{id}", productId))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("cart-store-unavailable"));
    }

    @Test
    void paymentInitiationReturnsTheStableUnavailableCode() throws Exception {
        mvc.perform(post("/api/payment-attempts").contentType("application/json")
                        .content("{\"attemptId\":\"" + UUID.randomUUID()
                                + "\",\"cartRevision\":0,\"scenario\":\"approve\"}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("cart-store-unavailable"));
    }

    @Test
    void productDeletionReturnsTheStableUnavailableCodeAndKeepsTheProduct() throws Exception {
        var productId = createProduct();

        mvc.perform(delete("/api/products/{id}", productId))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("cart-store-unavailable"));

        mvc.perform(get("/api/products/{id}", productId)).andExpect(status().isOk());
    }

    private String createProduct() throws Exception {
        var body = mvc.perform(post("/api/products").contentType("application/json").content(PRODUCT_BODY))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return com.jayway.jsonpath.JsonPath.read(body, "$.id");
    }
}
