package io.github.samska.sandbox.catalog.application;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UploadedMediaTest {

    @Test
    void copiesInputBytesAndNeverExposesStoredBytes() {
        byte[] input = {1, 2, 3};
        var media = new UploadedMedia(UUID.randomUUID(), input);

        input[0] = 9;
        assertThat(media.jpegBytes()).containsExactly(1, 2, 3);

        byte[] returned = media.jpegBytes();
        returned[1] = 9;

        assertThat(media.jpegBytes()).containsExactly(1, 2, 3);
        assertThat(media.byteLength()).isEqualTo(3);
    }
}
