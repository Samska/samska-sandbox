package io.github.samska.sandbox.order.api;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import io.github.samska.sandbox.order.application.OrderStore;
import io.github.samska.sandbox.support.NoDatabaseTest;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@NoDatabaseTest
class OrderApiUnavailableTest {

    @Autowired
    private WebApplicationContext context;

    @MockitoBean
    private OrderStore orderStore;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @Test
    void returnsTheStableUnavailableCodeWhenTheOrderStoreCannotReachTheDatabase() throws Exception {
        when(orderStore.create(any()))
                .thenThrow(new CannotCreateTransactionException("database unavailable"));
        when(orderStore.findById(any())).thenThrow(new DataAccessResourceFailureException("database unavailable"));
        when(orderStore.findByPaymentAttemptId(any()))
                .thenThrow(new DataAccessResourceFailureException("database unavailable"));

        mvc.perform(post("/api/orders").contentType("application/json")
                        .content("{\"paymentAttemptId\":\"" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("order-store-unavailable"));

        mvc.perform(get("/api/orders/{orderId}", UUID.randomUUID()))
                .andExpect(status().isServiceUnavailable())
                .andExpect(content().json("{\"code\":\"order-store-unavailable\"}"));

        mvc.perform(get("/api/orders/payment-attempts/{attemptId}", UUID.randomUUID()))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("order-store-unavailable"));
    }
}
