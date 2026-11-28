package io.github.samska.sandbox.order.application;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import io.github.samska.sandbox.order.Order;
import io.github.samska.sandbox.order.OrderSummary;

public interface OrderStore {

    /**
     * Places an Order from the Cart snapshot, taking the stock in the same transaction. A request id that
     * already has an Order returns that Order unchanged.
     */
    OrderResult create(UUID requestId, long cartRevision, CartSnapshotProvider cartSnapshotProvider);

    Optional<Order> findById(UUID orderId);

    /** The signed-in account's Orders, newest first. */
    List<OrderSummary> listForCurrentAccount();

    /** The signed-in account's Order line; empty for an unknown or foreign Order. */
    Optional<OrderSummary> findSummary(UUID orderId);
}
