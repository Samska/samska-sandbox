package io.github.samska.commerce.catalog.api;

import java.util.ArrayList;
import java.util.UUID;

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

import io.github.samska.commerce.CommerceApplication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * R1 parity evidence for the candidate Product HTTP contract.
 *
 * <p>This class pins the frozen R1 expectations in {@code docs/rebuild/PARITY.md}
 * against the candidate bootstrap explicitly. It never imports the legacy
 * application: isolation from {@code io.github.samska.sandbox} is asserted by
 * bean name/type strings only.
 *
 * <p>A fresh candidate context per test method keeps "rejection does not
 * mutate" and insertion-order assertions deterministic without touching the
 * standard runtime.
 */
@SpringBootTest(classes = CommerceApplication.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class R1ParityApiTest {

    private static final String UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";
    private static final String LEGACY_PACKAGE_PREFIX = "io.github.samska.sandbox";

    @Autowired
    private ApplicationContext applicationContext;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp(@Autowired WebApplicationContext webApplicationContext) {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    // R1-C01: exact six-key body, 201, relative Location, generated UUID.
    @Test
    void createsProductWithExactSixKeysAndRelativeLocation() throws Exception {
        var creation = mockMvc.perform(post("/api/products")
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

        var id = JsonPath.<String>read(creation.getResponse().getContentAsString(), "$.id");
        assertThatCode(() -> UUID.fromString(id)).doesNotThrowAnyException();

        var location = creation.getResponse().getHeader("Location");
        assertThat(location).isEqualTo("/api/products/" + id);
        assertThat(location).startsWith("/").doesNotStartWith("http");
    }

    // R1-C04: null, missing and blank name are all empty 400.
    @Test
    void rejectsNullMissingAndBlankName() throws Exception {
        assertBadRequest("""
                {
                  "name": null,
                  "description": "A sample product",
                  "price": 12.50
                }
                """);
        assertBadRequest("""
                {
                  "description": "A sample product",
                  "price": 12.50
                }
                """);
        assertBadRequest("""
                {
                  "name": "   ",
                  "description": "A sample product",
                  "price": 12.50
                }
                """);
    }

    // R1-C04: null, missing and blank description are all empty 400.
    @Test
    void rejectsNullMissingAndBlankDescription() throws Exception {
        assertBadRequest("""
                {
                  "name": "Canvas Tote",
                  "description": null,
                  "price": 12.50
                }
                """);
        assertBadRequest("""
                {
                  "name": "Canvas Tote",
                  "price": 12.50
                }
                """);
        assertBadRequest("""
                {
                  "name": "Canvas Tote",
                  "description": "   ",
                  "price": 12.50
                }
                """);
    }

    // R1-C04: null, missing and negative price are all empty 400.
    @Test
    void rejectsNullMissingAndNegativePrice() throws Exception {
        assertBadRequest("""
                {
                  "name": "Canvas Tote",
                  "description": "A sturdy everyday tote.",
                  "price": null
                }
                """);
        assertBadRequest("""
                {
                  "name": "Canvas Tote",
                  "description": "A sturdy everyday tote."
                }
                """);
        assertBadRequest("""
                {
                  "name": "Canvas Tote",
                  "description": "A sturdy everyday tote.",
                  "price": -0.01
                }
                """);
    }

    // R1-C05: zero and high-scale prices are valid without rounding.
    @Test
    void acceptsZeroAndHighScalePricesWithoutRounding() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Free item",
                                  "description": "A zero-priced product.",
                                  "price": 0
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.price").value(0));

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Precise item",
                                  "description": "A high-scale price.",
                                  "price": 12.3456
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.price").value(12.3456));
    }

    // R1-C05: raw surrounding whitespace in nonblank text is preserved.
    @Test
    void preservesRawSurroundingWhitespace() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "  Padded Name  ",
                                  "description": "  Surrounding spaces  ",
                                  "price": 1
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("  Padded Name  "))
                .andExpect(jsonPath("$.description").value("  Surrounding spaces  "));
    }

    // R1-C06: null, omitted and exactly 40 characters are valid.
    @Test
    void acceptsNullOmittedAndFortyCharacterMediaKey() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "No key",
                                  "description": "Media key null.",
                                  "price": 1,
                                  "mediaKey": null
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mediaKey").isEmpty());

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Omitted key",
                                  "description": "Media key omitted.",
                                  "price": 1
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mediaKey").isEmpty());

        var fortyCharacterKey = "a".repeat(40);
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mediaKeyBody(fortyCharacterKey)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mediaKey").value(fortyCharacterKey));
    }

    // R1-C06: 41 characters, empty, uppercase and invalid slug are empty 400.
    @Test
    void rejectsFortyOneAndInvalidAndEmptyMediaKey() throws Exception {
        assertBadRequest(mediaKeyBody("a".repeat(41)));
        assertBadRequest(mediaKeyBody(""));
        assertBadRequest(mediaKeyBody("Canvas-Tote"));
        assertBadRequest(mediaKeyBody("canvas_tote"));
        assertBadRequest(mediaKeyBody("-canvas-tote"));
    }

    // R1-C04: a rejected create is an empty 400 and leaves the collection alone.
    @Test
    void invalidCreateReturnsEmptyBodyAndDoesNotMutateCollection() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "",
                                  "description": "Description",
                                  "price": 12.50
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(""));

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // R1-C03: unknown well-formed UUID is an empty 404; malformed ID an empty 400.
    @Test
    void unknownAndMalformedIdReturnEmptyBodies() throws Exception {
        mockMvc.perform(get("/api/products/{id}", UNKNOWN_ID))
                .andExpect(status().isNotFound())
                .andExpect(content().string(""));

        mockMvc.perform(get("/api/products/not-a-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(""));
    }

    // R1-C02: collection reflects insertion order with full Product bodies.
    @Test
    void listsProductsInInsertionOrder() throws Exception {
        create("First tote");
        create("Second tote");
        create("Third tote");

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].name").value("First tote"))
                .andExpect(jsonPath("$[1].name").value("Second tote"))
                .andExpect(jsonPath("$[2].name").value("Third tote"))
                .andExpect(jsonPath("$[0].*", hasSize(6)));
    }

    // R1-T01: the candidate context exposes no sandbox beans and no legacy Cart.
    @Test
    void candidateContextHasNoSandboxBeansAndNoCartMapping() throws Exception {
        var legacyBeans = new ArrayList<String>();

        for (var beanName : applicationContext.getBeanDefinitionNames()) {
            Class<?> type;
            try {
                type = applicationContext.getType(beanName);
            } catch (RuntimeException ignored) {
                continue;
            }
            if (type != null && type.getName().startsWith(LEGACY_PACKAGE_PREFIX)) {
                legacyBeans.add(beanName + " -> " + type.getName());
            }
        }

        assertThat(legacyBeans).as("candidate context must not contain legacy beans").isEmpty();
        assertThat(applicationContext.containsBean("samskaSandboxApplication")).isFalse();

        mockMvc.perform(get("/api/cart"))
                .andExpect(status().isNotFound());
    }

    private void assertBadRequest(String json) throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(""));
    }

    private void create(String name) throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "%s",
                                  "description": "Synthetic product for %s.",
                                  "price": 9.99
                                }
                                """.formatted(name, name)))
                .andExpect(status().isCreated());
    }

    private static String mediaKeyBody(String mediaKey) {
        return "{\"name\":\"Canvas Tote\",\"description\":\"A sturdy everyday tote.\",\"price\":12.50,"
                + "\"mediaKey\":\"" + mediaKey + "\"}";
    }
}
