package io.github.samska.sandbox.order.application;

import io.github.samska.sandbox.cart.CartSnapshot;

/** Reads the signed-in account's Cart, failing when it is no longer at the revision the customer reviewed. */
@FunctionalInterface
public interface CartSnapshotProvider {

    CartSnapshot capture(long expectedRevision);
}
