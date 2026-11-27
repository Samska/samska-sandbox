package io.github.samska.sandbox.security;

import java.time.Duration;
import java.time.Instant;

import org.junit.jupiter.api.Test;

import io.github.samska.sandbox.support.MutableClock;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimiterTest {

    private final MutableClock clock = new MutableClock(Instant.parse("2026-11-27T10:00:00Z"));

    @Test
    void allowsUpToTheLimitThenRefusesWithARetryDelay() {
        var limiter = new RateLimiter(3, clock);

        for (int i = 0; i < 3; i++) {
            assertThat(limiter.hit("a").allowed()).isTrue();
        }
        clock.advance(Duration.ofSeconds(20));
        var refused = limiter.hit("a");

        assertThat(refused.allowed()).isFalse();
        assertThat(refused.retryAfterSeconds()).isEqualTo(40);
    }

    @Test
    void keysAreIndependent() {
        var limiter = new RateLimiter(1, clock);

        assertThat(limiter.hit("a").allowed()).isTrue();
        assertThat(limiter.hit("a").allowed()).isFalse();
        assertThat(limiter.hit("b").allowed()).isTrue();
    }

    @Test
    void theWindowResetsAfterAMinute() {
        var limiter = new RateLimiter(1, clock);
        limiter.hit("a");
        assertThat(limiter.hit("a").allowed()).isFalse();

        clock.advance(Duration.ofSeconds(60));

        assertThat(limiter.hit("a").allowed()).isTrue();
    }
}
