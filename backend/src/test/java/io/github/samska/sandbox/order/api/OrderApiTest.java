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

import io.github.samska.sandbox.support.OrderDatabaseTestSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class OrderApiTest extends OrderDatabaseTestSupport {

    private static final String REQUEST = "aaaaaaaa-1111-1111-1111-111111111111";
    private MockMvc mvc;

    @BeforeEach
    void setUp(@Autowired WebApplicationContext context) {
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @Test
    void placesTheOrderFromTheCartEmptiesItAndReplaysByRequest() throws Exception {
        var product = createProduct();
        var revision = addToCart(product);
        var first = mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(body(REQUEST, revision)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderNumber").value(org.hamcrest.Matchers.matchesPattern("SK-\\d{6}")))
                .andExpect(jsonPath("$.cartRevision").value(revision))
                .andExpect(jsonPath("$.items[0].productId").value(product))
                .andExpect(jsonPath("$.items[0].name").value("Canvas Tote"))
                .andExpect(jsonPath("$.total").value(25.00))
                .andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(first, "$.orderId");

        mvc.perform(get("/api/cart")).andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());
        addToCart(product);
        mvc.perform(get("/api/orders/{orderId}", id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(25.00));
        var replay = mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(body(REQUEST, revision)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(replay).isEqualTo(first);
        mvc.perform(get("/api/cart")).andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].productId").value(product));
    }

    @Test
    void refusesAnEmptyChangedOrMalformedRequestAndStoresNothing() throws Exception {
        mvc.perform(get("/api/orders/{id}", REQUEST)).andExpect(status().isNotFound());
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requestId\":\"invalid\",\"cartRevision\":0}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requestId\":\"" + REQUEST + "\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/orders/not-a-uuid")).andExpect(status().isBadRequest());
        // An empty Cart has nothing to order.
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(body(REQUEST, 0)))
                .andExpect(status().isBadRequest());

        var revision = addToCart(createProduct());
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(body(REQUEST, revision - 1)))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("cart-changed"));
        mvc.perform(get("/api/cart")).andExpect(jsonPath("$.items[0].quantity").value(2));
    }

    private static String body(String requestId, long revision) {
        return "{\"requestId\":\"" + requestId + "\",\"cartRevision\":" + revision + "}";
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
}
