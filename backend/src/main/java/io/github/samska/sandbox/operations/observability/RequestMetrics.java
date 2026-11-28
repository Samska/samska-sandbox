package io.github.samska.sandbox.operations.observability;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

/**
 * In-process request figures, kept in Micrometer meters: {@code samska.requests}, {@code samska.requests.errors}
 * and {@code samska.checkout.duration} (the Order placement request, with a 95th percentile over about 15 minutes).
 */
@Component
public class RequestMetrics {

    private final Counter requests;
    private final Counter serverErrors;
    private final Timer checkout;

    public RequestMetrics(ObjectProvider<MeterRegistry> registries) {
        MeterRegistry registry = registries.getIfAvailable(SimpleMeterRegistry::new);
        this.requests = Counter.builder("samska.requests").description("API requests handled").register(registry);
        this.serverErrors = Counter.builder("samska.requests.errors")
                .description("API requests that ended in a 5xx status").register(registry);
        this.checkout = Timer.builder("samska.checkout.duration")
                .description("Duration of Order placement requests")
                .publishPercentiles(0.95)
                .distributionStatisticExpiry(Duration.ofMinutes(15))
                .distributionStatisticBufferLength(3)
                .register(registry);
    }

    public void record(String method, String path, int status, long nanos) {
        requests.increment();
        if (status >= 500) {
            serverErrors.increment();
        }
        if ("POST".equals(method) && "/api/orders".equals(path)) {
            checkout.record(nanos, TimeUnit.NANOSECONDS);
        }
    }

    public long requests() {
        return (long) requests.count();
    }

    public long serverErrors() {
        return (long) serverErrors.count();
    }

    public long checkoutSamples() {
        return checkout.count();
    }

    /** The 95th percentile in milliseconds, or null before any checkout request. */
    public Double checkoutP95Millis() {
        if (checkout.count() == 0) {
            return null;
        }
        for (var value : checkout.takeSnapshot().percentileValues()) {
            if (value.percentile() == 0.95) {
                return value.value(TimeUnit.MILLISECONDS);
            }
        }
        return null;
    }
}
