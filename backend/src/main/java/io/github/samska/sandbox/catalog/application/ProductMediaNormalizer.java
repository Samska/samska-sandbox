package io.github.samska.sandbox.catalog.application;

import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;
import javax.imageio.stream.MemoryCacheImageInputStream;
import javax.imageio.stream.MemoryCacheImageOutputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ProductMediaNormalizer {

    private static final int JPEG_SIGNATURE_LENGTH = 3;

    private final long maxInputBytes;
    private final int maxDimensionPixels;
    private final long maxPixels;
    private final long maxOutputBytes;

    public ProductMediaNormalizer(
            @Value("${catalog.media.max-input-bytes:" + MediaLimits.MAX_INPUT_BYTES + "}") long maxInputBytes,
            @Value("${catalog.media.max-dimension:" + MediaLimits.MAX_DIMENSION_PIXELS + "}") int maxDimensionPixels,
            @Value("${catalog.media.max-pixels:" + MediaLimits.MAX_PIXELS + "}") long maxPixels,
            @Value("${catalog.media.max-output-bytes:" + MediaLimits.MAX_OUTPUT_BYTES + "}") long maxOutputBytes) {
        this.maxInputBytes = maxInputBytes;
        this.maxDimensionPixels = maxDimensionPixels;
        this.maxPixels = maxPixels;
        this.maxOutputBytes = maxOutputBytes;
    }

    public byte[] normalizeJpeg(byte[] content) {
        if (content == null || content.length == 0) {
            throw new UnsupportedMediaTypeException();
        }
        if (content.length > maxInputBytes) {
            throw new MediaTooLargeException();
        }
        if (!hasJpegSignature(content)) {
            throw new UnsupportedMediaTypeException();
        }

        try (ImageInputStream input = new MemoryCacheImageInputStream(new ByteArrayInputStream(content))) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                throw new InvalidMediaException();
            }

            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, false);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0) {
                    throw new InvalidMediaException();
                }
                if (width > maxDimensionPixels
                        || height > maxDimensionPixels
                        || (long) width * height > maxPixels) {
                    throw new MediaTooLargeException();
                }

                byte[] normalized = encodeJpeg(reader.read(0));
                if (normalized.length > maxOutputBytes) {
                    throw new MediaTooLargeException();
                }
                return normalized;
            } finally {
                reader.dispose();
            }
        } catch (IOException exception) {
            throw new InvalidMediaException();
        }
    }

    private static byte[] encodeJpeg(BufferedImage decoded) throws IOException {
        BufferedImage opaque = new BufferedImage(
                decoded.getWidth(), decoded.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = opaque.createGraphics();
        try {
            graphics.drawImage(decoded, 0, 0, null);
        } finally {
            graphics.dispose();
        }

        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        try (ImageOutputStream output = new MemoryCacheImageOutputStream(bytes)) {
            writer.setOutput(output);
            writer.write(opaque);
        } finally {
            writer.dispose();
        }
        return bytes.toByteArray();
    }

    private static boolean hasJpegSignature(byte[] content) {
        return content.length >= JPEG_SIGNATURE_LENGTH
                && (content[0] & 0xFF) == 0xFF
                && (content[1] & 0xFF) == 0xD8
                && (content[2] & 0xFF) == 0xFF;
    }
}
