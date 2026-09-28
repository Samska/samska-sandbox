package io.github.samska.sandbox.payment.application;

import io.github.samska.sandbox.cart.CartSnapshot;

@FunctionalInterface
public interface CartSnapshotProvider {

    CartSnapshot capture(long expectedRevision);
}
