package io.github.samska.sandbox.catalog.application;

public final class MediaCapacityExceededException extends RuntimeException {

    public MediaCapacityExceededException() {
        super("Stored Product media has reached its aggregate limit");
    }
}
