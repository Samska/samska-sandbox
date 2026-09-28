package io.github.samska.sandbox.payment.api;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class PaymentApiTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp(@Autowired WebApplicationContext applicationContext) {
        mockMvc = MockMvcBuilders.webAppContextSetup(applicationContext).build();
    }

    @Test
    void initiatesApprovedAttemptWithFrozenSnapshotAndRetrievesIt() throws Exception {
        var productId = createProduct();
        long revision = addToCart(productId, 2);
        var attemptId = "aaaaaaaa-1111-1111-1111-111111111111";

        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody(attemptId, revision, "approve")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.attemptId").value(attemptId))
                .andExpect(jsonPath("$.status").value("approved"))
                .andExpect(jsonPath("$.cartRevision").value(revision))
                .andExpect(jsonPath("$.items[0].productId").value(productId))
                .andExpect(jsonPath("$.items[0].name").value("Canvas Tote"))
                .andExpect(jsonPath("$.items[0].unitPrice").value(12.50))
                .andExpect(jsonPath("$.items[0].quantity").value(2))
                .andExpect(jsonPath("$.items[0].lineSubtotal").value(25.00))
                .andExpect(jsonPath("$.total").value(25.00));

        mockMvc.perform(get("/api/payment-attempts/{attemptId}", attemptId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("approved"))
                .andExpect(jsonPath("$.total").value(25.00));
    }

    @Test
    void initiatesDeclinedAndSimulatedFailureOutcomes() throws Exception {
        var productId = createProduct();
        long revision = addToCart(productId, 1);

        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody("aaaaaaaa-1111-1111-1111-111111111111", revision, "decline")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("declined"));

        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody("bbbbbbbb-2222-2222-2222-222222222222", revision, "temporary-failure")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("failed"));
    }

    @Test
    void replaysAnIdenticalRequestAndRejectsAConflictingPayload() throws Exception {
        var productId = createProduct();
        long revision = addToCart(productId, 1);
        var attemptId = "aaaaaaaa-1111-1111-1111-111111111111";

        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody(attemptId, revision, "decline")))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody(attemptId, revision, "decline")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("declined"));

        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody(attemptId, revision, "approve")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("attempt-id-conflict"));
    }

    @Test
    void rejectsAStaleCartRevisionWithoutCreatingAnAttempt() throws Exception {
        var productId = createProduct();
        long revision = addToCart(productId, 1);
        var attemptId = "aaaaaaaa-1111-1111-1111-111111111111";

        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody(attemptId, revision - 1, "decline")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("cart-changed"));

        mockMvc.perform(get("/api/payment-attempts/{attemptId}", attemptId))
                .andExpect(status().isNotFound());
    }

    @Test
    void rejectsAnEmptyCartWithBadRequest() throws Exception {
        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody("aaaaaaaa-1111-1111-1111-111111111111", 0, "approve")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsANewAttemptForAnAlreadyApprovedRevision() throws Exception {
        var productId = createProduct();
        long revision = addToCart(productId, 1);
        var approvedId = "aaaaaaaa-1111-1111-1111-111111111111";

        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody(approvedId, revision, "approve")))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody("bbbbbbbb-2222-2222-2222-222222222222", revision, "decline")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("already-approved"))
                .andExpect(jsonPath("$.attemptId").value(approvedId));
    }

    @Test
    void rejectsMalformedRequestsAndUnknownAttempts() throws Exception {
        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not-json"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody("aaaaaaaa-1111-1111-1111-111111111111", 0, "refund")))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cartRevision\":0,\"scenario\":\"approve\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"attemptId\":\"aaaaaaaa-1111-1111-1111-111111111111\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/payment-attempts/{attemptId}", "not-a-uuid"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/payment-attempts/{attemptId}", "cccccccc-3333-3333-3333-333333333333"))
                .andExpect(status().isNotFound());
    }

    @Test
    void enforcesCapacityWithoutEvictionAndKeepsReplayLookupAndConflicts() throws Exception {
        var productId = createProduct();
        long revision = addToCart(productId, 1);
        var firstId = "aaaaaaaa-1111-1111-1111-111111111111";

        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody(firstId, revision, "decline")))
                .andExpect(status().isCreated());

        for (int index = 1; index < 32; index++) {
            mockMvc.perform(post("/api/payment-attempts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(initiateBody(String.format("dddddddd-4444-4444-4444-%012d", index), revision, "decline")))
                    .andExpect(status().isCreated());
        }

        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody("eeeeeeee-5555-5555-5555-555555555555", revision, "decline")))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("attempt-capacity-exceeded"));

        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody(firstId, revision, "decline")))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/payment-attempts/{attemptId}", firstId))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/payment-attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody(firstId, revision, "approve")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("attempt-id-conflict"));
    }

    private static String initiateBody(String attemptId, long cartRevision, String scenario) {
        return "{\"attemptId\":\"" + attemptId + "\",\"cartRevision\":" + cartRevision
                + ",\"scenario\":\"" + scenario + "\"}";
    }

    private String createProduct() throws Exception {
        var result = mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Canvas Tote\",\"description\":\"A sturdy everyday tote.\",\"price\":12.50}"))
                .andExpect(status().isCreated())
                .andReturn();

        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }

    private long addToCart(String productId, int quantity) throws Exception {
        var result = mockMvc.perform(post("/api/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + productId + "\",\"quantity\":" + quantity + "}"))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains("\"revision\":1");
        return 1;
    }
}
