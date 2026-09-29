package io.github.samska.sandbox.order.api;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class OrderApiTest {

    private static final String ATTEMPT = "aaaaaaaa-1111-1111-1111-111111111111";
    private MockMvc mvc;

    @BeforeEach
    void setUp(@Autowired WebApplicationContext context) {
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @Test
    void createsFromApprovedSnapshotAndReplaysByAttemptAfterCartEdits() throws Exception {
        var product = createProduct();
        var revision = addToCart(product);
        payment(ATTEMPT, revision, "approve");
        var first = mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentAttemptId\":\"" + ATTEMPT + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paymentAttemptId").value(ATTEMPT))
                .andExpect(jsonPath("$.cartRevision").value(revision))
                .andExpect(jsonPath("$.items[0].productId").value(product))
                .andExpect(jsonPath("$.items[0].name").value("Canvas Tote"))
                .andExpect(jsonPath("$.total").value(25.00))
                .andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(first, "$.orderId");

        mvc.perform(patch("/api/cart/items/" + product).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].quantity").value(5));
        mvc.perform(get("/api/orders/{orderId}", id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(25.00));
        mvc.perform(get("/api/orders/payment-attempts/{id}", ATTEMPT)).andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(id));
        var replay = mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentAttemptId\":\"" + ATTEMPT + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(replay).isEqualTo(first);
    }

    @Test
    void refusesUnknownDeclinedAndMalformedRequests() throws Exception {
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentAttemptId\":\"" + ATTEMPT + "\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/orders/payment-attempts/{id}", ATTEMPT)).andExpect(status().isNotFound());
        mvc.perform(get("/api/orders/{id}", ATTEMPT)).andExpect(status().isNotFound());
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentAttemptId\":\"invalid\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/orders/not-a-uuid")).andExpect(status().isBadRequest());

        var revision = addToCart(createProduct());
        payment(ATTEMPT, revision, "decline");
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentAttemptId\":\"" + ATTEMPT + "\"}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("payment-not-approved"));
    }

    private String createProduct() throws Exception {
        var json = mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Canvas Tote\",\"description\":\"Synthetic tote\",\"price\":12.50}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.id");
    }

    private long addToCart(String product) throws Exception {
        var json = mvc.perform(post("/api/cart/items").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + product + "\",\"quantity\":2}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(json, "$.revision")).longValue();
    }

    private void payment(String id, long revision, String scenario) throws Exception {
        mvc.perform(post("/api/payment-attempts").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"attemptId\":\"" + id + "\",\"cartRevision\":" + revision
                                + ",\"scenario\":\"" + scenario + "\"}"))
                .andExpect(status().isCreated());
    }
}
