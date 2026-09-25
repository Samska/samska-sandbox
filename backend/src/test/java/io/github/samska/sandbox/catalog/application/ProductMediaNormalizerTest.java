package io.github.samska.sandbox.catalog.application;

import java.io.ByteArrayInputStream;
import java.io.IOException;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.catalog.JpegTestImages;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class ProductMediaNormalizerTest {

    private final ProductMediaNormalizer normalizer = new ProductMediaNormalizer(
            MediaLimits.MAX_INPUT_BYTES,
            MediaLimits.MAX_DIMENSION_PIXELS,
            MediaLimits.MAX_PIXELS,
            MediaLimits.MAX_OUTPUT_BYTES);

    @Test
    void normalizesAValidJpeg() throws IOException {
        byte[] normalized = normalizer.normalizeJpeg(JpegTestImages.jpeg(320, 200));

        var decoded = ImageIO.read(new ByteArrayInputStream(normalized));

        assertThat(decoded).isNotNull();
        assertThat(decoded.getWidth()).isEqualTo(320);
        assertThat(decoded.getHeight()).isEqualTo(200);
    }

    @Test
    void rejectsNonJpegContent() {
        assertThatExceptionOfType(UnsupportedMediaTypeException.class)
                .isThrownBy(() -> normalizer.normalizeJpeg("not an image".getBytes()));
    }

    @Test
    void rejectsEmptyContent() {
        assertThatExceptionOfType(UnsupportedMediaTypeException.class)
                .isThrownBy(() -> normalizer.normalizeJpeg(new byte[0]));
    }

    @Test
    void rejectsMalformedJpegContent() {
        byte[] malformed = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x01, 0x02, 0x03};

        assertThatExceptionOfType(InvalidMediaException.class)
                .isThrownBy(() -> normalizer.normalizeJpeg(malformed));
    }

    @Test
    void rejectsInputBeyondTheInputLimit() {
        var constrained = new ProductMediaNormalizer(100, MediaLimits.MAX_DIMENSION_PIXELS, MediaLimits.MAX_PIXELS,
                MediaLimits.MAX_OUTPUT_BYTES);
        byte[] oversized = new byte[101];
        oversized[0] = (byte) 0xFF;
        oversized[1] = (byte) 0xD8;
        oversized[2] = (byte) 0xFF;

        assertThatExceptionOfType(MediaTooLargeException.class)
                .isThrownBy(() -> constrained.normalizeJpeg(oversized));
    }

    @Test
    void rejectsDimensionBeyondTheDimensionLimit() {
        assertThatExceptionOfType(MediaTooLargeException.class)
                .isThrownBy(() -> normalizer.normalizeJpeg(JpegTestImages.jpeg(2049, 1)));
    }

    @Test
    void rejectsPixelCountBeyondThePixelLimit() {
        assertThatExceptionOfType(MediaTooLargeException.class)
                .isThrownBy(() -> normalizer.normalizeJpeg(JpegTestImages.jpeg(2048, 2048)));
    }

    @Test
    void rejectsOutputBeyondTheOutputLimit() {
        var constrained = new ProductMediaNormalizer(MediaLimits.MAX_INPUT_BYTES, MediaLimits.MAX_DIMENSION_PIXELS,
                MediaLimits.MAX_PIXELS, 10);

        assertThatExceptionOfType(MediaTooLargeException.class)
                .isThrownBy(() -> constrained.normalizeJpeg(JpegTestImages.jpeg(64, 64)));
    }
}
