package io.github.samska.sandbox.operations.storage;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;

import org.springframework.jdbc.core.simple.JdbcClient;

import io.github.samska.sandbox.operations.application.OperationsStore;

class JdbcOperationsStore implements OperationsStore {

    private final JdbcClient jdbc;

    JdbcOperationsStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Counts counts(Instant now) {
        var hourAgo = Timestamp.from(now.minus(Duration.ofHours(1)));
        var dayAgo = Timestamp.from(now.minus(Duration.ofHours(24)));
        long lastHour = count("SELECT count(*) FROM orders WHERE created_at >= :since", hourAgo);
        long lastDay = count("SELECT count(*) FROM orders WHERE created_at >= :since", dayAgo);
        return new Counts(lastHour, lastDay);
    }

    private long count(String sql, Timestamp since) {
        return jdbc.sql(sql).param("since", since).query(Long.class).single();
    }

    @Override
    public long databasePingMillis() {
        long start = System.nanoTime();
        try {
            jdbc.sql("SELECT 1").query(Integer.class).single();
            return (System.nanoTime() - start) / 1_000_000;
        } catch (RuntimeException failure) {
            return -1;
        }
    }
}
