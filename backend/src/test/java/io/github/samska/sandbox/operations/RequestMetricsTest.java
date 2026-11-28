package io.github.samska.sandbox.operations;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;

import io.github.samska.sandbox.operations.observability.RequestMetrics;

import static org.assertj.core.api.Assertions.assertThat;

class RequestMetricsTest {

    private static RequestMetrics metrics() {
        var factory = new DefaultListableBeanFactory();
        factory.registerSingleton("registry", new SimpleMeterRegistry());
        return new RequestMetrics(factory.getBeanProvider(io.micrometer.core.instrument.MeterRegistry.class));
    }

    @Test
    void reportsNothingBeforeAnyRequest() {
        var metrics = metrics();

        assertThat(metrics.requests()).isZero();
        assertThat(metrics.checkoutP95Millis()).isNull();
    }

    @Test
    void countsRequestsAndServerErrorsOnly() {
        var metrics = metrics();

        metrics.record("GET", "/api/products", 200, 1_000_000);
        metrics.record("GET", "/api/cart", 404, 1_000_000);
        metrics.record("POST", "/api/products", 500, 1_000_000);

        assertThat(metrics.requests()).isEqualTo(3);
        assertThat(metrics.serverErrors()).isEqualTo(1);
        assertThat(metrics.checkoutSamples()).isZero();
    }

    @Test
    void timesOnlyOrderPlacementRequestsAndReportsTheNinetyFifthPercentile() {
        var metrics = metrics();

        for (int i = 1; i <= 100; i++) {
            metrics.record("POST", "/api/orders", 201, i * 1_000_000L);
        }
        metrics.record("GET", "/api/orders", 200, 900_000_000L);

        assertThat(metrics.checkoutSamples()).isEqualTo(100);
        assertThat(metrics.checkoutP95Millis()).isBetween(90.0, 100.0);
    }
}
