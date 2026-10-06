package io.github.samska.sandbox.journey;

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
class FirstOrderJourneyApiTest {

    private static final String ATTEMPT = "aaaaaaaa-1111-1111-1111-111111111111";
    private MockMvc mvc;

    @BeforeEach
    void setUp(@Autowired WebApplicationContext context) {
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @Test
    void completesTheFirstOrderJourneyWithFrozenOrderAndReplay() throws Exception {
        var productId = createProduct();
        var firstRevision = addToCart(productId, 2);
        var reviewedRevision = updateQuantity(productId, 3);

        assertThat(reviewedRevision).isEqualTo(firstRevision + 1);

        mvc.perform(post("/api/payment-attempts").contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody(ATTEMPT, reviewedRevision, "approve")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("approved"))
                .andExpect(jsonPath("$.cartRevision").value(reviewedRevision))
                .andExpect(jsonPath("$.items[0].quantity").value(3))
                .andExpect(jsonPath("$.total").value(37.50));

        var createdOrder = mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentAttemptId\":\"" + ATTEMPT + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paymentAttemptId").value(ATTEMPT))
                .andExpect(jsonPath("$.cartRevision").value(reviewedRevision))
                .andExpect(jsonPath("$.items[0].productId").value(productId))
                .andExpect(jsonPath("$.items[0].name").value("Canvas Tote"))
                .andExpect(jsonPath("$.items[0].unitPrice").value(12.50))
                .andExpect(jsonPath("$.items[0].quantity").value(3))
                .andExpect(jsonPath("$.items[0].lineSubtotal").value(37.50))
                .andExpect(jsonPath("$.total").value(37.50))
                .andReturn().getResponse().getContentAsString();
        String orderId = JsonPath.read(createdOrder, "$.orderId");

        mvc.perform(get("/api/orders/{orderId}", orderId)).andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(37.50));

        mvc.perform(get("/api/orders/payment-attempts/{attemptId}", ATTEMPT)).andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(orderId));

        mvc.perform(get("/api/payment-attempts/{attemptId}", ATTEMPT)).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("approved"))
                .andExpect(jsonPath("$.total").value(37.50));

        var replay = mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentAttemptId\":\"" + ATTEMPT + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(replay).isEqualTo(createdOrder);

        var laterRevision = updateQuantity(productId, 5);

        mvc.perform(get("/api/orders/{orderId}", orderId)).andExpect(status().isOk())
                .andExpect(jsonPath("$.cartRevision").value(reviewedRevision))
                .andExpect(jsonPath("$.items[0].quantity").value(3))
                .andExpect(jsonPath("$.total").value(37.50));

        mvc.perform(get("/api/cart")).andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(laterRevision))
                .andExpect(jsonPath("$.items[0].quantity").value(5))
                .andExpect(jsonPath("$.total").value(62.50));
    }

    private String createProduct() throws Exception {
        var json = mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Canvas Tote\",\"description\":\"Synthetic tote\",\"price\":12.50}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.id");
    }

    private long addToCart(String productId, int quantity) throws Exception {
        var json = mvc.perform(post("/api/cart/items").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + productId + "\",\"quantity\":" + quantity + "}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(json, "$.revision")).longValue();
    }

    private long updateQuantity(String productId, int quantity) throws Exception {
        var json = mvc.perform(patch("/api/cart/items/{productId}", productId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":" + quantity + "}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(json, "$.revision")).longValue();
    }

    private static String initiateBody(String attemptId, long cartRevision, String scenario) {
        return "{\"attemptId\":\"" + attemptId + "\",\"cartRevision\":" + cartRevision
                + ",\"scenario\":\"" + scenario + "\"}";
    }
}
