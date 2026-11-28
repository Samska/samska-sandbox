package io.github.samska.sandbox.demo;

public interface DemoStore {

    /** Removes Orders, Carts and non-administrator accounts; resets stock. */
    void reset();
}
