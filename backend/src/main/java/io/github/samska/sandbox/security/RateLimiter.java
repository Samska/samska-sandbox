package io.github.samska.sandbox.security;

import java.time.Clock;
import java.util.concurrent.ConcurrentHashMap;

/**
 * A fixed-window counter per key: at most {@code limit} hits per minute. State is in memory and per process,
 * and is bounded: when too many keys are held, expired windows are dropped first.
 */
public final class RateLimiter {

    private static final long WINDOW_MILLIS = 60_000;
    private static final int MAX_KEYS = 10_000;

    public record Decision(boolean allowed, long retryAfterSeconds) {
    }

    private record Window(long start, int count) {
    }

    private final int limit;
    private final Clock clock;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimiter(int limit, Clock clock) {
        this.limit = limit;
        this.clock = clock;
    }

    public Decision hit(String key) {
        long now = clock.millis();
        if (windows.size() > MAX_KEYS) {
            windows.entrySet().removeIf(entry -> now - entry.getValue().start() >= WINDOW_MILLIS);
        }
        var window = windows.compute(key, (k, current) ->
                current == null || now - current.start() >= WINDOW_MILLIS
                        ? new Window(now, 1)
                        : new Window(current.start(), current.count() + 1));
        if (window.count() <= limit) {
            return new Decision(true, 0);
        }
        long remaining = WINDOW_MILLIS - (now - window.start());
        return new Decision(false, Math.max(1, (remaining + 999) / 1000));
    }
}
