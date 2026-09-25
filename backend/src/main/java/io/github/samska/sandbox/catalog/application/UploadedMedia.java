package io.github.samska.sandbox.catalog.application;

import java.util.UUID;

public record UploadedMedia(UUID id, byte[] jpegBytes) {

    public UploadedMedia {
        if (id == null) {
            throw new IllegalArgumentException("Uploaded media ID must not be null");
        }
        if (jpegBytes == null || jpegBytes.length == 0) {
            throw new IllegalArgumentException("Uploaded media content must not be empty");
        }
        jpegBytes = jpegBytes.clone();
    }

    @Override
    public byte[] jpegBytes() {
        return jpegBytes.clone();
    }

    public int byteLength() {
        return jpegBytes.length;
    }
}
