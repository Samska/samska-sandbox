package io.github.samska.sandbox.operations.observability;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Gives every API request a correlation ID (a safe incoming {@code X-Request-Id} or a new UUID), returns it in the
 * response, exposes it to logs as {@code requestId}, writes one structured line per request and records metrics.
 * It logs the method, path, status and duration only: never headers, query strings, bodies or identities.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestObservabilityFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Request-Id";
    private static final Pattern SAFE_ID = Pattern.compile("[A-Za-z0-9-]{8,64}");
    private static final Logger LOG = LoggerFactory.getLogger("samska.request");

    private final RequestMetrics metrics;

    public RequestObservabilityFilter(RequestMetrics metrics) {
        this.metrics = metrics;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        var incoming = request.getHeader(HEADER);
        var requestId = incoming != null && SAFE_ID.matcher(incoming).matches() ? incoming : UUID.randomUUID().toString();
        MDC.put("requestId", requestId);
        response.setHeader(HEADER, requestId);
        long start = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            long nanos = System.nanoTime() - start;
            int status = response.getStatus();
            metrics.record(request.getMethod(), request.getRequestURI(), status, nanos);
            LOG.info("request method={} path={} status={} durationMs={}",
                    request.getMethod(), request.getRequestURI(), status, nanos / 1_000_000);
            MDC.remove("requestId");
        }
    }
}
