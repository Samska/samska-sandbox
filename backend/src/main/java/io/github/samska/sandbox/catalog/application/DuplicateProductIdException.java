package io.github.samska.sandbox.catalog.application;

public final class DuplicateProductIdException extends RuntimeException {

    public DuplicateProductIdException() {
        super("A Product with this ID already exists");
    }
}
