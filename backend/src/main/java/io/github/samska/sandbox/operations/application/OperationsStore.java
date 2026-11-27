package io.github.samska.sandbox.operations.application;

import java.time.Instant;

public interface OperationsStore {

    record Counts(long ordersLastHour, long ordersLast24Hours, long approved, long declined, long failed) {
    }

    /** Counts of Orders and of Payment attempts by outcome, relative to the given instant. */
    Counts counts(Instant now);

    /** Round-trip time of a trivial query, in milliseconds, or -1 when the database does not answer. */
    long databasePingMillis();
}
