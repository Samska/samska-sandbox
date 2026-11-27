package io.github.samska.sandbox.operations.application;

import java.time.Clock;
import java.util.List;

import org.springframework.stereotype.Service;

import io.github.samska.sandbox.operations.OperationsSnapshot;
import io.github.samska.sandbox.operations.OperationsSnapshot.ServiceHealth;
import io.github.samska.sandbox.operations.observability.RequestMetrics;

@Service
public class OperationsService {

    private final OperationsStore store;
    private final RequestMetrics metrics;
    private final Clock clock;

    public OperationsService(OperationsStore store, RequestMetrics metrics, Clock clock) {
        this.store = store;
        this.metrics = metrics;
        this.clock = clock;
    }

    public OperationsSnapshot snapshot() {
        var now = clock.instant();
        var counts = store.counts(now);
        long attempts = counts.approved() + counts.declined() + counts.failed();
        Double approvalRate = attempts == 0 ? null : (double) counts.approved() / attempts;
        long requests = metrics.requests();
        long errors = metrics.serverErrors();
        Double errorRate = requests == 0 ? null : (double) errors / requests;
        long ping = store.databasePingMillis();
        var services = List.of(
                new ServiceHealth("Application", true, 0),
                new ServiceHealth("Database", ping >= 0, Math.max(ping, 0)));
        return new OperationsSnapshot(now, counts.ordersLastHour(), counts.ordersLast24Hours(),
                counts.approved(), counts.declined(), counts.failed(), approvalRate,
                metrics.checkoutP95Millis(), metrics.checkoutSamples(), requests, errors, errorRate, services);
    }
}
