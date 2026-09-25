package io.github.samska.sandbox.catalog.api;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import io.github.samska.sandbox.catalog.JpegTestImages;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "catalog.media.max-total-bytes=1")
class ProductMediaCapacityApiTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp(@Autowired WebApplicationContext applicationContext) {
        mockMvc = MockMvcBuilders.webAppContextSetup(applicationContext).build();
    }

    @Test
    void rejectsUploadWhenTheStoredMediaBudgetIsExhausted() throws Exception {
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
                .andReturn();
        String id = JsonPath.read(creation.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(multipart("/api/products/{id}/media", id)
                        .file(new MockMultipartFile("file", "photo.jpg", "image/jpeg", JpegTestImages.jpeg(32, 32)))
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(content().json("{\"code\":\"storage-capacity-exceeded\"}"));

        mockMvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.uploadedMediaId").isEmpty());
    }
}
