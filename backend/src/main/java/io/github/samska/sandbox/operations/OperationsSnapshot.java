package io.github.samska.sandbox.operations;

import java.time.Instant;
import java.util.List;

/**
 * Figures shown on the Operations screen. A null rate or latency means there is nothing to measure yet.
 * Orders and attempts come from SQL; latency, requests and errors come from in-process metrics.
 */
public record OperationsSnapshot(
        Instant generatedAt,
        long ordersLastHour,
        long ordersLast24Hours,
        long approvedAttempts,
        long declinedAttempts,
        long failedAttempts,
        Double approvalRate,
        Double checkoutP95Millis,
        long checkoutSamples,
        long requests,
        long serverErrors,
        Double errorRate,
        List<ServiceHealth> services) {

    public record ServiceHealth(String name, boolean healthy, long latencyMillis) {
    }
}
