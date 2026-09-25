package io.github.samska.sandbox.catalog.application;

public final class MediaLimits {

    public static final long MAX_INPUT_BYTES = 2L * 1024 * 1024;
    public static final int MAX_DIMENSION_PIXELS = 2048;
    public static final long MAX_PIXELS = 4_000_000L;
    public static final long MAX_OUTPUT_BYTES = 2L * 1024 * 1024;
    public static final long MAX_TOTAL_STORED_BYTES = 32L * 1024 * 1024;

    private MediaLimits() {
    }
}
