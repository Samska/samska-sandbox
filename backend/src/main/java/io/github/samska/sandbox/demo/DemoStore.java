package io.github.samska.sandbox.demo;

public interface DemoStore {

    /** Removes Orders, Payment attempts, Carts, reservations and non-administrator accounts; resets stock. */
    void reset();
}
