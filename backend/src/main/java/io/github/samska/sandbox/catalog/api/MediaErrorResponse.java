package io.github.samska.sandbox.catalog.api;

public record MediaErrorResponse(String code) {

    public static final String LIMIT_EXCEEDED = "media-limit-exceeded";
    public static final String STORAGE_CAPACITY_EXCEEDED = "storage-capacity-exceeded";

    public static MediaErrorResponse limitExceeded() {
        return new MediaErrorResponse(LIMIT_EXCEEDED);
    }

    public static MediaErrorResponse storageCapacityExceeded() {
        return new MediaErrorResponse(STORAGE_CAPACITY_EXCEEDED);
    }
}
