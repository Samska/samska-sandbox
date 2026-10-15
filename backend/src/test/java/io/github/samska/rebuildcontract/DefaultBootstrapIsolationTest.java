package io.github.samska.rebuildcontract;

import java.util.ArrayList;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

// Intentional: this contract test is the only place allowed to import the
// legacy main class, because it must boot the standard application explicitly
// to prove the default bootstrap is untouched by the R1 candidate. Candidate
// production/test sources never import io.github.samska.sandbox.
import io.github.samska.sandbox.SamskaSandboxApplication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Proves the standard bootstrap still owns its capabilities and never picks up
 * the R1 candidate. The context is booted from a freshly dirtied cache so the
 * pre-existing Catalog and Cart state is deterministic for these assertions.
 */
@SpringBootTest(classes = SamskaSandboxApplication.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class DefaultBootstrapIsolationTest {

    private static final String CANDIDATE_PACKAGE_PREFIX = "io.github.samska.commerce";

    @Autowired
    private ApplicationContext applicationContext;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp(@Autowired WebApplicationContext webApplicationContext) {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    @Test
    void standardBootstrapLoadsNoCandidateBeansOrRebuildIdentity() throws Exception {
        var candidateBeans = new ArrayList<String>();

        for (var beanName : applicationContext.getBeanDefinitionNames()) {
            Class<?> type;
            try {
                type = applicationContext.getType(beanName);
            } catch (RuntimeException ignored) {
                continue;
            }
            if (type != null && type.getName().startsWith(CANDIDATE_PACKAGE_PREFIX)) {
                candidateBeans.add(beanName + " -> " + type.getName());
            }
        }

        assertThat(candidateBeans).as("standard context must not contain candidate beans").isEmpty();
        assertThat(applicationContext.containsBean("commerceApplication")).isFalse();

        mockMvc.perform(get("/api/rebuild/runtime"))
                .andExpect(status().isNotFound());
    }

    @Test
    void standardCatalogAndCartAreStillPreserved() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));

        var creation = mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Standard Canvas Tote",
                                  "description": "Synthetic product for the default bootstrap contract.",
                                  "price": 12.50
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.*", hasSize(6)))
                .andExpect(jsonPath("$.uploadedMediaId").isEmpty())
                .andReturn();

        var id = JsonPath.<String>read(creation.getResponse().getContentAsString(), "$.id");
        assertThat(creation.getResponse().getHeader("Location")).isEqualTo("/api/products/" + id);

        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Standard Canvas Tote"))
                .andExpect(jsonPath("$.price").value(12.50));

        mockMvc.perform(get("/api/cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(0)))
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.revision").value(0));
    }
}
