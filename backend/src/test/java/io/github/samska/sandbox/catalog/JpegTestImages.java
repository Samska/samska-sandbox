package io.github.samska.sandbox.catalog;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;

import javax.imageio.ImageIO;

public final class JpegTestImages {

    private JpegTestImages() {
    }

    public static byte[] jpeg(int width, int height) {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = image.createGraphics();
        try {
            graphics.setColor(new Color(32, 96, 160));
            graphics.fillRect(0, 0, width, height);
        } finally {
            graphics.dispose();
        }

        return encode(image);
    }

    private static byte[] encode(BufferedImage image) {
        try {
            var output = new ByteArrayOutputStream();
            if (!ImageIO.write(image, "jpeg", output)) {
                throw new IllegalStateException("No JPEG writer is available");
            }
            return output.toByteArray();
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }
}
